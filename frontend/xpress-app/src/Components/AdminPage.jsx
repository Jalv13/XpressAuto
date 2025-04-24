import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Modal from "react-modal";
import { X, ExternalLink } from "lucide-react"; // Added ExternalLink
import axios from "axios";
import "./cssFiles/PossibleDeadCSS.css"; // Keep if relevant
import "./cssFiles/admin.css";

Modal.setAppElement("#root"); // Ensure this runs for accessibility

function AdminPage() {
  // Main modal state
  const [activeModal, setActiveModal] = useState(null);
  const [message, setMessage] = useState("");

  // Shared data
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]); // Keep if needed by other modals, e.g., Invoice

  // Send Notifications state
  const [selectedUser, setSelectedUser] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  // Add User state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");

  // Add Service state
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  // Add Loyalty Points state
  const [loyaltySearchQuery, setLoyaltySearchQuery] = useState("");
  const [loyaltySelectedUser, setLoyaltySelectedUser] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState("");

  // Update Vehicle Status state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newVehicleStatus, setNewVehicleStatus] = useState("OffLot");
  const [selectedUserForVehicleStatus, setSelectedUserForVehicleStatus] =
    useState("");
  const [vehiclesForSelectedUser, setVehiclesForSelectedUser] = useState([]);

  // Send Invoice state
  const [invoiceEmail, setInvoiceEmail] = useState(""); // Can likely be removed if backend uses user_id
  const [invoiceVehicleId, setInvoiceVehicleId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(""); // Assuming backend generates this now
  const [subtotal, setSubtotal] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Invoice State - Specific
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceSelectedUser, setInvoiceSelectedUser] = useState("");
  const [vehiclesForInvoice, setVehiclesForInvoice] = useState([]);
  const [isLoadingInvoiceNumber, setIsLoadingInvoiceNumber] = useState(false); // Keep if still relevant

  // Selected user for photos state
  const [selectedUserForPhotos, setSelectedUserForPhotos] = useState("");
  const [vehiclesForPhotos, setVehiclesForPhotos] = useState([]);
  const [selectedVehicleForPhotos, setSelectedVehicleForPhotos] = useState("");
  const [vehiclePhotos, setVehiclePhotos] = useState([]);

  // Send SMS state
  const [smsRecipients, setSmsRecipients] = useState([]); // Array of user_ids
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSearchQuery, setSmsSearchQuery] = useState(""); // For filtering users

  // Open modal and fetch necessary data
  const openModal = (modalName) => {
    setActiveModal(modalName);
    setMessage(""); // Clear previous messages
    if (
      modalName === "sendNotifications" ||
      modalName === "addLoyaltyPoints" ||
      modalName === "updateVehicleStatus" ||
      modalName === "sendInvoice" ||
      modalName === "viewPhotos" ||
      modalName === "sendSms" // Added sendSms here
    ) {
      // Fetch users if needed for these modals
      // IMPORTANT: Ensure the backend /api/get-users returns phone numbers!
      axios
        .get("http://localhost:5000/api/get-users", { withCredentials: true })
        .then((res) => {
          if (res.data.status === "success") {
            // Assuming res.data.users now contains 'phone' field
            setUsers(res.data.users);
          } else {
            console.error("Failed to fetch users:", res.data.message);
            setMessage(
              `Error loading users: ${res.data.message || "Unknown error"}`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching users:", err);
          setMessage(
            `Error loading users: ${err.response?.data?.message || err.message}`
          );
        });
    }
    // Add specific data fetching for other modals if necessary
  };

  const closeModal = () => {
    setActiveModal(null);
    setMessage("");
    // Reset all modal-specific states
    setSelectedUser("");
    setNotificationTitle("");
    setNotificationMessage("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserPhone("");
    setServiceName("");
    setServiceDescription("");
    setServicePrice("");
    setLoyaltySearchQuery("");
    setLoyaltySelectedUser("");
    setLoyaltyPoints("");
    // setVehicleSearchQuery(""); // Removed as it wasn't defined/used
    setSelectedVehicle(null);
    setNewVehicleStatus("OffLot");
    setSelectedUserForVehicleStatus("");
    setVehiclesForSelectedUser([]);
    setInvoiceEmail("");
    setInvoiceVehicleId("");
    setInvoiceNumber("");
    setSubtotal("");
    setTaxAmount("");
    setDiscountAmount("");
    setTotalAmount("");
    setInvoiceStatus("");
    setDueDate("");
    setNotes("");
    setInvoiceSearchQuery("");
    setInvoiceSelectedUser("");
    setVehiclesForInvoice([]);
    setSelectedUserForPhotos("");
    setVehiclesForPhotos([]);
    setSelectedVehicleForPhotos("");
    setVehiclePhotos([]);
    // --- Reset SMS state ---
    setSmsRecipients([]);
    setSmsMessage("");
    setSmsSearchQuery(""); // Reset SMS search query
  };

  // --- Filtering Logic ---

  // Filter for Loyalty Points
  const filteredUsers = users.filter((user) => {
    const query = loyaltySearchQuery.toLowerCase();
    // Basic check if properties exist before calling toLowerCase
    const nameMatch = user.full_name?.toLowerCase().includes(query) || false;
    const emailMatch = user.email?.toLowerCase().includes(query) || false;
    const phoneMatch = user.phone?.toLowerCase().includes(query) || false;
    return nameMatch || emailMatch || phoneMatch;
  });

  // Filter for Invoice Users
  const filteredInvoiceUsers = users.filter((user) => {
    const query = invoiceSearchQuery.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(query) || false;
    const emailMatch = user.email?.toLowerCase().includes(query) || false;
    const phoneMatch = user.phone?.toLowerCase().includes(query) || false;
    return nameMatch || emailMatch || phoneMatch;
  });

  // Filter for SMS Dropdown Options (Similar to others, but also checks phone and excludes selected)
  const filteredSmsUsersForDropdown = users.filter((user) => {
    const query = smsSearchQuery.toLowerCase();
    const hasPhone = !!user.phone; // Ensure phone number exists and is not empty

    // Check if user matches the search query
    const matchesQuery =
      hasPhone &&
      (user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query));

    // Check if the user is already in the recipients list
    const isAlreadySelected = smsRecipients.includes(user.user_id);

    return matchesQuery && !isAlreadySelected; // Must match query, have phone, and not be selected
  });

  // --- Handlers for form submissions & changes ---

  // Invoice Handlers
  const handleInvoiceUserChange = (e) => {
    const userId = e.target.value;
    setInvoiceSelectedUser(userId);
    // Find user details - assuming 'users' state is populated
    const selectedUserDetails = users.find(
      (user) => user.user_id === parseInt(userId)
    );
    setInvoiceEmail(selectedUserDetails?.email || ""); // Keep if needed, otherwise remove
    setInvoiceVehicleId(""); // Reset vehicle when user changes
    setVehiclesForInvoice([]); // Clear old vehicles

    // Fetch vehicles for the selected user
    if (userId) {
      axios
        .get(`http://localhost:5000/api/get-vehicles/${userId}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.status === "success") {
            setVehiclesForInvoice(res.data.vehicles);
          } else {
            setMessage(
              `Error fetching vehicles for invoice: ${
                res.data.message || "Unknown error"
              }`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicles for invoice:", err);
          setMessage(
            `Error fetching vehicles: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }
  };

  const handleInvoiceVehicleChange = (e) => {
    setInvoiceVehicleId(e.target.value);
  };

  // Notification Submit
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setMessage("Please select a user.");
      return;
    }
    setMessage("Sending notification..."); // Indicate processing
    try {
      const res = await axios.post(
        "http://localhost:5000/api/send-notification",
        {
          user_id: selectedUser,
          title: notificationTitle,
          message: notificationMessage,
        },
        { withCredentials: true }
      );
      if (res.data.status === "success") {
        setMessage("Notification sent!");
        closeModal();
      } else {
        setMessage(
          `Failed to send notification: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Send notification error:", err);
      setMessage(
        `An error occurred: ${err.response?.data?.message || err.message}`
      );
    }
  };

  // Add User Submit
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setMessage("Adding user...");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/add-user",
        {
          email: newUserEmail,
          password: newUserPassword,
          first_name: newUserFirstName,
          last_name: newUserLastName,
          phone: newUserPhone,
        },
        { withCredentials: true }
      ); // Assume admin needs auth? Adjust if not.
      if (res.data.status === "success") {
        setMessage("User added successfully!");
        closeModal();
        // Optionally refresh user list if needed immediately
        // openModal(activeModal); // This might re-fetch users
      } else {
        setMessage(
          `Failed to add user: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Add user error:", err);
      setMessage(
        `An error occurred while adding user: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Add Service Submit
  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    setMessage("Adding service...");
    try {
      // Assuming an endpoint /api/add-service exists and requires auth
      const res = await axios.post(
        "http://localhost:5000/api/add-service",
        {
          service_name: serviceName,
          service_description: serviceDescription,
          service_price: servicePrice,
        },
        { withCredentials: true }
      ); // Assume admin needs auth
      if (res.data.status === "success") {
        setMessage("Service added successfully!");
        closeModal();
      } else {
        setMessage(
          `Failed to add service: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Add service error:", err);
      setMessage(
        `An error occurred while adding service: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Add Loyalty Points Submit
  const handleAddLoyaltyPointsSubmit = async (e) => {
    e.preventDefault();
    if (!loyaltySelectedUser) {
      setMessage("Please select a user.");
      return;
    }
    if (!loyaltyPoints || loyaltyPoints <= 0) {
      setMessage("Please enter a valid number of points to add.");
      return;
    }
    setMessage("Adding points...");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/add-loyalty-points",
        {
          user_id: loyaltySelectedUser,
          points: loyaltyPoints,
        },
        { withCredentials: true } // Ensure admin auth is sent
      );
      if (res.data.status === "success") {
        setMessage("Loyalty points added!");
        closeModal();
      } else {
        setMessage(
          `Failed to add loyalty points: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Loyalty points error:", err);
      setMessage(
        `An error occurred while adding loyalty points: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Update Vehicle Status Submit
  const handleUpdateVehicleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setMessage("Please select a vehicle.");
      return;
    }
    setMessage("Updating status...");
    try {
      const res = await axios.put(
        `http://localhost:5000/api/update-vehicle-status/${selectedVehicle.vehicle_id}`,
        { vehicle_status: newVehicleStatus },
        { withCredentials: true }
      );
      if (res.data.status === "success") {
        setMessage("Vehicle status updated!");
        closeModal();
      } else {
        setMessage(
          `Failed to update vehicle status: ${
            res.data.message || "Unknown error"
          }`
        );
      }
    } catch (err) {
      console.error("Update vehicle status error:", err);
      setMessage(
        `An error occurred while updating vehicle status: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Send Invoice Submit
  const handleSendInvoiceSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (
      !invoiceSelectedUser ||
      !invoiceVehicleId ||
      !totalAmount ||
      !invoiceStatus ||
      !dueDate
    ) {
      setMessage(
        "Please fill in all required invoice fields (User, Vehicle, Total, Status, Due Date)."
      );
      return;
    }
    setMessage("Creating invoice...");
    try {
      // Assuming backend generates invoice_number
      const res = await axios.post(
        "http://localhost:5000/api/create-invoice",
        {
          // Send user_id if backend expects it
          user_id: invoiceSelectedUser,
          vehicle_id: invoiceVehicleId,
          subtotal,
          tax_amount: taxAmount || 0, // Default tax/discount to 0 if empty
          discount_amount: discountAmount || 0,
          total_amount: totalAmount,
          status: invoiceStatus,
          due_date: dueDate,
          notes,
          items: [], // Assuming items are added separately or not via this form
        },
        { withCredentials: true }
      ); // Assume admin needs auth

      if (res.data.status === "success") {
        setMessage(
          `Invoice ${res.data.invoice_number || ""} created successfully!`
        );
        closeModal();
      } else {
        setMessage(
          `Failed to create invoice: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Send invoice error:", err);
      setMessage(
        `An error occurred while creating invoice: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Vehicle Status Handlers
  const handleUserChange = (e) => {
    // Renamed from generic handleUserChange for clarity
    const userId = e.target.value;
    setSelectedUserForVehicleStatus(userId);
    // Reset vehicle selection when user changes
    setSelectedVehicle(null);
    setVehiclesForSelectedUser([]);
    if (userId) {
      // Fetch vehicles for the selected user
      axios
        .get(`http://localhost:5000/api/get-vehicles/${userId}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.status === "success") {
            setVehiclesForSelectedUser(res.data.vehicles);
          } else {
            setMessage(
              `Error fetching vehicles: ${res.data.message || "Unknown error"}`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicles for user:", err);
          setMessage(
            `Error fetching vehicles: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }
  };

  const handleVehicleChange = (e) => {
    // Renamed from generic handleVehicleChange
    const vehicleId = Number(e.target.value);
    const vehicle = vehiclesForSelectedUser.find(
      (v) => v.vehicle_id === vehicleId
    );
    setSelectedVehicle(vehicle);
    // Optionally set the status dropdown to the vehicle's current status
    if (vehicle) {
      setNewVehicleStatus(vehicle.vehicle_status || "OffLot");
    }
  };

  // View Photos Handlers
  const handleUserForPhotosChange = (e) => {
    const userId = e.target.value;
    setSelectedUserForPhotos(userId);
    // Reset vehicle and photos when user changes
    setSelectedVehicleForPhotos("");
    setVehiclePhotos([]);
    setVehiclesForPhotos([]);
    if (userId) {
      axios
        .get(`http://localhost:5000/api/get-vehicles/${userId}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.status === "success") {
            setVehiclesForPhotos(res.data.vehicles);
          } else {
            setMessage(
              `Error fetching vehicles for photos: ${
                res.data.message || "Unknown error"
              }`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicles for photos:", err);
          setMessage(
            `Error fetching vehicles: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }
  };

  const handleVehicleForPhotosChange = (e) => {
    const vehicleId = e.target.value;
    setSelectedVehicleForPhotos(vehicleId);
    setVehiclePhotos([]); // Clear previous photos
    if (vehicleId) {
      axios
        .get(`http://localhost:5000/api/get-vehicle-photos/${vehicleId}`, {
          withCredentials: true, // Assuming admin needs to be logged in
        })
        .then((res) => {
          if (res.data.status === "success") {
            // Assuming the backend's /api/get-vehicle-photos only returns photo details (media_id, file_url, title, etc.)
            setVehiclePhotos(res.data.photos);
            // If status per photo is needed, the backend endpoint must provide it.
            // Example if backend provided vehicle_status at top level:
            // const status = res.data.vehicle_status;
            // setVehiclePhotos(res.data.photos.map(p => ({ ...p, status })));
          } else {
            setMessage(
              `Error fetching photos: ${res.data.message || "Unknown error"}`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicle photos:", err);
          setMessage(
            `Error fetching photos: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }
  };

  // --- SMS Handlers --- START ---
  const handleSmsUserSelectToAdd = (e) => {
    const userId = parseInt(e.target.value, 10);
    if (userId && !smsRecipients.includes(userId)) {
      // Check if valid ID and not already added
      setSmsRecipients((prev) => [...prev, userId]);
    }
    // The select value is fixed to "", so no need to reset e.target.value here
    // Clearing the search query might be helpful, or not, depending on UX preference
    // setSmsSearchQuery("");
  };

  const handleRemoveSmsRecipient = (userIdToRemove) => {
    setSmsRecipients((prev) => prev.filter((id) => id !== userIdToRemove));
  };

  const handleSendSmsSubmit = async (e) => {
    e.preventDefault();

    if (smsRecipients.length === 0) {
      setMessage("Please select at least one recipient.");
      return;
    }
    if (!smsMessage.trim()) {
      setMessage("Please enter a message to send.");
      return;
    }

    setMessage("Sending messages..."); // Indicate processing

    const successes = [];
    const failures = [];
    const finalMessage = `From Express Auto: ${smsMessage} Reply STOP to stop receiving texts.`;

    // Using Promise.allSettled to send messages concurrently and collect all results
    const sendPromises = smsRecipients.map(async (userId) => {
      const user = users.find((u) => u.user_id === userId);

      if (!user || !user.phone) {
        return {
          // Return failure object for missing phone
          status: "failed",
          reason: "Missing or invalid phone number in profile",
          name: user?.full_name || `User ID ${userId}`,
        };
      }

      try {
        await axios.post(
          "http://localhost:5000/api/send-sms",
          { to: user.phone, message: finalMessage },
          { withCredentials: true }
        );
        return {
          // Return success object
          status: "fulfilled",
          value: user.full_name || user.email,
        };
      } catch (err) {
        console.error(`Failed to send SMS to ${user.phone}:`, err);
        return {
          // Return failure object for API error
          status: "failed",
          reason:
            err.response?.data?.error || err.message || "Network or API error",
          name: user.full_name || user.email,
        };
      }
    });

    const results = await Promise.allSettled(sendPromises);

    // Process results from Promise.allSettled
    results.forEach((result) => {
      // Check if the promise itself was fulfilled and the custom status within isn't 'failed'
      if (result.status === "fulfilled" && result.value?.status !== "failed") {
        successes.push(result.value.value); // Add the name/email from the successful value
      } else {
        // Either the promise was rejected, or it fulfilled but carried a 'failed' status (e.g., missing phone)
        const failureData =
          result.status === "rejected" ? result.reason : result.value;
        failures.push({
          name: failureData?.name || "Unknown User",
          reason: failureData?.reason || "Unknown processing error",
        });
      }
    });

    // Construct feedback message
    let feedback = "";
    if (successes.length > 0) {
      feedback += `Successfully sent SMS to ${
        successes.length
      } user(s): ${successes.join(", ")}. `;
    }
    if (failures.length > 0) {
      feedback += `Failed to send SMS to ${failures.length} user(s): ${failures
        .map((f) => `${f.name} (${f.reason})`)
        .join(", ")}.`;
    }

    setMessage(feedback.trim() || "SMS processing complete."); // Fallback message

    // Only close modal if all attempted sends were successful (or if there were only failures due to bad data)
    if (failures.length === 0 && successes.length > 0) {
      closeModal();
    } else if (successes.length === 0 && failures.length > 0) {
      // Keep modal open if all failed (maybe clear recipients list? Up to UX decision)
      // setSmsRecipients([]); // Optional: Clear recipients on full failure
    }
    // If mixed results, keep modal open with feedback.
  };
  // --- SMS Handlers --- END ---

  // --- JSX Return ---
  return (
    <>
      <Header />
      <main className="admin-container">
        <div className="admin-box">
          <section className="admin-overview">
            <h1>Admin Panel</h1>
            <p>Control user accounts and manage services.</p>
          </section>
          {/* Display message state */}
          {message && <div className="status-message">{message}</div>}

          <section className="admin-actions">
            {/* Buttons */}
            <button onClick={() => openModal("addUser")}>Add User</button>
            <button onClick={() => openModal("addService")}>Add Service</button>
            <button onClick={() => openModal("addLoyaltyPoints")}>
              Add Loyalty Points
            </button>
            <button onClick={() => openModal("sendSms")}>Send SMS</button>{" "}
            {/* Send SMS Button */}
            <button onClick={() => openModal("managePosts")} disabled>
              Manage Posts {/* Disabled example */}
            </button>
            <button onClick={() => openModal("viewPhotos")}>View Photos</button>
            <button onClick={() => openModal("updateVehicleStatus")}>
              Update Vehicle Status
            </button>
            <button onClick={() => openModal("sendNotifications")}>
              Send Notifications
            </button>
            <button onClick={() => openModal("sendInvoice")}>
              Create Invoice
            </button>
          </section>
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Send Notifications Modal */}
      <Modal
        isOpen={activeModal === "sendNotifications"}
        onRequestClose={closeModal}
        contentLabel="Send Notification Modal" // Accessibility
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Send Notification</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              {" "}
              {/* Added class + aria-label */}
              <X size={20} />
            </button>
          </div>
          <form className="modal-form" onSubmit={handleNotificationSubmit}>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="modal-form-select"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Title"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              required
              className="modal-form-input"
            />
            <textarea
              placeholder="Message"
              rows="3"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              required
              className="modal-form-textarea"
            />
            <button type="submit">Send Notification</button>
          </form>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={activeModal === "addUser"}
        onRequestClose={closeModal}
        contentLabel="Add User Modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add User</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          <form className="modal-form" onSubmit={handleAddUserSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
              className="modal-form-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              className="modal-form-input"
            />
            <input
              type="text"
              placeholder="First Name"
              value={newUserFirstName}
              onChange={(e) => setNewUserFirstName(e.target.value)}
              className="modal-form-input"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newUserLastName}
              onChange={(e) => setNewUserLastName(e.target.value)}
              className="modal-form-input"
            />
            <input
              type="tel" // Use type="tel" for better mobile UX
              placeholder="Phone (e.g., +15551234567)" // Add format hint
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
              className="modal-form-input"
              // Add basic phone validation pattern if desired:
              // pattern="\+?[1-9]\d{1,14}"
              // title="Phone number (e.g., +15551234567)"
            />
            <button type="submit">Add User</button>
          </form>
        </div>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        isOpen={activeModal === "addService"}
        onRequestClose={closeModal}
        contentLabel="Add Service Modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add Service</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          <form className="modal-form" onSubmit={handleAddServiceSubmit}>
            <input
              type="text"
              placeholder="Service Name"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
              className="modal-form-input"
            />
            <textarea
              placeholder="Service Description"
              rows="3"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              required
              className="modal-form-textarea"
            />
            <input
              type="number"
              placeholder="Service Price"
              value={servicePrice}
              step="0.01" // Allow cents
              min="0" // Prevent negative prices
              onChange={(e) => setServicePrice(e.target.value)}
              required
              className="modal-form-input"
            />
            <button type="submit">Add Service</button>
          </form>
        </div>
      </Modal>

      {/* Add Loyalty Points Modal */}
      <Modal
        isOpen={activeModal === "addLoyaltyPoints"}
        onRequestClose={closeModal}
        contentLabel="Add Loyalty Points Modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add Loyalty Points</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          {/* Search input for loyalty points */}
          <input
            type="text"
            className="modal-form-input" // Use consistent class
            placeholder="Search user by name, email, or phone"
            value={loyaltySearchQuery}
            onChange={(e) => setLoyaltySearchQuery(e.target.value)}
            style={{ marginBottom: "15px" }} // Add spacing if needed
          />
          <form className="modal-form" onSubmit={handleAddLoyaltyPointsSubmit}>
            <select
              value={loyaltySelectedUser}
              onChange={(e) => setLoyaltySelectedUser(e.target.value)}
              required
              className="modal-form-select"
            >
              <option value="">Select User</option>
              {/* Use filteredUsers based on loyaltySearchQuery */}
              {filteredUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email}){" "}
                  {/* Maybe add phone here too? */}
                </option>
              ))}
              {filteredUsers.length === 0 && loyaltySearchQuery && (
                <option value="" disabled>
                  No users match search
                </option>
              )}
            </select>
            <input
              type="number"
              placeholder="Points to Add"
              min="1" // Typically add positive points
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(e.target.value)}
              required
              className="modal-form-input"
            />
            <button type="submit">Add Points</button>
          </form>
        </div>
      </Modal>

      {/* Update Vehicle Status Modal */}
      <Modal
        isOpen={activeModal === "updateVehicleStatus"}
        onRequestClose={closeModal}
        contentLabel="Update Vehicle Status Modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Update Vehicle Status</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          <form
            className="modal-form"
            onSubmit={handleUpdateVehicleStatusSubmit}
          >
            {/* Dropdown to select a user */}
            <select
              value={selectedUserForVehicleStatus}
              onChange={handleUserChange} // Use the specific handler
              required
              className="modal-form-select"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>

            {/* Dropdown to select a vehicle for the selected user */}
            <select
              value={selectedVehicle ? selectedVehicle.vehicle_id : ""}
              onChange={handleVehicleChange} // Use the specific handler
              required
              disabled={
                !selectedUserForVehicleStatus ||
                vehiclesForSelectedUser.length === 0
              } // Disable if no user or no vehicles
              className="modal-form-select"
            >
              <option value="">Select Vehicle</option>
              {vehiclesForSelectedUser.length > 0
                ? vehiclesForSelectedUser.map((vehicle) => (
                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.license_plate ||
                        `${vehicle.make} ${vehicle.model}`}{" "}
                      (Status: {vehicle.vehicle_status || "N/A"})
                    </option>
                  ))
                : selectedUserForVehicleStatus && (
                    <option value="" disabled>
                      No vehicles found for this user
                    </option>
                  )}
            </select>

            {/* Dropdown to choose the new status */}
            <select
              value={newVehicleStatus}
              onChange={(e) => setNewVehicleStatus(e.target.value)}
              required
              disabled={!selectedVehicle} // Disable if no vehicle selected
              className="modal-form-select"
            >
              <option value="Waiting">Waiting</option>
              <option value="Active">Active</option>
              <option value="OffLot">OffLot</option>
            </select>
            <button type="submit" disabled={!selectedVehicle}>
              Update Status
            </button>
          </form>
        </div>
      </Modal>

      {/* Send Invoice Modal */}
      <Modal
        isOpen={activeModal === "sendInvoice"}
        onRequestClose={closeModal}
        contentLabel="Create Invoice Modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create Invoice</h2> {/* Changed title slightly */}
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          {/* Search input similar to loyalty points */}
          <input
            type="text"
            className="modal-form-input"
            placeholder="Search user by name, email, or phone"
            value={invoiceSearchQuery}
            onChange={(e) => setInvoiceSearchQuery(e.target.value)}
            style={{ marginBottom: "15px" }}
          />
          <form className="modal-form" onSubmit={handleSendInvoiceSubmit}>
            {/* User selection dropdown */}
            <select
              value={invoiceSelectedUser}
              onChange={handleInvoiceUserChange} // Specific handler
              required
              className="modal-form-select"
            >
              <option value="">Select User</option>
              {/* Use filteredInvoiceUsers */}
              {filteredInvoiceUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
              {filteredInvoiceUsers.length === 0 && invoiceSearchQuery && (
                <option value="" disabled>
                  No users match search
                </option>
              )}
            </select>

            {/* Vehicle selection dropdown */}
            <select
              value={invoiceVehicleId}
              onChange={handleInvoiceVehicleChange} // Specific handler
              required
              disabled={!invoiceSelectedUser || vehiclesForInvoice.length === 0}
              className="modal-form-select"
            >
              <option value="">Select Vehicle</option>
              {vehiclesForInvoice.length > 0
                ? vehiclesForInvoice.map((vehicle) => (
                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.license_plate ||
                        `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    </option>
                  ))
                : invoiceSelectedUser && (
                    <option value="" disabled>
                      No vehicles found for this user
                    </option>
                  )}
            </select>

            {/* Removed Hidden email field */}
            {/* Removed Invoice Number input field */}

            <input
              type="number"
              placeholder="Subtotal"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              step="0.01"
              min="0"
              required
              className="modal-form-input"
            />
            <input
              type="number"
              placeholder="Tax Amount (Optional)"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              step="0.01"
              min="0"
              className="modal-form-input"
            />
            <input
              type="number"
              placeholder="Discount Amount (Optional)"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              step="0.01"
              min="0"
              className="modal-form-input"
            />
            <input
              type="number"
              placeholder="Total Amount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              step="0.01"
              min="0"
              required
              className="modal-form-input"
            />
            <select
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
              required
              className="modal-form-select"
            >
              <option value="">Select Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <input
              type="date"
              placeholder="Due Date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="modal-form-input"
            />
            <textarea
              placeholder="Notes (optional)"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="modal-form-textarea"
            />
            <button type="submit">Create Invoice</button>
          </form>
        </div>
      </Modal>

      {/* View Photos Modal */}
      <Modal
        isOpen={activeModal === "viewPhotos"}
        onRequestClose={closeModal}
        contentLabel="View Vehicle Photos Modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>View Vehicle Photos</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form for selecting user and vehicle */}
          <form className="modal-form" style={{ marginBottom: "20px" }}>
            {" "}
            {/* Added margin */}
            <select
              value={selectedUserForPhotos}
              onChange={handleUserForPhotosChange} // Specific handler
              required
              className="modal-form-select"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
            <select
              value={selectedVehicleForPhotos}
              onChange={handleVehicleForPhotosChange} // Specific handler
              required
              disabled={
                !selectedUserForPhotos || vehiclesForPhotos.length === 0
              }
              className="modal-form-select"
            >
              <option value="">Select Vehicle</option>
              {vehiclesForPhotos.length > 0
                ? vehiclesForPhotos.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.license_plate || `${v.year} ${v.make} ${v.model}`}
                    </option>
                  ))
                : selectedUserForPhotos && (
                    <option value="" disabled>
                      No vehicles found for this user
                    </option>
                  )}
            </select>
          </form>

          {/* Photo Grid Display - Includes ExternalLink */}
          <div className="photo-grid">
            {vehiclePhotos.length > 0
              ? vehiclePhotos.map((photo) => (
                  <div key={photo.media_id}>
                    {/* Image linked to S3 URL */}
                    <a
                      href={photo.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={photo.file_url}
                        alt={photo.title || "Vehicle photo"}
                      />
                    </a>

                    {/* Container for Caption and Link Icon */}
                    <div className="photo-caption-container">
                      {" "}
                      {/* Use this class for styling */}
                      {/* Display title if available */}
                      {photo.title && (
                        <span className="photo-caption">{photo.title}</span>
                      )}
                      {/* --- Link Icon --- */}
                      <a
                        href={photo.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open image link in new tab" // Tooltip for accessibility
                        className="photo-link-icon" // Class for styling
                      >
                        <ExternalLink size={14} strokeWidth={2.5} />{" "}
                        {/* Adjust size/stroke as needed */}
                      </a>
                      {/* --- End Link Icon --- */}
                    </div>
                    {/* Optional: Display description separately if needed */}
                    {/* {photo.description && <div className="photo-description">{photo.description}</div>} */}

                    {/* Status display - requires backend to provide status per photo */}
                    {/* <div className="photo-status">Status: {photo.status || "N/A"}</div> */}
                  </div>
                ))
              : selectedVehicleForPhotos && (
                  <p>No photos found for this vehicle.</p>
                )}
            {!selectedVehicleForPhotos && selectedUserForPhotos && (
              <p>Please select a vehicle to view photos.</p>
            )}
            {/* Message if no user is selected */}
            {!selectedUserForPhotos && (
              <p>Please select a user and vehicle to view photos.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* --- Send SMS Modal (Refactored with Search and Add Dropdown) --- */}
      <Modal
        isOpen={activeModal === "sendSms"}
        onRequestClose={closeModal}
        contentLabel="Send SMS Message Modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Send SMS Message</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search users by name, email, phone..."
            value={smsSearchQuery}
            onChange={(e) => setSmsSearchQuery(e.target.value)}
            className="modal-form-input" // Use consistent class
            style={{ marginBottom: "15px" }} // Add spacing
          />

          <form className="modal-form" onSubmit={handleSendSmsSubmit}>
            {/* --- Recipient ADD Dropdown --- */}
            <select
              onChange={handleSmsUserSelectToAdd}
              value="" // Keep value fixed to "" to act as a trigger
              className="modal-form-select" // Use consistent class
              aria-label="Add SMS Recipient" // Accessibility
            >
              <option value="">-- Add Recipient --</option>
              {filteredSmsUsersForDropdown.length > 0 ? (
                filteredSmsUsersForDropdown.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.full_name} ({user.phone}) {/* Display phone */}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {smsSearchQuery
                    ? "No matching users found"
                    : "No available users to add"}
                </option>
              )}
            </select>

            {/* --- Display Selected Recipients --- */}
            <div
              className="sms-selected-recipients" // Add a class for potential styling
              style={{ marginTop: "10px", marginBottom: "15px" }}
            >
              <strong style={{ display: "block", marginBottom: "5px" }}>
                Recipients ({smsRecipients.length}):
              </strong>
              {smsRecipients.length === 0 ? (
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#666",
                    margin: "5px 0 0 0", // Adjust margin
                  }}
                >
                  No recipients added yet.
                </p>
              ) : (
                <ul
                  style={{
                    // Basic styling for the list
                    listStyle: "none",
                    paddingLeft: 0,
                    marginTop: "5px",
                    maxHeight: "150px", // Limit height and make scrollable
                    overflowY: "auto",
                    border: "1px solid #eee", // Visual separation
                    borderRadius: "4px",
                    padding: "10px",
                  }}
                >
                  {smsRecipients.map((userId) => {
                    const user = users.find((u) => u.user_id === userId);
                    // Basic check in case user data is somehow missing briefly
                    if (!user) return <li key={userId}>Loading user...</li>;
                    return (
                      <li
                        key={userId}
                        style={{
                          // Style for each recipient item
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 5px",
                          borderBottom: "1px solid #eee", // Separator line
                        }}
                      >
                        <span style={{ fontSize: "0.9rem" }}>
                          {user.full_name} ({user.phone})
                        </span>
                        <button
                          type="button" // Prevent form submission
                          onClick={() => handleRemoveSmsRecipient(userId)}
                          title={`Remove ${user.full_name}`}
                          className="remove-recipient-button" // Add class for styling
                          aria-label={`Remove ${user.full_name} from recipients`}
                          style={{
                            // Simple styling for remove button
                            background: "none",
                            border: "none",
                            color: "#dc3545", // Danger color
                            cursor: "pointer",
                            fontSize: "1.2rem", // Make 'x' larger
                            padding: "0 5px",
                            lineHeight: "1",
                          }}
                        >
                          &times; {/* Simple 'x' character */}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Message Input */}
            <textarea
              placeholder="Enter your message content here... 'From Express Auto:' and 'Reply STOP...' will be added automatically."
              rows="4"
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              required
              className="modal-form-textarea" // Use consistent class
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={smsRecipients.length === 0 || !smsMessage.trim()}
            >
              Send SMS to {smsRecipients.length} User(s)
            </button>
          </form>
          {/* Optional: Display API feedback message inside modal */}
          {/* {message && <div className="status-message" style={{marginTop: '15px'}}>{message}</div>} */}
        </div>
      </Modal>
      {/* --- End Send SMS Modal --- */}

      <Footer />
    </>
  );
}

export default AdminPage;
