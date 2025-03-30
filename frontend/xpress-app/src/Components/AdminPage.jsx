// Authors: Your Name
import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Modal from "react-modal";
import { X } from "lucide-react";

const adminStyles = `
  /* Container and header */
  .admin-container {
    padding: 20px;
    font-family: sans-serif;
    color: #333;
  }
    .admin-box {
      width: 90%; 
      max-width: 1000px;
      background-color: #white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid #eee;
  
  .admin-overview {
    margin-bottom: 30px;
    text-align: center;
  }
  
  .admin-overview h1 {
    font-size: 2rem;
    margin-bottom: 10px;
  }
  
  /* Admin actions grid */
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
  
  /* Status message */
  .status-message {
    text-align: center;
    padding: 10px;
    margin-bottom: 20px;
    background-color: #f0f8ff;
    border-radius: 5px;
  }
  
  /* Modal content common styling */
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
  
  /* Responsive design */
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

  const openModal = (modalName) => {
    setActiveModal(modalName);
    setMessage("");
  };

  const closeModal = () => {
    setActiveModal(null);
    setMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("This function is not yet done.");
  };

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

        <Modal
          isOpen={activeModal === "addUser"}
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
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Add User</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="Name" required />
              <input type="email" placeholder="Email" required />
              <select required>
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
              </select>
              <button type="submit">Submit</button>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={activeModal === "addService"}
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
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Add Service</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="Service Name" required />
              <textarea placeholder="Description" rows="3" />
              <input type="number" placeholder="Price" step="0.01" required />
              <button type="submit">Submit</button>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={activeModal === "addLoyaltyPoints"}
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
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Add Loyalty Points</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="User ID or Email" required />
              <input type="number" placeholder="Points Amount" required />
              <button type="submit">Submit</button>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={activeModal === "addBankInfo"}
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
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Add Bank Information</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="Bank Name" required />
              <input type="text" placeholder="Account Number" required />
              <input type="text" placeholder="Routing Number" required />
              <button type="submit">Submit</button>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={activeModal === "managePosts"}
          onRequestClose={closeModal}
          style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000 },
            content: {
              width: "90%",
              maxWidth: "600px",
              margin: "auto",
              padding: "20px",
              borderRadius: "8px",
            },
          }}
        >
          <div className="modal-content">
            <button
              onClick={closeModal}
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Manage Posts</h2>
            <p>This section is for adding, deleting, or editing posts. (Placeholder)</p>
          </div>
        </Modal>

        <Modal
          isOpen={activeModal === "viewPhotos"}
          onRequestClose={closeModal}
          style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000 },
            content: {
              width: "90%",
              maxWidth: "800px",
              margin: "auto",
              padding: "20px",
              borderRadius: "8px",
            },
          }}
        >
          <div className="modal-content">
            <button
              onClick={closeModal}
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>View Photos</h2>
            <p>Placeholder to display photos from users or vehicles.</p>
          </div>
        </Modal>

        <Modal
          isOpen={activeModal === "updateVehicleStatus"}
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
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Update Vehicle Status</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="Vehicle ID" required />
              <select required>
                <option value="">Select Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              <button type="submit">Update</button>
            </form>
          </div>
        </Modal>

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
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Send Notifications</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="Title" required />
              <textarea placeholder="Message" rows="3" required />
              <button type="submit">Send</button>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={activeModal === "sendInvoice"}
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
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <h2>Send Invoice</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input type="text" placeholder="User ID or Email" required />
              <input type="number" placeholder="Invoice Amount" step="0.01" required />
              <textarea placeholder="Invoice Details" rows="3" />
              <button type="submit">Send Invoice</button>
            </form>
          </div>
        </Modal>
      <Footer />
    </>
  );
}

export default AdminPage;
