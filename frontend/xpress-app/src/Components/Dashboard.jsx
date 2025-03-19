import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";
import ContentLoader from "react-content-loader"; // For animated skeletons
import Modal from "react-modal";
import { Copy, Trash2, X } from "lucide-react";

function Dashboard() {
  const { user, loading } = useAuth();
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [theme, setTheme] = useState("light");
  const [message, setMessage] = useState(""); // Add message state for feedback
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [vehiclesMedia, setVehiclesMedia] = useState([]);
  const [mediaLoading, setVehiclesMediaLoading] = useState(false);
  const [showAddPhotoForm, setShowAddPhotoForm] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [photoDescription, setPhotoDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [invoices, setInvoices] = useState([]);

  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState("");

  // State for toggling the Add Vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  // State for vehicle form data (extended to match your table)
  const [vehicleData, setVehicleData] = useState({
    vehicle_id: null, // Added for editing vehicles
    make: "",
    model: "",
    year: "",
    vin: "",
    license_plate: "",
    color: "",
    mileage: "",
    engine_type: "",
    transmission: "",
    is_primary: false,
    vehicle_image_url: "", // Matching DB column name
  });

  const fetchUserMedia = () => {
    setMessage("Loading photos...");
    axios
      .get("http://localhost:5000/api/get-user-media", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.status === "success") {
          setVehiclesMedia(res.data.vehicles_media);
          setMessage("");
        } else {
          setMessage("Failed to load photos.");
        }
      })
      .catch((err) => {
        console.error("Error fetching media:", err);
        setMessage("Error loading photos.");
      });
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setMessage("Photo link copied!");
      setTimeout(() => setMessage(""), 2000); // Clears the message after 2 seconds
    });
  };

  const handleDeleteMedia = (media_id) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    axios
      .delete(`http://localhost:5000/api/delete-media/${media_id}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.status === "success") {
          setMessage("Photo deleted successfully!");
          fetchUserMedia(); // Refresh photos after deletion
        } else {
          setMessage(res.data.message || "Error deleting photo");
        }
      })
      .catch((err) => {
        console.error("Delete media error:", err);
        setMessage("Error deleting photo");
      });
  };

  // Fetch loyalty points, notifications, and vehicles on mount
  useEffect(() => {
    if (user) {
      axios
        .get("http://localhost:5000/api/get-loyalty-points", {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.status === "success") {
            setLoyaltyPoints(res.data.points);
          }
        })
        .catch((err) => console.error("Error fetching loyalty points", err));

      axios
        .get("http://localhost:5000/api/get-notifications", {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.status === "success") {
            setNotifications(res.data.notifications);
          }
        })
        .catch((err) => console.error("Error fetching notifications", err));

      fetchVehicles();
    }
  }, [user]);

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadNewPhoto = async (e) => {
    e.preventDefault();

    if (!photoFile || !selectedVehicleId) {
      setMessage("Please select a vehicle and choose a photo.");
      return;
    }

    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("vehicle_id", selectedVehicleId);
    formData.append("description", photoDescription || "");

    try {
      setMessage("Uploading photo...");
      const res = await axios.post(
        "http://localhost:5000/api/upload-media",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.status === "success") {
        setMessage("Photo uploaded successfully!");
        fetchUserMedia();
        // Reset form fields
        setPhotoFile(null);
        setPhotoPreview("");
        setPhotoDescription("");
        setSelectedVehicleId("");
        setShowAddPhotoForm(false);
      } else {
        setMessage(res.data.message || "Failed to upload photo.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("An error occurred while uploading.");
    }
  };

  const handleVehiclePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehiclePhotoFile(file);
      setVehiclePhotoPreview(URL.createObjectURL(file));
    }
  };

  // Upload Vehicle photo to backend (which uploads to S3 and updates DB)
  const handleVehiclePhotoUpload = async () => {
    if (!vehiclePhotoFile) return null; // Return null if no file

    const formData = new FormData();
    formData.append("file", vehiclePhotoFile);

    // If we have a vehicle ID (for existing vehicles), include it in the request
    if (vehicleData.vehicle_id) {
      formData.append("vehicle_id", vehicleData.vehicle_id);
    }

    try {
      setMessage("Uploading photo...");
      console.log("Uploading vehicle photo...");

      const response = await axios.post(
        "http://localhost:5000/api/upload-vehicle-photo",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload response:", response.data);

      if (response.data.status === "success") {
        setMessage("Vehicle photo uploaded successfully");
        return response.data.vehicle_image_url; // Return the URL on success
      } else {
        setMessage(response.data.message || "Vehicle photo upload failed");
        console.error("Upload failed:", response.data.message);
        return null; // Return null on failure
      }
    } catch (error) {
      console.error("Error uploading vehicle photo:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      setMessage("Error uploading vehicle photo");
      return null; // Return null on error
    }
  };
  //add photo function
  const handlePhotoFileUpload = async (e) => {
    e.preventDefault();

    if (!photoFile || !selectedVehicleId) {
      setMessage("Please select a vehicle and a photo.");
      return;
    }

    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("vehicle_id", selectedVehicleId);
    formData.append("description", photoDescription || "");

    try {
      setMessage("Uploading photo...");
      const res = await axios.post(
        "http://localhost:5000/api/upload-vehicle-photo",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.status === "success") {
        setMessage("Photo uploaded successfully!");
        fetchUserMedia();
        // Reset form fields
        setPhotoFile(null);
        setPhotoPreview("");
        setPhotoDescription("");
        setSelectedVehicleId("");
        setShowAddPhotoForm(false);
      } else {
        setMessage(res.data.message || "Failed to upload photo.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("An error occurred while uploading.");
    }
  };

  // Function to fetch vehicles for the user
  const fetchVehicles = () => {
    axios
      .get("http://localhost:5000/api/get-vehicles", { withCredentials: true })
      .then((res) => {
        if (res.data.status === "success") {
          console.log("Vehicles fetched:", res.data.vehicles);
          setVehicles(res.data.vehicles);
        }
      })
      .catch((err) => console.error("Error fetching vehicles", err));
  };

  const getDisplayName = () => {
    if (!user) return "Guest";
    if (user.name && user.name.trim() !== "") return user.name;
    if (user.first_name) return user.first_name;
    return "Guest";
  };

  // Dismiss a notification and update state (calls backend API)
  const dismissNotification = async (notificationId) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/mark-notification-read/${notificationId}`,
        {},
        { withCredentials: true }
      );
      if (res.data.status === "success") {
        setNotifications((prev) =>
          prev.filter((n) => n.notification_id !== notificationId)
        );
      } else {
        console.error("Error marking notification as read:", res.data.message);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle changes in vehicle form fields
  const handleVehicleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for adding a vehicle
  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing vehicle information...");

    try {
      // Data to submit to the backend
      let dataToSubmit = { ...vehicleData };

      // If we have a vehicle photo file, upload it first
      if (vehiclePhotoFile) {
        console.log("Uploading vehicle photo before adding vehicle");
        const imageUrl = await handleVehiclePhotoUpload();

        console.log("Received image URL:", imageUrl);

        if (imageUrl) {
          // Update the data to include the image URL
          dataToSubmit.vehicle_image_url = imageUrl;
          console.log("Updated data with image URL");
        } else {
          console.warn("Image upload failed or returned no URL");
        }
      }

      // Remove vehicle_id if it's null (for new vehicles)
      if (!dataToSubmit.vehicle_id) {
        delete dataToSubmit.vehicle_id;
      }

      console.log("Submitting vehicle data:", dataToSubmit);

      const res = await axios.post(
        "http://localhost:5000/api/add-vehicle",
        dataToSubmit,
        { withCredentials: true }
      );

      console.log("Add vehicle response:", res.data);

      if (res.data.status === "success") {
        // Fetch vehicles from server instead of optimistically updating
        fetchVehicles();

        // Reset the form and hide the container
        setVehicleData({
          vehicle_id: null,
          make: "",
          model: "",
          year: "",
          vin: "",
          license_plate: "",
          color: "",
          mileage: "",
          engine_type: "",
          transmission: "",
          is_primary: false,
          vehicle_image_url: "",
        });
        setVehiclePhotoFile(null);
        setVehiclePhotoPreview("");
        setShowAddVehicle(false);
        setMessage("Vehicle added successfully");
      } else {
        setMessage(res.data.message || "Error adding vehicle");
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
      if (error.response) {
        console.error("Server error response:", error.response.data);
      }
      setMessage("Error adding vehicle");
    }
  };

  const fetchInvoices = () => {
    axios
      .get("http://localhost:5000/api/get-user-invoices", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.status === "success") {
          setInvoices(res.data.invoices);
        } else {
          setMessage("Failed to load invoices.");
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage("Error loading invoices.");
      });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <ContentLoader speed={2} width={400} height={160} viewBox="0 0 400 160">
          <rect x="0" y="0" rx="5" ry="5" width="400" height="160" />
        </ContentLoader>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className={`dashboard-container ${theme}`}>
        {/* Overview Section */}
        <section
          className="dashboard-overview"
          style={{ position: "relative", padding: "20px" }}
        >
          <div className="dashboard-user-photo">
            {user && user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt="User"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #ccc",
                }}
              />
            ) : (
              <span className="user-avatar">
                {user &&
                  (user.displayName?.charAt(0) || user.email?.charAt(0) || "U")}
              </span>
            )}
          </div>
          <h1 className="welcome-message">Welcome, {getDisplayName()}</h1>
          {/* Vehicle Status Card with green orb indicator */}
          <div
            className="vehicle-status-card"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "#fff",
              padding: "8px 12px",
              borderRadius: "5px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.6)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div>Vehicle Status: Active </div>
            <div
              style={{
                width: "10px",
                height: "10px",
                backgroundColor: "green",
                borderRadius: "50%",
                marginLeft: "6px",
              }}
            ></div>
          </div>
        </section>

        {/* Status message */}
        {message && (
          <div
            className="status-message"
            style={{
              textAlign: "center",
              padding: "10px",
              margin: "10px 0",
              backgroundColor: "#f0f8ff",
              borderRadius: "5px",
            }}
          >
            {message}
          </div>
        )}

        {/* Stats Section */}
        <section className="dashboard-stats">
          <div className="stat-box loyalty-points">
            <h3>Loyalty Points</h3>
            {loyaltyPoints ? (
              <>
                <p>Points Balance: {loyaltyPoints.points_balance}</p>
                <p>Total Earned: {loyaltyPoints.total_points_earned}</p>
              </>
            ) : (
              <ContentLoader
                speed={2}
                width={300}
                height={50}
                viewBox="0 0 300 50"
              >
                <rect x="0" y="0" rx="5" ry="5" width="300" height="50" />
              </ContentLoader>
            )}
          </div>

          <div className="stat-box notifications">
            <h3>Notifications</h3>
            {notifications.length > 0 ? (
              <ul>
                {notifications.map((note) => (
                  <li key={note.notification_id}>
                    <div className="notification-item">
                      <div>
                        <strong>{note.title}:</strong> {note.message}
                      </div>
                      <button
                        onClick={() =>
                          dismissNotification(note.notification_id)
                        }
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No notifications</p>
            )}
          </div>
        </section>

        {/* Dashboard Actions */}
        <section
          className="dashboard-actions"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Link to="/profile" className="dashboard-link">
            View/Edit Profile
          </Link>

          <button
            className="invoices-button"
            onClick={() => {
              setShowInvoicesModal(true);
              fetchInvoices();
            }}
          >
            Invoices
          </button>

          <button
            className="photos-link"
            onClick={() => {
              setShowPhotosModal(true);
              fetchUserMedia();
            }}
          >
            Photos
          </button>

          <button
            className="add-vehicle-button"
            onClick={() => setShowAddVehicle((prev) => !prev)}
          >
            {showAddVehicle ? "Cancel" : "Add Vehicle"}
          </button>
        </section>

        {/* Add Vehicle Form (conditionally rendered) */}
        {showAddVehicle && (
          <section
            className="add-vehicle-section"
            style={{ marginBottom: "20px" }}
          >
            <div className="add-vehicle-container">
              <h3>Add Vehicle</h3>
              <form onSubmit={handleAddVehicleSubmit}>
                <div className="form-group">
                  <label htmlFor="make">Make:</label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={vehicleData.make}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter vehicle make"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="model">Model:</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={vehicleData.model}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter vehicle model"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year">Year:</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={vehicleData.year}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter vehicle year"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vin">VIN:</label>
                  <input
                    type="text"
                    id="vin"
                    name="vin"
                    value={vehicleData.vin}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter VIN"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="license_plate">License Plate:</label>
                  <input
                    type="text"
                    id="license_plate"
                    name="license_plate"
                    value={vehicleData.license_plate}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter license plate"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="color">Color:</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={vehicleData.color}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter color"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mileage">Mileage:</label>
                  <input
                    type="number"
                    id="mileage"
                    name="mileage"
                    value={vehicleData.mileage}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter mileage"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="engine_type">Engine Type:</label>
                  <input
                    type="text"
                    id="engine_type"
                    name="engine_type"
                    value={vehicleData.engine_type}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter engine type"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="transmission">Transmission:</label>
                  <input
                    type="text"
                    id="transmission"
                    name="transmission"
                    value={vehicleData.transmission}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter transmission type"
                  />
                </div>
                <div className="form-group vehicle-photo-section">
                  <label htmlFor="vehiclePhoto">Vehicle Photo</label>
                  <div className="vehicle-photo-preview">
                    {vehiclePhotoPreview || vehicleData.vehicle_image_url ? (
                      <img
                        src={
                          vehiclePhotoPreview || vehicleData.vehicle_image_url
                        }
                        alt="Vehicle"
                        style={{
                          width: "150px",
                          height: "150px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          marginBottom: "10px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "150px",
                          height: "150px",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "5px",
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    id="vehiclePhoto"
                    name="vehiclePhoto"
                    accept="image/*"
                    onChange={handleVehiclePhotoChange}
                  />
                </div>
                <button type="submit" className="submit-button">
                  Add Vehicle
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Vehicles Display Section */}
        <section className="vehicles-display" style={{ margin: "20px 0" }}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
            Your Vehicles
          </h2>
          {vehicles.length > 0 ? (
            <div
              className="vehicles-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "20px",
                padding: "0 15px",
              }}
            >
              {vehicles.map((vehicle) => {
                // Debug vehicle image URL
                console.log(
                  `Vehicle ${vehicle.vehicle_id} image URL:`,
                  vehicle.vehicle_image_url
                );

                return (
                  <div
                    key={vehicle.vehicle_id}
                    className="vehicle-card"
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      backgroundColor: "#fff",
                    }}
                  >
                    {/* Only show image if vehicle_image_url exists and is not null/empty */}
                    {vehicle.vehicle_image_url &&
                    vehicle.vehicle_image_url.trim() !== "" ? (
                      <div
                        style={{ marginBottom: "15px", textAlign: "center" }}
                      >
                        <img
                          src={vehicle.vehicle_image_url}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #eee",
                          }}
                          onError={(e) => {
                            console.error(
                              `Error loading image for vehicle ${vehicle.vehicle_id}:`,
                              e
                            );
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src =
                              "https://via.placeholder.com/120?text=No+Image"; // Fallback image
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{ marginBottom: "15px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            width: "120px",
                            height: "120px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "8px",
                            border: "1px solid #eee",
                            color: "#888",
                            fontSize: "12px",
                          }}
                        >
                          No Image
                        </div>
                      </div>
                    )}

                    <h3 style={{ margin: "0 0 10px 0" }}>
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p style={{ margin: "5px 0" }}>Year: {vehicle.year}</p>
                    {vehicle.vin && (
                      <p style={{ margin: "5px 0" }}>VIN: {vehicle.vin}</p>
                    )}
                    {vehicle.license_plate && (
                      <p style={{ margin: "5px 0" }}>
                        Plate: {vehicle.license_plate}
                      </p>
                    )}
                    {vehicle.color && (
                      <p style={{ margin: "5px 0" }}>Color: {vehicle.color}</p>
                    )}
                    {vehicle.mileage !== null && (
                      <p style={{ margin: "5px 0" }}>
                        Mileage: {vehicle.mileage}
                      </p>
                    )}
                    {vehicle.engine_type && (
                      <p style={{ margin: "5px 0" }}>
                        Engine: {vehicle.engine_type}
                      </p>
                    )}
                    {vehicle.transmission && (
                      <p style={{ margin: "5px 0" }}>
                        Transmission: {vehicle.transmission}
                      </p>
                    )}
                    {vehicle.is_primary && (
                      <p style={{ margin: "10px 0 5px 0" }}>
                        <strong>Primary Vehicle</strong>
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#666",
                        marginTop: "10px",
                        borderTop: "1px solid #eee",
                        paddingTop: "10px",
                      }}
                    >
                      Date Added:{" "}
                      {new Date(vehicle.date_added).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>You have not added any vehicles yet.</p>
              <button
                onClick={() => setShowAddVehicle(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Add Your First Vehicle
              </button>
            </div>
          )}
        </section>
        <Modal
          isOpen={showPhotosModal}
          onRequestClose={() => setShowPhotosModal(false)}
          style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000 },
            content: {
              width: "90%",
              maxWidth: "800px",
              margin: "auto",
              height: "80vh",
              overflowY: "auto",
              padding: "20px",
              borderRadius: "8px",
            },
          }}
        >
          <button
            onClick={() => setShowPhotosModal(false)}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Close
          </button>

          <h2>Your Vehicle Photos</h2>

          {message && (
            <div style={{ marginBottom: "10px", color: "#333" }}>{message}</div>
          )}

          <button
            style={{ margin: "10px 0", padding: "8px 16px", cursor: "pointer" }}
            onClick={() => setShowAddPhotoForm((prev) => !prev)}
          >
            {showAddPhotoForm ? "Cancel" : "Add Photo"}
          </button>

          {showAddPhotoForm && (
            <form onSubmit={handleUploadNewPhoto}>
              <div style={{ marginBottom: "10px" }}>
                <label>Select Vehicle:</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  <option value="">--Select Vehicle--</option>
                  {vehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.make} {v.model} ({v.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="Enter a description (optional)"
                />
              </div>

              <div className="form-group">
                <label>Choose Photo:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  required
                />
              </div>

              {photoPreview && (
                <img
                  src={photoPreview}
                  style={{ width: 150, marginBottom: 10 }}
                  alt="preview"
                />
              )}

              <button type="submit" style={{ padding: "6px 12px" }}>
                Upload Photo
              </button>
            </form>
          )}

          {vehiclesMedia.map(({ vehicle_info, media }) => (
            <div key={vehicle_info.vehicle_id} style={{ marginBottom: "20px" }}>
              <h3>
                {vehicle_info.make} {vehicle_info.model} ({vehicle_info.year})
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "10px",
                }}
              >
                {media.map((photo) => (
                  <div
                    key={photo.media_id}
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={photo.file_url}
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <button onClick={() => handleCopyLink(photo.file_url)}>
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDeleteMedia(photo.media_id)}>
                        <Trash2 size={16} color="red" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Modal>
        <Modal
          isOpen={showInvoicesModal}
          onRequestClose={() => setShowInvoicesModal(false)}
          style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000 },
            content: {
              width: "90%",
              maxWidth: "800px",
              margin: "auto",
              height: "80vh",
              overflowY: "auto",
              padding: "20px",
              borderRadius: "8px",
            },
          }}
        >
          <button
            onClick={() => setShowInvoicesModal(false)}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Close
          </button>

          <h2>Your Invoices</h2>

          {invoices.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
                >
                  <th>Invoice #</th>
                  <th>Vehicle</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.invoice_id}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td>{inv.invoice_number}</td>
                    <td>
                      {inv.make
                        ? `${inv.make} ${inv.model} (${inv.year})`
                        : "N/A"}
                    </td>
                    <td>${inv.total_amount}</td>
                    <td>{inv.status}</td>
                    <td>{new Date(inv.issue_date).toLocaleDateString()}</td>
                    <td>
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>You have no invoices at the moment.</p>
          )}
        </Modal>
      </main>
      <Footer />
    </>
  );
}

export default Dashboard;
