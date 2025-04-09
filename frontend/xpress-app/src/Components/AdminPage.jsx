import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Modal from "react-modal";
import { X } from "lucide-react";
import axios from "axios";

// Combined admin styles with modal-specific styles appended
const adminStyles = `
  /* Existing Admin Styles */
  .admin-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    background-color: white;
  }
  .admin-box {
    width: 100%;
    max-width: 1000px;
    background-color: white;
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #eee;
    margin: auto;
  }
  .admin-overview {
    margin-bottom: 30px;
    text-align: center;
  }
  .admin-overview h1 {
    font-size: 2rem;
    margin-bottom: 10px;
  }
  .admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
    margin-bottom: 40px;
  }
  .admin-actions button {
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
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
    padding: 0 15px;
  }
  .admin-actions button:hover {
    background-color: #ffd700;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  .status-message {
    text-align: center;
    padding: 10px;
    margin-bottom: 20px;
    background-color: #f0f8ff;
    border-radius: 5px;
  }
  .modal-content {
    padding: 20px;
  }
  .modal-content h2 {
    margin-top: 0;
    text-align: center;
  }
  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }
  .modal-form input,
  .modal-form textarea,
  .modal-form select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
  }
  .modal-form button {
    width: 100%;
    height: 40px;
    background-color: rgba(255, 204, 0, 0.95);
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .modal-form button:hover {
    background-color: #ffd700;
  }

  /* Modal Styles */
  .ReactModal__Overlay {
    background-color: rgba(0, 0, 0, 0.6) !important;
    z-index: 1000;
  }
  .ReactModal__Content {
    position: relative;
    margin: auto;
    width: 90%;
    max-width: 500px;
    padding: 20px;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    border: none;
    outline: none;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }
  .modal-form input,
  .modal-form textarea,
  .modal-form select {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  .modal-form input:focus,
  .modal-form textarea:focus,
  .modal-form select:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  .modal-form button {
    padding: 12px;
    width: 100%;
    background-color: #ffcc00;
    border: none;
    border-radius: 5px;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.3s ease;
  }
  .modal-form button:hover {
    background-color: #e6b800;
    transform: translateY(-2px);
  }
`;

Modal.setAppElement("#root");

