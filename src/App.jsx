import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PatientProvider } from "./contexts/PatientContext";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import PatientProfile from "./components/PatientProfile";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import NewPasswordPage from "./components/NewPasswordPage";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <PatientProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/new-password" element={<NewPasswordPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected routes for all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patient/:patientId" element={<PatientProfile />} />
            </Route>

            {/* Protected routes for admin only */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </PatientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
