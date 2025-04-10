// Authors: Joe, Josh
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Modal from "react-modal";
import { X } from "lucide-react";
import axios from "axios";

const adminStyles = `
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

  .photo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 15px;
  }

  .photo-grid img {
    width: 150px;
    border-radius: 8px;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    .admin-actions {
      flex-direction: column;
      align-items: center;
    }

    .admin-actions button {
      width: 100%;
      max-width: 280px;
    }
  }
`;

Modal.setAppElement("#root");

function AdminPage() {
  const [activeModal, setActiveModal] = useState(null);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  // View Photos feature states
  const [viewPhotosUsers, setViewPhotosUsers] = useState([]);
  const [selectedPhotoUser, setSelectedPhotoUser] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [vehiclePhotos, setVehiclePhotos] = useState([]);

  const openModal = (modalName) => {
    setActiveModal(modalName);
    setMessage("");

    if (modalName === "sendNotifications" || modalName === "viewPhotos") {
      axios.get("http://localhost:5000/api/get-users", { withCredentials: true })
        .then(res => {
          if (res.data.status === "success") {
            setUsers(res.data.users);
            setViewPhotosUsers(res.data.users);
          }
        })
        .catch(err => console.error("Error fetching users:", err));
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setMessage("");
    setSelectedUser("");
    setNotificationTitle("");
    setNotificationMessage("");
    setSelectedPhotoUser("");
    setSelectedVehicle("");
    setVehicles([]);
    setVehiclePhotos([]);
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/send-notification", {
        user_id: selectedUser,
        title: notificationTitle,
        message: notificationMessage
      }, { withCredentials: true });

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

  useEffect(() => {
    if (selectedPhotoUser) {
      axios.get(`http://localhost:5000/api/get-vehicles/${selectedPhotoUser}`, { withCredentials: true })
        .then(res => {
          if (res.data.status === "success") {
            setVehicles(res.data.vehicles);
          }
        })
        .catch(err => console.error("Error fetching vehicles:", err));
    } else {
      setVehicles([]);
      setSelectedVehicle("");
      setVehiclePhotos([]);
    }
  }, [selectedPhotoUser]);

  useEffect(() => {
    if (selectedVehicle) {
      axios.get(`http://localhost:5000/api/get-vehicle-photos/${selectedVehicle}`, { withCredentials: true })
        .then(res => {
          if (res.data.status === "success") {
            setVehiclePhotos(res.data.photos);
          }
        })
        .catch(err => console.error("Error fetching photos:", err));
    } else {
      setVehiclePhotos([]);
    }
  }, [selectedVehicle]);

  return (
    <>
      <style>{adminStyles}</style>
      <Header />
      <main className="admin-container">
        <div className="admin-box">
          <section className="admin-overview">
            <h1>Admin Panel - God Mode</h1>
            <p>Control user accounts and manage services.</p>
          </section>

          {message && <div className="status-message">{message}</div>}

          <section className="admin-actions">
            <button onClick={() => openModal("addUser")}>Add User</button>
            <button onClick={() => openModal("addService")}>Add Service</button>
            <button onClick={() => openModal("addLoyaltyPoints")}>Add Loyalty Points</button>
            <button onClick={() => openModal("addBankInfo")}>Add Bank Information</button>
            <button onClick={() => openModal("managePosts")}>Manage Posts</button>
            <button onClick={() => openModal("viewPhotos")}>View Photos</button>
            <button onClick={() => openModal("updateVehicleStatus")}>Update Vehicle Status</button>
            <button onClick={() => openModal("sendNotifications")}>Send Notifications</button>
            <button onClick={() => openModal("sendInvoice")}>Send Invoice</button>
          </section>
        </div>
      </main>

      {/* View Photos Modal */}
      <Modal
        isOpen={activeModal === "viewPhotos"}
        onRequestClose={closeModal}
        style={{
          overlay: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000 },
          content: {
            width: "90%",
            maxWidth: "700px",
            margin: "auto",
            padding: "20px",
            borderRadius: "8px",
          },
        }}
      >
        <div className="modal-content">
          <button
            onClick={closeModal}
            style={{ float: "right", background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
          <h2>View Vehicle Photos</h2>
          <div className="modal-form">
            <select value={selectedPhotoUser} onChange={(e) => setSelectedPhotoUser(e.target.value)}>
              <option value="">Select User</option>
              {viewPhotosUsers.map(user => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name || `${user.first_name} ${user.last_name}`} ({user.email})
                </option>
              ))}
            </select>

            {vehicles.length > 0 && (
              <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                <option value="">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.make} {v.model} ({v.year})
                  </option>
                ))}
              </select>
            )}

            <div className="photo-grid">
              {vehiclePhotos.length > 0 ? (
                vehiclePhotos.map(photo => (
                  <div key={photo.media_id}>
                    <img src={photo.file_url} alt={photo.title} />
                    <div style={{ fontSize: "0.85rem", textAlign: "center" }}>{photo.title}</div>
                  </div>
                ))
              ) : selectedVehicle && (
                <p>No photos found for this vehicle.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Send Notifications Modal */}
      <Modal
        isOpen={activeModal === "sendNotifications"}
        onRequestClose={closeModal}
        style={{
          overlay: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000 },
          content: {
            width: "90%",
            maxWidth: "500px",
            margin: "auto",
            padding: "20px",
            borderRadius: "8px",
          },
        }}
      >
        <div className="modal-content">
          <button
            onClick={closeModal}
            style={{ float: "right", background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
          <h2>Send Notification</h2>
          <form className="modal-form" onSubmit={handleNotificationSubmit}>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name || `${user.first_name} ${user.last_name}`} ({user.email})
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

      <Footer />
    </>
  );
}

export default AdminPage;
