//Authors: Joshua, , , , ,


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../Services/authService.js";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    // Option 1: Use the original register method
    // const result = await authService.register(username, password);

    // Option 2: Use the addUser method to take advantage of your /add-user endpoint
    const result = await authService.addUser({
      email: username,
      password: password,
      first_name: firstName,
      last_name: lastName,
      phone: phone
    });

    if (result.success) {
      // Redirect to dashboard or home after successful registration
      navigate("/dashboard");
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="login-page">
        <div className="login-container">
          <h2>Create an Account</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Email</label>
              <input
                type="email"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            {/* Additional fields for the /add-user endpoint */}
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>
          <div className="auth-links">
            Already have an account? <a href="/login">Login</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Register;