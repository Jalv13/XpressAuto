// src/contexts/AuthContext.js
import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Configure axios to include credentials
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/user`);
        setUser(response.data);
      } catch (error) {
        console.log("User not authenticated"); // User is not logged in, this is expected behavior
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }) // Ensure correct field names
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user); // ✅ Fixed: Now updates state correctly
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

  // Logout function
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

export const useAuth = () => useContext(AuthContext);
