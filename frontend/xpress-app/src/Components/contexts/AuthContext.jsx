import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const API_URL = "http://localhost:5000/api";

// Configure axios to include credentials (this is good!)
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // State for admin status
  const [error, setError] = useState(null); // --- Refactored function to fetch user data and set state ---

  const fetchAndSetUser = async () => {
    // Don't reset loading to true here if called from login/refresh
    setError(null); // Clear previous errors
    try {
      const response = await axios.get(`${API_URL}/user`);
      // Ensure the backend /api/user endpoint returns is_admin
      if (response.data && response.data.id) {
        console.log("Authenticated user data:", response.data);
        setUser(response.data);
        // Set isAdmin based on the response from the backend
        setIsAdmin(response.data.is_admin || false);
      } else {
        // Handle cases where the response might be okay but no user data (e.g., 200 but empty)
        setUser(null);
        setIsAdmin(false);
      }
    } catch (err) {
      // Catch errors (like 401 Unauthorized if not logged in)
      console.log(
        "User not authenticated or error fetching user:",
        err.response?.status
      );
      setUser(null);
      setIsAdmin(false);
      // Optionally set error state if it's not just a "not logged in" error
      // if (err.response?.status !== 401) {
      //   setError("Failed to fetch user status.");
      // }
    } finally {
      // setLoading(false); // We'll set loading false only once in useEffect
    }
  }; // Check auth status on initial load

  useEffect(() => {
    setLoading(true); // Start loading
    const checkAuth = async () => {
      await fetchAndSetUser(); // Use the refactored function
      setLoading(false); // Set loading false after fetch completes
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means run once on mount // Login function

  const login = async (email, password) => {
    setLoading(true); // Optional: indicate loading during login
    setError(null);
    try {
      // Using fetch here, ensure 'credentials: include' is correct
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Correctly sends cookies
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        console.log("Login successful, fetching user details...");
        // IMPORTANT: After successful login, fetch full user data
        // which includes the is_admin flag from the /api/user endpoint.
        await fetchAndSetUser();
        // Remove localStorage reliance - session cookie is the source of truth
        // localStorage.setItem("user", JSON.stringify(data.user)); // Remove this line
        setLoading(false);
        return true;
      } else {
        setError(data.message || "Login failed");
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login.");
      setLoading(false);
      return false;
    }
  }; // Logout function

  const logout = async () => {
    setLoading(true); // Optional: indicate loading during logout
    setError(null);
    try {
      await axios.post(`${API_URL}/logout`); // Uses axios withCredentials
      setUser(null);
      setIsAdmin(false); // Reset isAdmin state on logout
      localStorage.removeItem("user"); // Keep if needed for legacy, but ideally remove usage
      console.log("Logout successful");
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Logout failed");
      console.error("Logout error:", err);
      // Still clear local state even if backend logout fails? Maybe.
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem("user");
      setLoading(false);
      return false;
    }
  }; // Provide user, isAdmin, loading, error, and functions through context

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        error,
        login,
        logout,
        fetchAndSetUser /* Expose if needed */,
      }}
    >
            {children}   {" "}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook remains the same
export const useAuth = () => useContext(AuthContext);
