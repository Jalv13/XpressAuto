import React, { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { authService } from "../Services/authService";
import Header from "./Header";
import Footer from "./Footer";
import "./cssFiles/EditProfile.css"

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: "",
    name: "",
    phone: "",
    address: "",
    profile_picture_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // New state for profile photo file and preview
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const result = await authService.getProfile();
        if (result.success) {
          setProfile(result.data);
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Handle profile form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // New: Handle file input change for profile photo
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  // New: Upload profile photo to backend (which uploads to S3 and updates DB)
  const handleProfilePhotoUpload = async () => {
    if (!profilePhotoFile) return;
    const formData = new FormData();
    formData.append("file", profilePhotoFile);
    const result = await authService.uploadProfilePhoto(formData);
    if (result.success) {
      setProfile((prev) => ({
        ...prev,
        profile_picture_url: result.profile_picture_url,
      }));
      setMessage("Profile photo updated successfully");
    } else {
      setMessage(result.error || "Profile photo upload failed");
    }
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Extract first and last name
    let first_name = "", last_name = "";
    const nameParts = profile.name.trim().split(" ");
    if (nameParts.length > 0) {
      first_name = nameParts[0];
      if (nameParts.length > 1) {
        last_name = nameParts.slice(1).join(" ");
      }
    }

    const payload = {
      first_name,
      last_name,
      phone: profile.phone || "",
      address: profile.address || "",
    };

    console.log("Submitting profile update:", payload);
    const result = await authService.updateProfile(payload);
    if (result.success) {
      setIsSuccess(true);
      setMessage("Profile updated successfully");
    } else {
      setIsSuccess(false);
      setMessage(result.error || "Failed to update profile");
      console.error("Profile update failed:", result.error);
    }
  };

  // Handle password change form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setIsSuccess(false);
      setMessage("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setIsSuccess(false);
      setMessage("New password must be at least 6 characters long");
      return;
    }
    const result = await authService.changePassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );
    if (result.success) {
      setIsSuccess(true);
      setMessage("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setIsSuccess(false);
      setMessage(result.error || "Failed to change password");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <title>Profile</title>
      <Header />
      <div className="profile-container">
        <h1>My Profile</h1>
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Profile Details
          </button>
          <button
            className={`tab-button ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            Change Password
          </button>
        </div>
        {message && (
          <div
            className={`message ${
              isSuccess ? "success-message" : "error-message"
            }`}
          >
            {message}
          </div>
        )}
        {activeTab === "details" && (
          <div className="tab-content">
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label htmlFor="username">Email (Username)</label>
                <input
                  type="email"
                  id="username"
                  name="username"
                  value={profile.username || ""}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name || ""}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone || ""}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={profile.address || ""}
                  onChange={handleProfileChange}
                  rows="3"
                ></textarea>
              </div>
              {/* New: Profile photo upload */}
              <div className="form-group profile-photo-section">
                <label htmlFor="profilePhoto">Profile Photo</label>
                <div className="profile-photo-preview">
                  <img
                    src={
                      profilePhotoPreview ||
                      profile.profile_picture_url ||
                      user?.profile_picture_url ||
                      "/default-profile.png"
                    }
                    alt="Profile"
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: "10px",
                    }}
                  />
                </div>
                <input
                  type="file"
                  id="profilePhoto"
                  name="profilePhoto"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                />
                {profilePhotoFile && (
                  <button
                    type="button"
                    className="upload-photo-button"
                    onClick={handleProfilePhotoUpload}
                    style={{ marginTop: "10px" }}
                  >
                    Upload Profile Photo
                  </button>
                )}
              </div>
              <button type="submit" className="submit-button">
                Update Profile
              </button>
            </form>
          </div>
        )}
        {activeTab === "password" && (
          <div className="tab-content">
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <button type="submit" className="submit-button">
                Change Password
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Profile;