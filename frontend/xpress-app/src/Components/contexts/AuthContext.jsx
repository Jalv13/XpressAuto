import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const API_URL = "http://localhost:5000/api";

// Configure axios to include credentials
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on initial load with a minimum delay
  useEffect(() => {
    const checkAuthStatus = async () => {
      const startTime = Date.now();
      try {
        const response = await axios.get(`${API_URL}/user`);
        console.log("Authenticated user:", response.data);
        setUser(response.data);
      } catch (error) {
        console.log("User not authenticated");
      } finally {
        // Ensure the loading state lasts at least minDelay
        const elapsed = Date.now() - startTime;
        const minDelay = 5000; // Adjust as needed (5000ms is 5 seconds)
        if (elapsed < minDelay) {
          setTimeout(() => {
            setLoading(false);
          }, minDelay - elapsed);
        } else {
          setLoading(false);
        }
      }
    };

    checkAuthStatus();
  }, []);

  // Login function remains unchanged
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent with the request
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        return true;
      } else {
        setError(data.message || "Login failed");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login.");
      return false;
    }
  };

  // Logout function remains unchanged
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
      setUser(null);
      localStorage.removeItem("user");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Logout failed");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
