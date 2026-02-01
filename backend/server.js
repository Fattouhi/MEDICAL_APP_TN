const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection with error handling
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("MySQL Connected Successfully");
});

// Middleware for authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Register endpoint
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashed],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Username already exists" });
          }
          return res.status(500).json({ message: "Error creating user" });
        }
        res.json({ message: "User created successfully" });
      },
    );
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      if (!results.length) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const match = await bcrypt.compare(password, results[0].password);
      if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: results[0].id, username: results[0].username },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.json({
        token,
        username: results[0].username,
      });
    },
  );
});

// Get all records for authenticated user
app.get("/records", authenticate, (req, res) => {
  const { search } = req.query;

  let query = "SELECT * FROM medical_records WHERE user_id = ?";
  let params = [req.user.id];

  if (search) {
    query += " AND (patient_name LIKE ? OR notes LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY date DESC, id DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching records" });
    }
    res.json(results);
  });
});

// Get single record
app.get("/records/:id", authenticate, (req, res) => {
  db.query(
    "SELECT * FROM medical_records WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching record" });
      }
      if (!results.length) {
        return res.status(404).json({ message: "Record not found" });
      }
      res.json(results[0]);
    },
  );
});

// Create new record
app.post("/records", authenticate, (req, res) => {
  const { patient_name, age, blood_pressure, cholesterol, notes, date } =
    req.body;

  // Validation
  if (!patient_name || !age) {
    return res
      .status(400)
      .json({ message: "Patient name and age are required" });
  }

  db.query(
    "INSERT INTO medical_records (patient_name, age, blood_pressure, cholesterol, notes, date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      patient_name,
      age,
      blood_pressure || null,
      cholesterol || null,
      notes || null,
      date || null,
      req.user.id,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error creating record" });
      }
      res.json({
        id: result.insertId,
        message: "Record created successfully",
      });
    },
  );
});

// Update record - FIXED
app.put("/records/:id", authenticate, (req, res) => {
  const { patient_name, age, blood_pressure, cholesterol, notes, date } =
    req.body;

  // Validation
  if (!patient_name || !age) {
    return res
      .status(400)
      .json({ message: "Patient name and age are required" });
  }

  db.query(
    "UPDATE medical_records SET patient_name=?, age=?, blood_pressure=?, cholesterol=?, notes=?, date=? WHERE id=? AND user_id=?",
    [
      patient_name,
      age,
      blood_pressure || null,
      cholesterol || null,
      notes || null,
      date || null,
      req.params.id,
      req.user.id,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating record" });
      }
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Record not found or unauthorized" });
      }
      res.json({ message: "Record updated successfully" });
    },
  );
});

// Delete record
app.delete("/records/:id", authenticate, (req, res) => {
  db.query(
    "DELETE FROM medical_records WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error deleting record" });
      }
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Record not found or unauthorized" });
      }
      res.json({ message: "Record deleted successfully" });
    },
  );
});

// Dashboard statistics
app.get("/dashboard/stats", authenticate, (req, res) => {
  db.query(
    `SELECT 
      COUNT(*) as total_records,
      AVG(age) as avg_age,
      AVG(cholesterol) as avg_cholesterol,
      COUNT(CASE WHEN cholesterol > 200 THEN 1 END) as high_cholesterol_count,
      COUNT(CASE WHEN CAST(SUBSTRING_INDEX(blood_pressure, '/', 1) AS UNSIGNED) > 140 THEN 1 END) as high_bp_count
    FROM medical_records 
    WHERE user_id = ?`,
    [req.user.id],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching statistics" });
      }
      res.json(stats[0]);
    },
  );
});

// Analysis endpoint - enhanced
app.get("/analysis", authenticate, (req, res) => {
  db.query(
    `SELECT 
      AVG(age) as avg_age, 
      AVG(cholesterol) as avg_chol,
      MIN(cholesterol) as min_chol,
      MAX(cholesterol) as max_chol,
      COUNT(*) as total_count
    FROM medical_records 
    WHERE user_id = ?`,
    [req.user.id],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching analysis" });
      }

      db.query(
        `SELECT id, patient_name, cholesterol, blood_pressure, date 
        FROM medical_records 
        WHERE user_id = ? AND (
          cholesterol > 200 OR 
          CAST(SUBSTRING_INDEX(blood_pressure, '/', 1) AS UNSIGNED) > 140 OR
          CAST(SUBSTRING_INDEX(blood_pressure, '/', -1) AS UNSIGNED) > 90
        )
        ORDER BY date DESC`,
        [req.user.id],
        (err, risks) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error fetching risk data" });
          }

          res.json({
            stats: stats[0],
            risks: risks.map((r) => ({
              id: r.id,
              patient_name: r.patient_name,
              cholesterol: r.cholesterol,
              blood_pressure: r.blood_pressure,
              date: r.date,
              flags: [
                r.cholesterol > 200 ? "High Cholesterol" : null,
                r.blood_pressure &&
                parseInt(r.blood_pressure.split("/")[0]) > 140
                  ? "High Systolic BP"
                  : null,
                r.blood_pressure &&
                parseInt(r.blood_pressure.split("/")[1]) > 90
                  ? "High Diastolic BP"
                  : null,
              ].filter(Boolean),
            })),
          });
        },
      );
    },
  );
});

