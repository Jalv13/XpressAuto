//Authors: Joshua, Joe, , , ,
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";
import ContentLoader from "react-content-loader"; // For animated skeletons
import Modal from "react-modal";
import { Copy, Trash2, X } from "lucide-react";
// imports for stripe
import { loadStripe } from "@stripe/stripe-js";
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import "./cssFiles/Dashboard.css";

// debugging making sure key is loaded
if (!stripePublicKey) {
  console.error(
    "CRITICAL ERROR: Stripe Publishable Key is not defined in the environment variables (.env file). Please ensure it is set and the development server was restarted."
  );
}
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

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

  // Stripe states
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const paidInvoiceId = selectedInvoiceForPayment;

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

  // stripe functions
  const handlePayInvoice = async (invoiceId) => {
    console.log(`Attempting to pay invoice ID: ${invoiceId}`); // Log which invoice is being processed

    // Reset any previous payment attempts or messages
    setSelectedInvoiceForPayment(null);
    setClientSecret(null);
    setMessage("Preparing payment..."); // Provide immediate feedback

    try {
      // Make the POST request to your Flask backend endpoint
      const response = await axios.post(
        "http://localhost:5000/api/create-payment-intent", // Your backend URL
        { invoice_id: invoiceId }, // Send the invoice ID in the request body
        { withCredentials: true } // Important for Flask-Login session cookies
      );

      // Check if the request was successful and we received a clientSecret
      if (response.data && response.data.clientSecret) {
        console.log("Received clientSecret:", response.data.clientSecret);

        // Update state with the received clientSecret and the selected invoice ID
        setClientSecret(response.data.clientSecret);
        setSelectedInvoiceForPayment(invoiceId);
        setMessage(""); // Clear the "Preparing payment..." message
      } else {
        // Handle cases where the backend response is okay (e.g., 200 OK) but doesn't contain the expected secret
        console.error("Backend response missing clientSecret:", response.data);
        setMessage("Failed to initialize payment. Please try again.");
        setSelectedInvoiceForPayment(null); // Ensure reset
        setClientSecret(null); // Ensure reset
      }
    } catch (error) {
      // Handle errors during the API call (network errors, backend errors like 4xx or 5xx)
      console.error("Error creating payment intent:", error);

      // Try to get a specific error message from the backend response
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message || // Fallback to Axios error message
        "An unexpected error occurred while preparing payment.";

      setMessage(errorMessage); // Display the error to the user
      setSelectedInvoiceForPayment(null); // Reset selected invoice on error
      setClientSecret(null); // Reset client secret on error
    }
  };
  // Stripe Success
  const handlePaymentSuccess = async (paymentIntentId) => {
    // <-- Make async
    console.log("Payment successful! Payment Intent ID:", paymentIntentId);
    setMessage("Payment Successful! Updating status..."); // More specific message

    // --- BEGIN MODIFIED/NEW CODE ---

    // Capture the invoice ID *before* resetting the state below
    const paidInvoiceId = selectedInvoiceForPayment;

    console.log(
      "Value stored in paidInvoiceId:",
      paidInvoiceId,
      "Type:",
      typeof paidInvoiceId
    );

    if (!paidInvoiceId) {
      // This shouldn't happen in normal flow, but good to check
      console.error(
        "handlePaymentSuccess Error: Could not determine which invoice was paid."
      );
      setMessage(
        "Payment successful, but couldn't immediately confirm status update. Please refresh if needed."
      );
      // Still proceed to reset state and fetch
    } else {
      // Try to notify the backend immediately for faster UI update
      try {
        console.log(
          `Sending client-side confirmation to backend for Invoice ID: ${paidInvoiceId}, Payment Intent: ${paymentIntentId}`
        );
        // Call the new backend endpoint
        const response = await axios.post(
          "http://localhost:5000/api/mark-invoice-paid", // Your new endpoint
          {
            invoice_id: paidInvoiceId, // Send the invoice ID
            paymentIntentId: paymentIntentId, // Send the Stripe Payment Intent ID
          },
          { withCredentials: true } // Don't forget credentials for session auth
        );

        // Log backend response for confirmation
        if (response.data?.status === "success") {
          console.log(
            "Backend acknowledged client-side confirmation and updated status."
          );
          setMessage("Payment Successful! Status updated."); // Update message
        } else {
          // Backend might respond with success even if already paid, which is okay
          console.warn(
            "Backend response to client confirmation:",
            response.data?.message || "No message"
          );
          setMessage("Payment Successful!"); // Keep positive message
        }
      } catch (error) {
        // Log error but don't block the user, webhook is the fallback
        console.error(
          "Error sending client-side payment confirmation to backend:",
          error.response?.data || error.message
        );
        // Optionally slightly change the message
        setMessage("Payment successful! Status will update shortly.");
      }
    }
    // --- END MODIFIED/NEW CODE ---

    // Reset the payment-specific state - **Now safe to do this**
    setClientSecret(null);
    setSelectedInvoiceForPayment(null); // Reset the ID state variable

    // Refresh the invoices list. If the API call above succeeded,
    // this fetch should immediately show the 'paid' status.
    // If the API call failed, the webhook will eventually update it,
    // and a later refresh/fetch would show it.
    fetchInvoices();

    // Optional: Close the modal after a short delay
    // setTimeout(() => {
    //   setShowInvoicesModal(false);
    //   // Reset message only when closing modal if desired
    //   // setMessage('');
    // }, 3000); // Close after 3 seconds
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

  const dashboardStyles = `
  /* User dash and profile section */
  .user-greeting {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 30px;
    padding: 20px 0;
    border-bottom: 1px solid #eaeaea;
  }
  
  .user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #333;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
  }
  
  .user-name {
    font-size: 1.5rem;
    font-weight: 500;
    color: #333;
  }
  
  /* Main dashboard content area */
  .dashboard-content {
    margin-top: 30px;
    padding: 20px 0;
  }
  
  /* Arrange buttons in a horizontal line */
  .dashboard-actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap; 
    justify-content: space-between;
    gap: 10px; /* Spacing between buttons */
    margin: 40px 0 30px;
    width: 100%; /* Full width */
    padding: 0;
  }
  
  /* Standardized Button Styling */
  .dashboard-actions button,
  .dashboard-actions .dashboard-link,
  .dashboard-actions a {
    flex: 1; 
    min-width: 160px;
    height: 50px;
    font-size: 0.9rem; 
    font-weight: 600;
    border: none;
    border-radius: 4px; 
    background-color: rgba(255, 204, 0, 0.95);
    color: #333;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    box-sizing: border-box;
    padding: 0 15px;
    margin: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative; /* For hover line */
    overflow: hidden; /* For hover line */
  }
  
  
  .dashboard-actions button::after,
  .dashboard-actions .dashboard-link::after,
  .dashboard-actions a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 3px;
    background-color: #333;
    transition: width 0.3s ease;
  }
  
  .dashboard-actions button:hover::after,
  .dashboard-actions .dashboard-link:hover::after,
  .dashboard-actions a:hover::after {
    width: 100%;
  }
  
  /* Hover animation effect */
  .dashboard-actions button:hover,
  .dashboard-actions .dashboard-link:hover,
  .dashboard-actions a:hover {
    background-color: #ffd700;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* Active/click animation effect */
  .dashboard-actions button:active,
  .dashboard-actions .dashboard-link:active,
  .dashboard-actions a:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    background-color: #f0c000;
  }
  
  /* Vehicles section */
  .vehicles-section {
    margin-top: 30px;
  }
  
  .vehicles-section h2 {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 20px;
    color: #333;
    text-align: center;
  }
  
  .vehicle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .vehicle-card {
    border: 1px solid #eaeaea;
    border-radius: 8px;
    padding: 20px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .vehicle-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-3px);
  }
  
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .dashboard-actions {
      flex-direction: column;
      align-items: center;
    }
    
    .dashboard-actions button,
    .dashboard-actions .dashboard-link,
    .dashboard-actions a {
      width: 100%;
      max-width: 280px;
    }
    
    .vehicle-grid {
      grid-template-columns: 1fr;
    }

    .stripe-payment-container{
    min-height: 250px;
    border: 1px dashed red;
    // debug border}
  }
`;
  return (
    <>
      <style>{dashboardStyles}</style>

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
            minHeight: "200px",
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
            overlay: {
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 0,
              margin: 0,
              width: "100%",
              left: 0,
              right: 0,
            },
            content: {
              position: "relative",
              width: "95%",
              maxWidth: "calc(100% - 20px)",
              margin: "0 auto",
              overflowY: "auto",
              padding: "20px",
              borderRadius: "8px",
              boxSizing: "border-box",
              left: 0,
              right: 0,
              top: "auto",
              bottom: "auto",
              overflow: "visible",
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
          onRequestClose={() => {
            console.log(
              "Closing invoice modal via onRequestClose, resetting payment state."
            );
            setShowInvoicesModal(false); // Close the modal visually
            setSelectedInvoiceForPayment(null);
            setClientSecret(null);
            setMessage(""); // Clear messages when closing
          }}
          style={{
            overlay: {
              backgroundColor: "rgba(0,0,0,0.7)", // Darker overlay
              zIndex: 1000, // Ensure it's above other content
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "10px", // Padding around the modal content
            },
            content: {
              position: "relative",
              width: "95%", // Responsive width
              maxWidth: "850px", // Max width for larger screens
              margin: "20px auto", // Auto margins for centering
              maxHeight: "90vh", // Limit height, enable scrolling
              overflowY: "auto",
              padding: "25px", // More internal padding
              borderRadius: "8px",
              boxSizing: "border-box",
              inset: "auto", // Reset positioning helpers
              border: "none", // Remove default border
              background: "#fff", // Ensure background is white
              boxShadow: "0 5px 15px rgba(0,0,0,0.2)", // Add subtle shadow
            },
          }}
          // appElement is set globally outside the component render function
        >
          {/* Close Button */}
          <button
            onClick={() => {
              console.log("Clicked close button, resetting payment state.");
              setShowInvoicesModal(false);
              setSelectedInvoiceForPayment(null);
              setClientSecret(null);
              setMessage("");
            }}
            style={{
              position: "absolute",
              top: 15,
              right: 15,
              background: "transparent", // Make background transparent
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              padding: "5px",
              lineHeight: "1", // Align icon better vertically
              color: "#555", // Make X grey
            }}
            aria-label="Close Invoices Modal"
          >
            <X size={24} /> {/* Use Lucide X icon */}
          </button>

          {/* Modal Title */}
          <h2
            style={{
              marginTop: 0,
              marginBottom: "25px",
              textAlign: "center",
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
            }}
          >
            Your Invoices
          </h2>

          {/* General Message Area (for loading/errors before form appears) */}
          {/* Shows messages ONLY if the form isn't active and it's not a success message */}
          {message &&
            !clientSecret &&
            !message.includes("Payment Successful") && (
              <p
                style={{
                  textAlign: "center",
                  margin: "0 0 20px 0", // Space below message
                  padding: "10px 15px",
                  borderRadius: "4px",
                  border: "1px solid",
                  borderColor:
                    message.includes("error") || message.includes("Failed")
                      ? "#f5c6cb"
                      : "#bee5eb",
                  backgroundColor:
                    message.includes("error") || message.includes("Failed")
                      ? "#f8d7da"
                      : "#d1ecf1",
                  color:
                    message.includes("error") || message.includes("Failed")
                      ? "#721c24"
                      : "#0c5460",
                }}
              >
                {message}
              </p>
            )}

          {/* Invoice Table Area */}
          {invoices.length > 0 ? (
            // Wrapper div for responsiveness
            <div
              className="table-responsive-wrapper"
              style={{ overflowX: "auto", marginBottom: "1rem" }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "650px", // Prevent extreme squishing
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      borderBottom: "2px solid #ddd",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <th style={{ padding: "12px 10px" }}>Invoice #</th>
                    <th style={{ padding: "12px 10px" }}>Vehicle</th>
                    <th style={{ padding: "12px 10px" }}>Total</th>
                    <th style={{ padding: "12px 10px" }}>Status</th>
                    <th style={{ padding: "12px 10px" }}>Issued</th>
                    <th style={{ padding: "12px 10px" }}>Due</th>
                    <th style={{ padding: "12px 10px", textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    // Single row per invoice
                    <tr
                      key={inv.invoice_id}
                      style={{
                        borderBottom: "1px solid #eee",
                        backgroundColor:
                          selectedInvoiceForPayment === inv.invoice_id
                            ? "#f0f8ff"
                            : "transparent",
                      }}
                    >
                      {" "}
                      {/* Highlight row if selected for payment */}
                      <td style={{ padding: "12px 10px" }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {inv.make
                          ? `${inv.make} ${inv.model} (${inv.year})`
                          : "N/A"}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        ${parseFloat(inv.total_amount).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          textTransform: "capitalize",
                        }}
                      >
                        {/* Status Badge */}
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "0.8em",
                            color: "#fff",
                            backgroundColor:
                              inv.status.toLowerCase() === "paid"
                                ? "green"
                                : inv.status.toLowerCase() === "due"
                                ? "orange"
                                : inv.status.toLowerCase() === "unpaid"
                                ? "#dc3545"
                                : "#6c757d" /* Red for unpaid */,
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {new Date(inv.issue_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {inv.due_date
                          ? new Date(inv.due_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      {/* Action Cell: Pay Button or Status */}
                      <td
                        style={{
                          padding: "12px 10px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {inv.status.toLowerCase() === "unpaid" ||
                        inv.status.toLowerCase() === "due" ? (
                          <button
                            onClick={() => handlePayInvoice(inv.invoice_id)}
                            style={{
                              padding: "6px 12px",
                              cursor: "pointer",
                              backgroundColor: "#ffc107", // Yellow
                              border: "1px solid #dda700",
                              borderRadius: "4px",
                              color: "#333",
                              fontWeight: "bold",
                              fontSize: "0.9em",
                              whiteSpace: "nowrap", // Prevent button text wrapping
                            }}
                            // Disable if any payment is active OR if preparing this specific one
                            disabled={
                              !!clientSecret ||
                              (selectedInvoiceForPayment === inv.invoice_id &&
                                message === "Preparing payment...")
                            }
                          >
                            {/* Show "Processing..." only for the specific button clicked */}
                            {selectedInvoiceForPayment === inv.invoice_id &&
                            message === "Preparing payment..."
                              ? "Processing..."
                              : "Pay Now"}
                          </button>
                        ) : inv.status.toLowerCase() === "paid" ? (
                          <span
                            style={{
                              color: "green",
                              fontWeight: "bold",
                              fontSize: "0.9em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Paid ✔
                          </span>
                        ) : (
                          // Display other statuses like 'processing', 'cancelled' etc.
                          <span
                            style={{
                              color: "#6c757d",
                              fontSize: "0.9em",
                              textTransform: "capitalize",
                            }}
                          >
                            {inv.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}{" "}
                  {/* End invoices.map */}
                </tbody>
              </table>
            </div> // End table responsive wrapper
          ) : (
            // Message when no invoices exist
            <p
              style={{
                textAlign: "center",
                marginTop: "30px",
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "5px",
              }}
            >
              You have no invoices at the moment.
            </p>
          )}

          {/* --- CONDITIONAL PAYMENT FORM SECTION (Rendered Below Table) --- */}
          {clientSecret && selectedInvoiceForPayment && (
            // Use className for styling via <style> block or CSS file
            <div className="stripe-payment-section">
              {/* Context Header: Which invoice is being paid? */}
              <h4
                style={
                  {
                    /* Styles are in <style> block or CSS */
                  }
                }
              >
                Enter Payment Details for Invoice #
                {/* Find the invoice number safely */}
                {invoices.find(
                  (inv) => inv.invoice_id === selectedInvoiceForPayment
                )?.invoice_number || "..."}
              </h4>

              {/* Payment Status Message Area (specific to the form) */}
              {message &&
                (message.includes("Payment Successful") ||
                  message.includes("processing payment") ||
                  message.includes("Failed processing")) && (
                  <p
                    style={{
                      textAlign: "center",
                      color: message.includes("Success") ? "green" : "red",
                      marginBottom: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    {message}
                  </p>
                )}

              {/* Stripe Elements Wrapper */}
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm
                  onPaymentSuccess={handlePaymentSuccess}
                  // Optional: Pass message setter if CheckoutForm needs to display its own errors/status
                  // setStatusMessage={setMessage}
                />
              </Elements>
            </div>
          )}
        </Modal>
      </main>
      <Footer />
    </>
  );
}

export default Dashboard;
