// components/AdminRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext"; // Removed .jsx extension for better compatibility

/**
 * A protected route component that only allows access to logged-in admin users.
 * If the user is not logged in, it redirects to the login page.
 * If the user is logged in but not an admin, it redirects to the dashboard.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render if the user is an authorized admin.
 * @returns {React.ReactElement | null} - Either the child components or a redirect component.
 */
function AdminRoute({ children }) {
  // Get authentication status, admin status, and loading state from the AuthContext
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  // 1. Handle Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  // 2. Handle Not Logged In
  if (!user) {
    console.log("AdminRoute: User not logged in. Redirecting to login.");
    // Save the attempted URL for redirection after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. Handle Logged In But Not Admin
  // More robust check for admin status
  const hasAdminAccess = isAdmin === true; // Ensures boolean comparison

  if (!hasAdminAccess) {
    console.warn(
      `AdminRoute: Access denied for user ${
        user.email || user.id
      } - not an admin. Redirecting to dashboard.`
    );
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Handle Authorized Admin User
  console.log("AdminRoute: Admin access granted");
  return children;
}

export default AdminRoute;