// PDF Generation - FIXED with proper headers
app.get("/pdf/:id", authenticate, (req, res) => {
  db.query(
    "SELECT * FROM medical_records WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching record" });
      }

      if (!results.length) {
        return res.status(404).json({ message: "Record not found" });
      }

      const record = results[0];
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `medical_record_${record.patient_name.replace(/\s+/g, "_")}_${record.id}.pdf`;

      // Set headers before piping
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );

      // Pipe the PDF to response
      doc.pipe(res);

      // Header
      doc
        .fontSize(24)
        .fillColor("#1976d2")
        .text("Medical Record Report", { align: "center" })
        .moveDown();

      // Horizontal line
      doc
        .strokeColor("#1976d2")
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown();

      // Patient Information
      doc
        .fontSize(16)
        .fillColor("#000")
        .text("Patient Information", { underline: true })
        .moveDown(0.5);

      doc.fontSize(12);
      doc.text(`Patient Name: ${record.patient_name}`, { continued: false });
      doc.text(`Age: ${record.age} years`);
      doc.text(`Date of Record: ${record.date || "N/A"}`);
      doc.moveDown();

      // Vital Signs
      doc
        .fontSize(16)
        .text("Vital Signs & Measurements", { underline: true })
        .moveDown(0.5);

      doc.fontSize(12);
      doc.text(`Blood Pressure: ${record.blood_pressure || "Not recorded"}`);
      doc.text(
        `Cholesterol Level: ${record.cholesterol ? record.cholesterol + " mg/dL" : "Not recorded"}`,
      );
      doc.moveDown();

      // Risk Assessment
      doc
        .fontSize(16)
        .text("Risk Assessment", { underline: true })
        .moveDown(0.5);

      doc.fontSize(12);
      const risks = [];
      if (record.cholesterol > 200) {
        risks.push("⚠ High Cholesterol (>200 mg/dL)");
      }
      if (record.blood_pressure) {
        const [systolic, diastolic] = record.blood_pressure
          .split("/")
          .map(Number);
        if (systolic > 140) risks.push("⚠ High Systolic Blood Pressure (>140)");
        if (diastolic > 90) risks.push("⚠ High Diastolic Blood Pressure (>90)");
      }

      if (risks.length > 0) {
        doc.fillColor("#dc004e");
        risks.forEach((risk) => doc.text(risk));
        doc.fillColor("#000");
      } else {
        doc
          .fillColor("#4caf50")
          .text("✓ No high-risk indicators detected")
          .fillColor("#000");
      }
      doc.moveDown();

      // Notes
      if (record.notes) {
        doc
          .fontSize(16)
          .text("Clinical Notes", { underline: true })
          .moveDown(0.5);

        doc.fontSize(12).text(record.notes, { align: "justify" });
        doc.moveDown();
      }

      // Footer
      doc
        .fontSize(10)
        .fillColor("#666")
        .text(
          `Generated on ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: "center" },
        );

      doc.end();
    },
  );
});

// Export all records as CSV
app.get("/export/csv", authenticate, (req, res) => {
  db.query(
    "SELECT * FROM medical_records WHERE user_id = ? ORDER BY date DESC",
    [req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error exporting records" });
      }

      const csv = ["ID,Patient Name,Age,Blood Pressure,Cholesterol,Date,Notes"];

      results.forEach((record) => {
        csv.push(
          [
            record.id,
            `"${record.patient_name}"`,
            record.age,
            record.blood_pressure || "",
            record.cholesterol || "",
            record.date || "",
            `"${(record.notes || "").replace(/"/g, '""')}"`,
          ].join(","),
        );
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="medical_records.csv"',
      );
      res.send(csv.join("\n"));
    },
  );
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