function AdminPage() {
  // Main modal state
  const [activeModal, setActiveModal] = useState(null);
  const [message, setMessage] = useState("");

  // Shared data
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

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
  // New states for vehicle status modal: user selection and that user’s vehicles
  const [selectedUserForVehicleStatus, setSelectedUserForVehicleStatus] =
    useState("");
  const [vehiclesForSelectedUser, setVehiclesForSelectedUser] = useState([]);

  // Send Invoice state
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceVehicleId, setInvoiceVehicleId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  //Invoice State
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceSelectedUser, setInvoiceSelectedUser] = useState("");
  const [vehiclesForInvoice, setVehiclesForInvoice] = useState([]);
  const [isLoadingInvoiceNumber, setIsLoadingInvoiceNumber] = useState(false);

  // Open modal and fetch necessary data
  const openModal = (modalName) => {
    setActiveModal(modalName);
    setMessage("");
    if (
      modalName === "sendNotifications" ||
      modalName === "addLoyaltyPoints" ||
      modalName === "updateVehicleStatus" ||
      modalName === "sendInvoice"
    ) {
      // Fetch users for these modals
      axios
        .get("http://localhost:5000/api/get-users", { withCredentials: true })
        .then((res) => {
          if (res.data.status === "success") {
            setUsers(res.data.users);
          }
        })
        .catch((err) => console.error("Error fetching users:", err));
    }
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
    setVehicleSearchQuery("");
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
  };

  // Handlers for form submissions
  const handleInvoiceUserChange = (e) => {
    const userId = e.target.value;
    setInvoiceSelectedUser(userId);
    setInvoiceEmail(
      users.find((user) => user.user_id === parseInt(userId))?.email || ""
    );

    // Fetch vehicles for the selected user
    axios
      .get(`http://localhost:5000/api/get-vehicles/${userId}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.status === "success") {
          setVehiclesForInvoice(res.data.vehicles);
        }
      })
      .catch((err) =>
        console.error("Error fetching vehicles for invoice:", err)
      );
  };

  // Add this handler for vehicle selection
  const handleInvoiceVehicleChange = (e) => {
    setInvoiceVehicleId(e.target.value);
  };
  //search users in invoice modal
  const filteredInvoiceUsers = users.filter((user) => {
    const query = invoiceSearchQuery.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.toLowerCase().includes(query))
    );
  });

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
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
        setMessage("Failed to send notification.");
      }
    } catch (err) {
      console.error("Send notification error:", err);
      setMessage("An error occurred.");
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/add-user", {
        email: newUserEmail,
        password: newUserPassword,
        first_name: newUserFirstName,
        last_name: newUserLastName,
        phone: newUserPhone,
      });
      if (res.data.status === "success") {
        setMessage("User added successfully!");
        closeModal();
      } else {
        setMessage("Failed to add user.");
      }
    } catch (err) {
      console.error("Add user error:", err);
      setMessage("An error occurred while adding user.");
    }
  };

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      // Assuming an endpoint /api/add-service will be implemented
      const res = await axios.post("http://localhost:5000/api/add-service", {
        service_name: serviceName,
        service_description: serviceDescription,
        service_price: servicePrice,
      });
      if (res.data.status === "success") {
        setMessage("Service added successfully!");
        closeModal();
      } else {
        setMessage("Failed to add service.");
      }
    } catch (err) {
      console.error("Add service error:", err);
      setMessage("An error occurred while adding service.");
    }
  };

  const handleAddLoyaltyPointsSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/add-loyalty-points",
        {
          user_id: loyaltySelectedUser,
          points: loyaltyPoints,
        }
      );
      if (res.data.status === "success") {
        setMessage("Loyalty points added!");
        closeModal();
      } else {
        setMessage("Failed to add loyalty points.");
      }
    } catch (err) {
      console.error("Loyalty points error:", err);
      setMessage("An error occurred while adding loyalty points.");
    }
  };
  const handleUpdateVehicleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setMessage("Please select a vehicle.");
      return;
    }
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
        setMessage("Failed to update vehicle status.");
      }
    } catch (err) {
      console.error("Update vehicle status error:", err);
      setMessage("An error occurred while updating vehicle status.");
    }
  };

  const handleSendInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/create-invoice", {
        email: invoiceEmail,
        vehicle_id: invoiceVehicleId,
        invoice_number: invoiceNumber,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: invoiceStatus,
        due_date: dueDate,
        notes,
        items: [],
      });
      if (res.data.status === "success") {
        setMessage("Invoice created!");
        closeModal();
      } else {
        setMessage("Failed to create invoice.");
      }
    } catch (err) {
      console.error("Send invoice error:", err);
      setMessage("An error occurred while sending invoice.");
    }
  };

  // Handler for when an admin selects a user in the vehicle status modal
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUserForVehicleStatus(userId);
    // Fetch vehicles for the selected user from the backend endpoint
    axios
      .get(`http://localhost:5000/api/get-vehicles/${userId}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.status === "success") {
          setVehiclesForSelectedUser(res.data.vehicles);
        }
      })
      .catch((err) => console.error("Error fetching vehicles for user:", err));
  };

  // Handler for when an admin selects a vehicle from the fetched list
  const handleVehicleChange = (e) => {
    const vehicleId = Number(e.target.value);
    const vehicle = vehiclesForSelectedUser.find(
      (v) => v.vehicle_id === vehicleId
    );
    setSelectedVehicle(vehicle);
  };

  // Client-side filtering for loyalty points user search
  const filteredUsers = users.filter((user) => {
    const query = loyaltySearchQuery.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.toLowerCase().includes(query))
    );
  });

  // Filter vehicles based on license plate query (if needed elsewhere)
  // const filteredVehicles = vehicles.filter((vehicle) => {
  //   const query = vehicleSearchQuery.toLowerCase();
  //   return (
  //     vehicle.license_plate &&
  //     vehicle.license_plate.toLowerCase().includes(query)
  //   );
  // });

  return (
    <>
      <style>{adminStyles}</style>
      <Header />
      <main className="admin-container">
        <div className="admin-box">
          <section className="admin-overview">
            <h1>Admin Panel</h1>
            <p>Control user accounts and manage services.</p>
          </section>
          {message && <div className="status-message">{message}</div>}
          <section className="admin-actions">
            <button onClick={() => openModal("addUser")}>Add User</button>
            <button onClick={() => openModal("addService")}>Add Service</button>
            <button onClick={() => openModal("addLoyaltyPoints")}>
              Add Loyalty Points
            </button>
            <button onClick={() => openModal("addBankInfo")}>
              Add Bank Information
            </button>
            <button onClick={() => openModal("managePosts")}>
              Manage Posts
            </button>
            <button onClick={() => openModal("viewPhotos")}>View Photos</button>
            <button onClick={() => openModal("updateVehicleStatus")}>
              Update Vehicle Status
            </button>
            <button onClick={() => openModal("sendNotifications")}>
              Send Notifications
            </button>
            <button onClick={() => openModal("sendInvoice")}>
              Send Invoice
            </button>
          </section>
        </div>
      </main>
      {/* Send Notifications Modal */}
      <Modal
        isOpen={activeModal === "sendNotifications"}
        onRequestClose={closeModal}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Send Notification</h2>
            <button
              onClick={closeModal}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </div>
          <form className="modal-form" onSubmit={handleNotificationSubmit}>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
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
            />
            <textarea
              placeholder="Message"
              rows="3"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              required
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </Modal>
      {/* Add User Modal */}
      <Modal isOpen={activeModal === "addUser"} onRequestClose={closeModal}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add User</h2>
            <button
              onClick={closeModal}
              style={{ background: "none", border: "none", cursor: "pointer" }}
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
            />
            <input
              type="password"
              placeholder="Password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="First Name"
              value={newUserFirstName}
              onChange={(e) => setNewUserFirstName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newUserLastName}
              onChange={(e) => setNewUserLastName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Phone"
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
            />
            <button type="submit">Add User</button>
          </form>
        </div>
      </Modal>
      {/* Add Service Modal */}
      <Modal isOpen={activeModal === "addService"} onRequestClose={closeModal}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add Service</h2>
            <button
              onClick={closeModal}
              style={{ background: "none", border: "none", cursor: "pointer" }}
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
            />
            <textarea
              placeholder="Service Description"
              rows="3"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Service Price"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              required
            />
            <button type="submit">Add Service</button>
          </form>
        </div>
      </Modal>
      {/* Add Loyalty Points Modal */}
      <Modal
        isOpen={activeModal === "addLoyaltyPoints"}
        onRequestClose={closeModal}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add Loyalty Points</h2>
            <button
              onClick={closeModal}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            value={loyaltySearchQuery}
            onChange={(e) => setLoyaltySearchQuery(e.target.value)}
          />
          <form className="modal-form" onSubmit={handleAddLoyaltyPointsSubmit}>
            <select
              value={loyaltySelectedUser}
              onChange={(e) => setLoyaltySelectedUser(e.target.value)}
              required
            >
              <option value="">Select User</option>
              {filteredUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Points to Add"
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(e.target.value)}
              required
            />
            <button type="submit">Add Points</button>
          </form>
        </div>
      </Modal>
      {/* Update Vehicle Status Modal */}
      <Modal
        isOpen={activeModal === "updateVehicleStatus"}
        onRequestClose={closeModal}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Update Vehicle Status</h2>
            <button
              onClick={closeModal}
              style={{ background: "none", border: "none", cursor: "pointer" }}
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
              onChange={handleUserChange}
              required
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
              onChange={handleVehicleChange}
              required
            >
              <option value="">Select Vehicle</option>
              {vehiclesForSelectedUser.map((vehicle) => (
                <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                  {vehicle.license_plate} - {vehicle.make} {vehicle.model} (
                  {vehicle.vehicle_status})
                </option>
              ))}
            </select>
            {/* Dropdown to choose the new status */}
            <select
              value={newVehicleStatus}
              onChange={(e) => setNewVehicleStatus(e.target.value)}
              required
            >
              <option value="Waiting">Waiting</option>
              <option value="Active">Active</option>
              <option value="OffLot">OffLot</option>
            </select>
            <button type="submit">Update Status</button>
          </form>
        </div>
      </Modal>
      {/* Send Invoice Modal */}
      <Modal isOpen={activeModal === "sendInvoice"} onRequestClose={closeModal}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Send Invoice</h2>
            <button
              onClick={closeModal}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </div>
          {/* Search input similar to loyalty points */}
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            value={invoiceSearchQuery}
            onChange={(e) => setInvoiceSearchQuery(e.target.value)}
          />
          <form className="modal-form" onSubmit={handleSendInvoiceSubmit}>
            {/* User selection dropdown */}
            <select
              value={invoiceSelectedUser}
              onChange={handleInvoiceUserChange}
              required
            >
              <option value="">Select User</option>
              {filteredInvoiceUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>

            {/* Vehicle selection dropdown */}
            <select
              value={invoiceVehicleId}
              onChange={handleInvoiceVehicleChange}
              required
            >
              <option value="">Select Vehicle</option>
              {vehiclesForInvoice.map((vehicle) => (
                <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                  {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>

            {/* Hidden email field that gets populated automatically */}
            <input type="hidden" value={invoiceEmail} />

            <div className="input-with-label">
              <label>Invoice Number</label>
              <input
                type="text"
                placeholder={
                  isLoadingInvoiceNumber ? "Generating..." : "Invoice Number"
                }
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled
                required
              />
              <small>Automatically generated</small>
            </div>
            <input
              type="number"
              placeholder="Subtotal"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Tax Amount"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Discount Amount"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Total Amount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
            <select
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
              required
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
            />
            <textarea
              placeholder="Notes"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button type="submit">Send Invoice</button>
          </form>
        </div>
      </Modal>
      <Footer />
    </>
  );
}

export default AdminPage;
