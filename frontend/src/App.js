// src/App.js
import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Snackbar,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const API_URL = "http://localhost:5000";

// ── Enhanced Theme ────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    success: { main: "#4caf50" },
    warning: { main: "#ff9800" },
    error: { main: "#f44336" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

// ── Protected Route Wrapper ───────────────────────────────────────────
function ProtectedRoute({ children, token }) {
  return token ? children : <Navigate to="/login" replace />;
}

// ── Navigation Bar Component ──────────────────────────────────────────
function NavBar({ username, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <DashboardIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Medical Records System
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            icon={<PersonIcon />}
            label={username || "User"}
            color="primary"
            variant="outlined"
            sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "white" }}
          />
          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
            aria-label="account menu"
          >
            <PersonIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

// ── Login Page ────────────────────────────────────────────────────────
function Login({ setToken, setUsername }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError("Please fill in both fields");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/login`, formData);
      const { token, username } = res.data;
      setToken(token);
      setUsername(username);
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);
      navigate("/records", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={4} sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <DashboardIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" color="primary" gutterBottom>
            Medical Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to access your dashboard
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Username"
            name="username"
            variant="outlined"
            fullWidth
            value={formData.username}
            onChange={handleChange}
            autoFocus
            disabled={loading}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            variant="outlined"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

// ── Dashboard Stats Component ─────────────────────────────────────────
function DashboardStats({ stats }) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom variant="body2">
              Total Records
            </Typography>
            <Typography variant="h4" color="primary">
              {stats?.total_records || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom variant="body2">
              Average Age
            </Typography>
            <Typography variant="h4" color="primary">
              {stats?.avg_age ? Number(stats.avg_age).toFixed(1) : "—"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom variant="body2">
              Avg Cholesterol
            </Typography>
            <Typography variant="h4" color="primary">
              {stats?.avg_cholesterol
                ? Number(stats.avg_cholesterol).toFixed(0)
                : "—"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom variant="body2">
              High Risk
            </Typography>
            <Typography variant="h4" color="error">
              {(stats?.high_cholesterol_count || 0) +
                (stats?.high_bp_count || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ── Records Page (Main Dashboard) ─────────────────────────────────────
function Records({ token, username, onLogout }) {
  const [allRecords, setAllRecords] = useState([]); // Store all records
  const [stats, setStats] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    patient_name: "",
    age: "",
    blood_pressure: "",
    cholesterol: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Client-side filtering - happens instantly without server calls
  const filteredRecords = allRecords.filter((record) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.patient_name.toLowerCase().includes(query) ||
      (record.notes && record.notes.toLowerCase().includes(query))
    );
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, statsRes, anaRes] = await Promise.all([
        axios.get(`${API_URL}/records`, config),
        axios.get(`${API_URL}/dashboard/stats`, config),
        axios.get(`${API_URL}/analysis`, config),
      ]);
      setAllRecords(recRes.data);
      setStats(statsRes.data);
      setAnalysis(anaRes.data);
    } catch (err) {
      showSnackbar("Failed to load data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patient_name || !form.age) {
      showSnackbar("Patient name and age are required", "error");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_URL}/records/${editId}`, form, config);
        showSnackbar("Record updated successfully");
      } else {
        await axios.post(`${API_URL}/records`, form, config);
        showSnackbar("Record created successfully");
      }

      await fetchData();
      resetForm();
      setDialogOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save record";
      showSnackbar(msg, "error");
    }
  };

  const resetForm = () => {
    setForm({
      patient_name: "",
      age: "",
      blood_pressure: "",
      cholesterol: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    });
    setEditId(null);
  };

  const handleEdit = (rec) => {
    setForm({
      patient_name: rec.patient_name,
      age: rec.age,
      blood_pressure: rec.blood_pressure || "",
      cholesterol: rec.cholesterol || "",
      notes: rec.notes || "",
      date: rec.date || "",
    });
    setEditId(rec.id);
    setDialogOpen(true);
  };

  const confirmDelete = (id) => {
    setRecordToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/records/${recordToDelete}`, config);
      setAllRecords(allRecords.filter((r) => r.id !== recordToDelete));
      showSnackbar("Record deleted successfully");
      setDeleteDialogOpen(false);
      await fetchData();
    } catch (err) {
      showSnackbar("Failed to delete record", "error");
    }
  };

  const handlePDF = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/pdf/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `medical_record_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar("PDF downloaded successfully");
    } catch (err) {
      showSnackbar("Failed to download PDF", "error");
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API_URL}/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "medical_records.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar("CSV exported successfully");
    } catch (err) {
      showSnackbar("Failed to export CSV", "error");
    }
  };

  return (
    <>
      <NavBar username={username} onLogout={onLogout} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" color="primary">
            Dashboard
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              Add Record
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <DashboardStats stats={stats} />

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search by patient name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery("")}
                        edge="end"
                        aria-label="clear search"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>

            {/* Records List */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Medical Records ({filteredRecords.length}
                {searchQuery ? ` of ${allRecords.length}` : ""})
              </Typography>

              {filteredRecords.length === 0 ? (
                <Alert severity="info">
                  {searchQuery
                    ? "No records found matching your search."
                    : "No records yet. Click 'Add Record' to create one."}
                </Alert>
              ) : (
                <List>
                  {filteredRecords.map((rec, index) => (
                    <React.Fragment key={rec.id}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight={600}>
                                {rec.patient_name}
                              </Typography>
                              <Chip label={`Age ${rec.age}`} size="small" />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                BP: {rec.blood_pressure || "—"} • Cholesterol:{" "}
                                {rec.cholesterol || "—"} mg/dL
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Date: {rec.date || "—"}
                              </Typography>
                              {rec.notes && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  Notes: {rec.notes.substring(0, 100)}
                                  {rec.notes.length > 100 ? "..." : ""}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEdit(rec)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => confirmDelete(rec.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handlePDF(rec.id)}
                            >
                              PDF
                            </Button>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {/* Analysis Section */}
            {analysis && analysis.stats.total_count > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Health Analysis
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      Average Age:{" "}
                      <strong>
                        {analysis.stats.avg_age
                          ? Number(analysis.stats.avg_age).toFixed(1)
                          : "—"}
                      </strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      Average Cholesterol:{" "}
                      <strong>
                        {analysis.stats.avg_chol
                          ? Number(analysis.stats.avg_chol).toFixed(0)
                          : "—"}{" "}
                        mg/dL
                      </strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      Cholesterol Range:{" "}
                      <strong>
                        {analysis.stats.min_chol || "—"} -{" "}
                        {analysis.stats.max_chol || "—"} mg/dL
                      </strong>
                    </Typography>
                  </Grid>
                </Grid>

                {analysis.risks?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" color="error" gutterBottom>
                      High Risk Alerts ({analysis.risks.length})
                    </Typography>
                    <List dense>
                      {analysis.risks.map((r) => (
                        <ListItem key={r.id}>
                          <ListItemText
                            primary={r.patient_name}
                            secondary={
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  mt: 0.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                {r.flags.map((flag, idx) => (
                                  <Chip
                                    key={idx}
                                    label={flag}
                                    size="small"
                                    color="error"
                                  />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Paper>
            )}
          </>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editId ? "Edit Medical Record" : "Add New Medical Record"}
          </DialogTitle>
          <DialogContent>
            <Box
              component="form"
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                mt: 1,
              }}
            >
              <TextField
                name="patient_name"
                label="Patient Name *"
                value={form.patient_name}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                name="age"
                label="Age *"
                type="number"
                value={form.age}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                name="blood_pressure"
                label="Blood Pressure (e.g. 120/80)"
                value={form.blood_pressure}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                name="cholesterol"
                label="Cholesterol (mg/dL)"
                type="number"
                value={form.cholesterol}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                name="date"
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={handleChange}
                sx={{ gridColumn: { sm: "1 / -1" } }}
                fullWidth
              />
              <TextField
                name="notes"
                label="Clinical Notes"
                multiline
                rows={4}
                value={form.notes}
                onChange={handleChange}
                sx={{ gridColumn: { sm: "1 / -1" } }}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editId ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this medical record? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────
function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || null,
  );

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          <Routes>
            <Route
              path="/login"
              element={<Login setToken={setToken} setUsername={setUsername} />}
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute token={token}>
                  <Records
                    token={token}
                    username={username}
                    onLogout={handleLogout}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<Navigate to={token ? "/records" : "/login"} replace />}
            />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
