import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";
import ContentLoader from "react-content-loader"; // For animated skeletons

function Dashboard() {
  const { user, loading } = useAuth();
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [theme, setTheme] = useState("light");

  // State for toggling the Add Vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  // State for vehicle form data (extended to match your table)
  const [vehicleData, setVehicleData] = useState({
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
  });

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

  // Function to fetch vehicles for the user
  const fetchVehicles = () => {
    axios
      .get("http://localhost:5000/api/get-vehicles", { withCredentials: true })
      .then((res) => {
        if (res.data.status === "success") {
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

  // Handle checkbox change for is_primary
  const handlePrimaryChange = (e) => {
    setVehicleData((prev) => ({ ...prev, is_primary: e.target.checked }));
  };

  // Handle form submission for adding a vehicle
  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/add-vehicle",
        vehicleData,
        { withCredentials: true }
      );
      if (res.data.status === "success") {
        // Optimistically update vehicles state with the new vehicle
        const newVehicle = {
          ...vehicleData,
          vehicle_id: res.data.vehicle_id,
          // Optionally add date_added from API or set it to current date/time
          date_added: new Date().toISOString(),
        };
        setVehicles((prev) => [...prev, newVehicle]);
        // Reset the form and hide the container
        setVehicleData({
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
        });
        setShowAddVehicle(false);
      } else {
        console.error("Error adding vehicle:", res.data.message);
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
    }
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
                  border: "2px solid #ccc", // Border around the photo
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
            <div>
              <div></div>
            </div>
          </div>
        </section>

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

        {/* Dashboard Links */}
        <section className="dashboard-links">
          <Link to="/profile" className="dashboard-link">
            View/Edit Profile
          </Link>
          <Link to="/photos" className="photos-link">
            Photos
          </Link>
        </section>

        {/* Add Vehicle Section */}
        <section className="add-vehicle-section">
          <button
            className="add-vehicle-button"
            onClick={() => setShowAddVehicle((prev) => !prev)}
          >
            {showAddVehicle ? "Cancel" : "Add Vehicle"}
          </button>
          {showAddVehicle && (
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
                <button type="submit" className="submit-button">
                  Submit Vehicle
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Vehicles Display Section */}
        <section className="vehicles-display">
          <h2>Your Vehicles</h2>
          {vehicles.length > 0 ? (
            <div className="vehicles-grid">
              {vehicles.map((vehicle) => (
                <div key={vehicle.vehicle_id} className="vehicle-card">
                  <h3>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p>Year: {vehicle.year}</p>
                  {vehicle.vin && <p>VIN: {vehicle.vin}</p>}
                  {vehicle.license_plate && (
                    <p>Plate: {vehicle.license_plate}</p>
                  )}
                  {vehicle.color && <p>Color: {vehicle.color}</p>}
                  {vehicle.mileage !== null && (
                    <p>Mileage: {vehicle.mileage}</p>
                  )}
                  {vehicle.engine_type && <p>Engine: {vehicle.engine_type}</p>}
                  {vehicle.transmission && (
                    <p>Transmission: {vehicle.transmission}</p>
                  )}
                  {vehicle.is_primary && (
                    <p>
                      <strong>Primary Vehicle</strong>
                    </p>
                  )}
                  <p>
                    Date Added:{" "}
                    {new Date(vehicle.date_added).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>You have not added any vehicles yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Dashboard;
