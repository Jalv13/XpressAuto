//Authors: Joshua, , , , ,

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Components/contexts/AuthContext";
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
import ContactUs from "./Components/ContactUs.jsx";
import ContactForm from "./Components/ContactForm.jsx";
import AdminPage from "./Components/AdminPage.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/services/oil-change" element={<OilChange />} />
          <Route path="/services/tire-services" element={<TireService />} />
          <Route path="/services/diagnostics" element={<Diagnostic />} />\
          <Route path="/services/brake-services" element={<BrakeService />} />\
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/contactform" element={<ContactForm />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
