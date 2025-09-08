import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PatientProvider } from "./contexts/PatientContext";
import LoginPageNew from "./components/LoginPageNew";
import DashboardNew from "./components/DashboardNew";
import PatientProfile from "./components/PatientProfile";
import AdminPanelNew from "./components/AdminPanelNew";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import NewPasswordPage from "./components/NewPasswordPage";
import PsychologistSetupPage from "./components/PsychologistSetupPage";

// Define the route structure using the data router format
const router = createBrowserRouter(
  [
    // Public routes
    {
      path: "/login",
      element: <LoginPageNew />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPasswordPage />,
    },
    {
      path: "/reset-password",
      element: <ResetPasswordPage />,
    },
    {
      path: "/new-password",
      element: <NewPasswordPage />,
    },
    {
      path: "/psychologist-setup/:email/:inviteCode",
      element: <PsychologistSetupPage />,
    },
    {
      path: "/psychologist-setup",
      element: <PsychologistSetupPage />,
    },
    {
      path: "/",
      element: <Navigate to="/login" replace />,
    },

    // Protected routes for all authenticated users (wrapped with PatientProvider)
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: (
            <PatientProvider>
              <Outlet />
            </PatientProvider>
          ),
          children: [
            {
              path: "/dashboard",
              element: <DashboardNew />,
            },
            {
              path: "/patient/:patientId",
              element: <PatientProfile />,
            },
          ],
        },
      ],
    },

    // Protected routes for admin only
    {
      element: <ProtectedRoute requireAdmin={true} />,
      children: [
        {
          path: "/admin",
          element: <AdminPanelNew />,
        },
      ],
    },

    // Fallback route
    {
      path: "*",
      element: <Navigate to="/login" replace />,
    },
  ],
  {
    // Enable future flags to address deprecation warnings
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
