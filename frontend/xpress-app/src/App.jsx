// Authors: Joshua, , , , ,

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Components/contexts/AuthContext"; // Verify path

// Page Components
import Home from "./Components/Home.jsx";
import Login from "./Components/Login.jsx";
import Register from "./Components/Register.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import ForgotPassword from "./Components/ForgotPassword.jsx";
import ResetPassword from "./Components/ResetPassword.jsx";
import Profile from "./Components/Profile.jsx";
import AboutUs from "./Components/AboutUs.jsx";
import OilChange from "./Components/OilChange.jsx";
import TireService from "./Components/TireService.jsx";
import Diagnostic from "./Components/Diagnostic.jsx";
import BrakeService from "./Components/BrakeService.jsx";
import Appointment from "./Components/Appointment.jsx";
import ContactForm from "./Components/ContactForm.jsx";
import AdminPage from "./Components/AdminPage.jsx";

// Route Protection Components
import ProtectedRoute from "./Components/ProtectedRoute"; // Import ProtectedRoute
import AdminRoute from "./Components/AdminRoute"; // Import AdminRoute

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/services/oil-change" element={<OilChange />} />
          <Route path="/services/tire-services" element={<TireService />} />
          <Route path="/services/diagnostics" element={<Diagnostic />} />
          <Route path="/services/brake-services" element={<BrakeService />} />
          <Route path="/contactform" element={<ContactForm />} />

          {/* Protected Routes (User must be logged in) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointment"
            element={
              <ProtectedRoute>
                <Appointment />
              </ProtectedRoute>
            }
          />
          {/* Add other routes that require login here, wrapped in <ProtectedRoute> */}

          {/* Admin Route (User must be logged in AND be an admin) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          {/* Optional: Catch-all route for 404 Not Found */}
          {/* <Routes path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
