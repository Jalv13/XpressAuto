//Authors: Joshua, , , , ,

import axios from "axios";

// Set the base URL to your Flask backend
const API_URL = "http://localhost:5000/api";

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

// Authentication service methods
export const authService = {
  // Fetch user profile data using GET /api/user
  getProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}/user`, {
        withCredentials: true,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
  updateProfile: async (profileData) => {
    try {
      console.log("Sending profile update:", profileData);
      const response = await axios.put(`${API_URL}/profile`, profileData, {
        withCredentials: true,
      });
      console.log("Profile update response:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Profile update error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update profile",
      };
    }
  },

  // Logout function
  logout: async () => {
    try {
      await axios.post(`${API_URL}/logout`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Logout failed",
      };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await axios.get(`${API_URL}/user`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false };
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/request-password-reset`, {
        email,
      });
      return {
        success: true,
        data: response.data,
        // In development, we're passing the token from the backend for testing
        // In production, this would come via email
        token: response.data.debug_token,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to request password reset",
      };
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await axios.post(`${API_URL}/reset-password`, {
        token,
        password,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to reset password",
      };
    }
  },

  addUser: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/add-user`, userData);
      return {
        success: true,
        data: response.data,
        userId: response.data.user_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to add user",
      };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/change-password`, {
        currentPassword,
        newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to change password",
      };
    }
  },

  uploadProfilePhoto: async (formData) => {
    try {
      const response = await axios.post(
        `${API_URL}/upload-profile-photo`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Profile photo upload error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Profile photo upload failed",
      };
    }
  },
};
