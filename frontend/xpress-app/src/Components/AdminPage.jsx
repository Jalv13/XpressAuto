import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Modal from "react-modal";
import { X, ExternalLink, MessageSquare, Bell } from "lucide-react"; // Added Icons
import axios from "axios";
import "./cssFiles/PossibleDeadCSS.css"; // Keep if relevant
import "./cssFiles/admin.css";

Modal.setAppElement("#root"); // Ensure this runs for accessibility

function AdminPage() {
  // Main modal state
  const [activeModal, setActiveModal] = useState(null);
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState(""); // Specific message for modals

  // Shared data
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]); // Keep if needed by other modals

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

  // --- ADDED Unpaid Invoices state ---
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState(new Set()); // Use a Set for efficient add/delete
  const [isLoadingUnpaidInvoices, setIsLoadingUnpaidInvoices] = useState(false);
  const [unpaidInvoiceError, setUnpaidInvoiceError] = useState("");
  const [reminderMessage, setReminderMessage] = useState(
    "Reminder: You have {invoice_count} unpaid invoice(s) totaling ${total_due}. Please log in to view details."
  ); // Default reminder message with placeholders
  const [reminderTitle, setReminderTitle] = useState("Unpaid Invoice Reminder"); // Default notification title
  // --- END ADDED Unpaid Invoices state ---

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

  // Send Invoice state (Create Invoice Modal)
  // const [invoiceEmail, setInvoiceEmail] = useState(""); // Can likely be removed if backend uses user_id
  const [invoiceVehicleId, setInvoiceVehicleId] = useState("");
  // const [invoiceNumber, setInvoiceNumber] = useState(""); // Assuming backend generates this now
  const [subtotal, setSubtotal] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Invoice State - Specific (Create Invoice Modal)
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceSelectedUser, setInvoiceSelectedUser] = useState("");
  const [vehiclesForInvoice, setVehiclesForInvoice] = useState([]);
  const [isLoadingInvoiceNumber, setIsLoadingInvoiceNumber] = useState(false); // Keep if still relevant

  // Selected user for photos state
  const [selectedUserForPhotos, setSelectedUserForPhotos] = useState("");
  const [vehiclesForPhotos, setVehiclesForPhotos] = useState([]);
  const [selectedVehicleForPhotos, setSelectedVehicleForPhotos] = useState("");
  const [vehiclePhotos, setVehiclePhotos] = useState([]);

  // Send Bulk SMS state
  const [smsRecipients, setSmsRecipients] = useState([]); // Array of user_ids
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSearchQuery, setSmsSearchQuery] = useState(""); // For filtering users

  // Active Jobs state
  const [activeJobs, setActiveJobs] = useState([]);

  // Fetch unpaid invoices (using useCallback to potentially optimize)
  const fetchUnpaidInvoices = useCallback(async () => {
    setIsLoadingUnpaidInvoices(true);
    setUnpaidInvoiceError("");
    setModalMessage("Loading unpaid invoices..."); // Use modal message
    try {
      const res = await axios.get(
        "http://localhost:5000/api/get-unpaid-invoices",
        { withCredentials: true }
      );
      if (res.data.status === "success") {
        setUnpaidInvoices(res.data.unpaid_invoices);
        setModalMessage(""); // Clear loading message on success
      } else {
        throw new Error(res.data.message || "Failed to fetch unpaid invoices");
      }
    } catch (err) {
      console.error("Error fetching unpaid invoices:", err);
      const errorMsg = `Error loading unpaid invoices: ${
        err.response?.data?.message || err.message
      }`;
      setUnpaidInvoiceError(errorMsg);
      setModalMessage(errorMsg); // Show error in modal
    } finally {
      setIsLoadingUnpaidInvoices(false);
      // Optionally clear general message if only modal message is desired
      // setMessage("");
    }
  }, []); // Empty dependency array means this function is created once

  // Open modal and fetch necessary data
  const openModal = (modalName) => {
    setActiveModal(modalName);
    setMessage(""); // Clear general page message
    setModalMessage(""); // Clear previous modal messages

    // Fetch users for relevant modals (keep existing logic)
    if (
      modalName === "sendNotifications" ||
      modalName === "addLoyaltyPoints" ||
      modalName === "updateVehicleStatus" ||
      modalName === "sendInvoice" ||
      modalName === "viewPhotos" ||
      modalName === "sendSms" ||
      modalName === "unpaidInvoices" // Also fetch users if needed for Unpaid Invoice context (e.g., display details)
    ) {
      axios
        .get("http://localhost:5000/api/get-users", { withCredentials: true })
        .then((res) => {
          if (res.data.status === "success") {
            setUsers(res.data.users);
          } else {
            console.error("Failed to fetch users:", res.data.message);
            setModalMessage(
              // Set modal message for errors
              `Error loading users: ${res.data.message || "Unknown error"}`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching users:", err);
          setModalMessage(
            // Set modal message for errors
            `Error loading users: ${err.response?.data?.message || err.message}`
          );
        });
    }

    // Fetch active jobs (keep existing logic)
    if (modalName === "active-jobs") {
      axios
        .get("http://localhost:5000/api/active-jobs", { withCredentials: true })
        .then((res) => {
          if (res.data.status === "success") {
            setActiveJobs(res.data.active_jobs);
            setModalMessage(""); // Clear message on success
          } else {
            console.error("Failed to fetch active jobs:", res.data.message);
            setModalMessage(
              // Use modal message
              `Error loading active jobs: ${
                res.data.message || "Unknown error"
              }`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching active jobs:", err);
          setModalMessage(
            // Use modal message
            `Error loading active jobs: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }

    // --- ADDED: Fetch unpaid invoices when opening the new modal ---
    if (modalName === "unpaidInvoices") {
      fetchUnpaidInvoices(); // Call the fetch function
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setMessage("");
    setModalMessage(""); // Clear modal message on close

    // Reset all modal-specific states
    setSelectedUser("");
    setNotificationTitle("");
    setNotificationMessage("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserPhone("");
    // --- ADDED Unpaid Invoices Reset ---
    setUnpaidInvoices([]);
    setSelectedInvoiceIds(new Set()); // Reset to empty Set
    setIsLoadingUnpaidInvoices(false);
    setUnpaidInvoiceError("");
    setReminderMessage(
      "Reminder: You have {invoice_count} unpaid invoice(s) totaling ${total_due}. Please log in to view details."
    ); // Reset reminder message
    setReminderTitle("Unpaid Invoice Reminder"); // Reset reminder title
    // --- END ADDED Unpaid Invoices Reset ---
    setLoyaltySearchQuery("");
    setLoyaltySelectedUser("");
    setLoyaltyPoints("");
    setSelectedVehicle(null);
    setNewVehicleStatus("OffLot");
    setSelectedUserForVehicleStatus("");
    setVehiclesForSelectedUser([]);
    // setInvoiceEmail(""); // Removed
    setInvoiceVehicleId("");
    // setInvoiceNumber(""); // Removed
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
    setSmsRecipients([]);
    setSmsMessage("");
    setSmsSearchQuery("");
  };

  // --- Filtering Logic (Keep existing filters) ---
  // Filter for Loyalty Points
  const filteredUsers = users.filter((user) => {
    const query = loyaltySearchQuery.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(query) || false;
    const emailMatch = user.email?.toLowerCase().includes(query) || false;
    const phoneMatch = user.phone?.toLowerCase().includes(query) || false;
    return nameMatch || emailMatch || phoneMatch;
  });

  // Filter for Create Invoice Users
  const filteredInvoiceUsers = users.filter((user) => {
    const query = invoiceSearchQuery.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(query) || false;
    const emailMatch = user.email?.toLowerCase().includes(query) || false;
    const phoneMatch = user.phone?.toLowerCase().includes(query) || false;
    return nameMatch || emailMatch || phoneMatch;
  });

  // Filter for SMS Dropdown Options (Bulk SMS modal)
  const filteredSmsUsersForDropdown = users.filter((user) => {
    const query = smsSearchQuery.toLowerCase();
    const hasPhone = !!user.phone;
    const matchesQuery =
      hasPhone &&
      (user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query));
    const isAlreadySelected = smsRecipients.includes(user.user_id);
    return matchesQuery && !isAlreadySelected;
  });

  // --- Handlers for form submissions & changes (Keep existing handlers, adapt message state) ---

  // Create Invoice Handlers
  const handleInvoiceUserChange = (e) => {
    const userId = e.target.value;
    setInvoiceSelectedUser(userId);
    // Find user details - assuming 'users' state is populated
    // const selectedUserDetails = users.find( user => user.user_id === parseInt(userId) );
    // setInvoiceEmail(selectedUserDetails?.email || ""); // Keep if needed, otherwise remove
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
            setModalMessage(
              `Error fetching vehicles for invoice: ${
                res.data.message || "Unknown error"
              }`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicles for invoice:", err);
          setModalMessage(
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

  // Send Notification Submit (Individual Notification Modal)
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setModalMessage("Please select a user."); // Use modal message
      return;
    }
    setModalMessage("Sending notification..."); // Use modal message
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
        setMessage("Notification sent successfully!"); // General message ok here after close
        closeModal();
      } else {
        setModalMessage(
          // Use modal message
          `Failed to send notification: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Send notification error:", err);
      setModalMessage(
        // Use modal message
        `An error occurred: ${err.response?.data?.message || err.message}`
      );
    }
  };

  // Add User Submit
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setModalMessage("Adding user..."); // Use modal message
    try {
      const res = await axios.post(
        "http://localhost:5000/api/add-user",
        {
          email: newUserEmail,
          password: newUserPassword, // Ensure you are hashing on the backend!
          first_name: newUserFirstName,
          last_name: newUserLastName,
          phone: newUserPhone,
        },
        { withCredentials: true }
      );
      if (res.data.status === "success") {
        setMessage("User added successfully!"); // General message ok after close
        closeModal();
        // Consider fetching users again if the list needs immediate update
        // fetchUsers(); // You would need to define a fetchUsers function
      } else {
        setModalMessage(
          // Use modal message
          `Failed to add user: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Add user error:", err);
      setModalMessage(
        // Use modal message
        `An error occurred while adding user: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Add Loyalty Points Submit
  const handleAddLoyaltyPointsSubmit = async (e) => {
    e.preventDefault();
    if (!loyaltySelectedUser) {
      setModalMessage("Please select a user."); // Use modal message
      return;
    }
    if (!loyaltyPoints || loyaltyPoints <= 0) {
      setModalMessage("Please enter a valid number of points to add."); // Use modal message
      return;
    }
    setModalMessage("Adding points..."); // Use modal message
    try {
      const res = await axios.post(
        "http://localhost:5000/api/add-loyalty-points",
        {
          user_id: loyaltySelectedUser, // IMPORTANT: Ensure this sends the TARGET user's ID
          points: loyaltyPoints,
        },
        { withCredentials: true } // Admin auth
      );
      if (res.data.status === "success") {
        setMessage("Loyalty points added!"); // General message ok after close
        closeModal();
      } else {
        setModalMessage(
          // Use modal message
          `Failed to add loyalty points: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Loyalty points error:", err);
      setModalMessage(
        // Use modal message
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
      setModalMessage("Please select a vehicle."); // Use modal message
      return;
    }
    setModalMessage("Updating status..."); // Use modal message
    try {
      const res = await axios.put(
        `http://localhost:5000/api/update-vehicle-status/${selectedVehicle.vehicle_id}`,
        { vehicle_status: newVehicleStatus },
        { withCredentials: true }
      );
      if (res.data.status === "success") {
        setMessage("Vehicle status updated!"); // General message ok after close
        closeModal();
        // Optionally re-fetch data if needed immediately (e.g., active jobs)
      } else {
        setModalMessage(
          // Use modal message
          `Failed to update vehicle status: ${
            res.data.message || "Unknown error"
          }`
        );
      }
    } catch (err) {
      console.error("Update vehicle status error:", err);
      setModalMessage(
        // Use modal message
        `An error occurred while updating vehicle status: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Send Invoice Submit (Create Invoice Modal)
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
      setModalMessage(
        // Use modal message
        "Please fill in all required invoice fields (User, Vehicle, Total, Status, Due Date)."
      );
      return;
    }
    setModalMessage("Creating invoice..."); // Use modal message
    try {
      // Assuming backend generates invoice_number and uses user_id
      const res = await axios.post(
        "http://localhost:5000/api/create-invoice",
        {
          user_id: invoiceSelectedUser, // Send user_id
          vehicle_id: invoiceVehicleId,
          subtotal,
          tax_amount: taxAmount || 0,
          discount_amount: discountAmount || 0,
          total_amount: totalAmount,
          status: invoiceStatus,
          due_date: dueDate,
          notes,
        },
        { withCredentials: true }
      );

      if (res.data.status === "success") {
        setMessage(
          // General message ok after close
          `Invoice ${res.data.invoice_number || ""} created successfully!`
        );
        closeModal();
      } else {
        setModalMessage(
          // Use modal message
          `Failed to create invoice: ${res.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Send invoice error:", err);
      setModalMessage(
        // Use modal message
        `An error occurred while creating invoice: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Update Vehicle Status Handlers
  const handleUserChangeForVehicleStatus = (e) => {
    // Renamed for clarity
    const userId = e.target.value;
    setSelectedUserForVehicleStatus(userId);
    setSelectedVehicle(null);
    setVehiclesForSelectedUser([]);
    if (userId) {
      axios
        .get(`http://localhost:5000/api/get-vehicles/${userId}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.status === "success") {
            setVehiclesForSelectedUser(res.data.vehicles);
          } else {
            setModalMessage(
              `Error fetching vehicles: ${res.data.message || "Unknown error"}`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicles for user:", err);
          setModalMessage(
            `Error fetching vehicles: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }
  };
  const handleVehicleChangeForVehicleStatus = (e) => {
    // Renamed for clarity
    const vehicleId = Number(e.target.value);
    const vehicle = vehiclesForSelectedUser.find(
      (v) => v.vehicle_id === vehicleId
    );
    setSelectedVehicle(vehicle);
    if (vehicle) {
      setNewVehicleStatus(vehicle.vehicle_status || "OffLot");
    }
  };

  // View Photos Handlers
  const handleUserForPhotosChange = (e) => {
    const userId = e.target.value;
    setSelectedUserForPhotos(userId);
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
            setModalMessage(
              `Error fetching vehicles for photos: ${
                res.data.message || "Unknown error"
              }`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicles for photos:", err);
          setModalMessage(
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
      setModalMessage("Loading photos..."); // Indicate loading
      axios
        .get(`http://localhost:5000/api/get-vehicle-photos/${vehicleId}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.status === "success") {
            setVehiclePhotos(res.data.photos);
            setModalMessage(""); // Clear loading message
          } else {
            setModalMessage(
              `Error fetching photos: ${res.data.message || "Unknown error"}`
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching vehicle photos:", err);
          setModalMessage(
            `Error fetching photos: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }
  };

  // --- Bulk SMS Handlers (Send Bulk SMS Modal) ---
  const handleSmsUserSelectToAdd = (e) => {
    const userId = parseInt(e.target.value, 10);
    if (userId && !smsRecipients.includes(userId)) {
      setSmsRecipients((prev) => [...prev, userId]);
    }
    // Optional: setSmsSearchQuery(""); // Clear search after adding
  };
  const handleRemoveSmsRecipient = (userIdToRemove) => {
    setSmsRecipients((prev) => prev.filter((id) => id !== userIdToRemove));
  };
  const handleSendSmsSubmit = async (e) => {
    // Send Bulk SMS handler
    e.preventDefault();

    if (smsRecipients.length === 0) {
      setModalMessage("Please select at least one recipient.");
      return;
    }
    if (!smsMessage.trim()) {
      setModalMessage("Please enter a message to send.");
      return;
    }

    setModalMessage("Sending messages..."); // Indicate processing

    const successes = [];
    const failures = [];
    const finalMessage = `From Express Auto: ${smsMessage} Reply STOP to stop receiving texts.`;

    const sendPromises = smsRecipients.map(async (userId) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user || !user.phone) {
        return {
          status: "failed",
          reason: "Missing phone",
          name: user?.full_name || `User ID ${userId}`,
        };
      }
      try {
        await axios.post(
          "http://localhost:5000/api/send-sms",
          { to: user.phone, message: finalMessage },
          { withCredentials: true }
        );
        return { status: "fulfilled", value: user.full_name || user.email };
      } catch (err) {
        console.error(`Failed to send SMS to ${user.phone}:`, err);
        return {
          status: "failed",
          reason: err.response?.data?.error || err.message || "API error",
          name: user.full_name || user.email,
        };
      }
    });

    const results = await Promise.allSettled(sendPromises);

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value?.status !== "failed") {
        successes.push(result.value.value);
      } else {
        const failureData =
          result.status === "rejected" ? result.reason : result.value;
        failures.push({
          name: failureData?.name || "Unknown User",
          reason: failureData?.reason || "Unknown processing error",
        });
      }
    });

    // Construct feedback message using modalMessage
    let feedback = "";
    if (successes.length > 0) {
      feedback += `Successfully sent SMS to ${
        successes.length
      }: ${successes.join(", ")}. `;
    }
    if (failures.length > 0) {
      feedback += `Failed to send SMS to ${failures.length}: ${failures
        .map((f) => `${f.name} (${f.reason})`)
        .join(", ")}.`;
    }
    setModalMessage(feedback.trim() || "SMS processing complete.");

    if (failures.length === 0 && successes.length > 0) {
      setMessage(feedback.trim()); // Set general message on success before close
      closeModal();
    }
  };
  // --- END Bulk SMS Handlers ---

  // --- START: Handlers for Unpaid Invoices Modal ---

  const handleInvoiceCheckboxChange = (invoiceId) => {
    setSelectedInvoiceIds((prevSelected) => {
      const newSelected = new Set(prevSelected); // Clone the Set
      if (newSelected.has(invoiceId)) {
        newSelected.delete(invoiceId); // Use Set's delete method
      } else {
        newSelected.add(invoiceId); // Use Set's add method
      }
      return newSelected;
    });
  };

  const handleSelectAllInvoices = (e) => {
    if (e.target.checked) {
      setSelectedInvoiceIds(
        new Set(unpaidInvoices.map((inv) => inv.invoice_id))
      ); // Create Set from IDs
    } else {
      setSelectedInvoiceIds(new Set()); // Reset to empty Set
    }
  };

  // Generic function to send reminders (SMS or Notification)
  const sendReminders = async (type) => {
    if (selectedInvoiceIds.size === 0) {
      // Check Set size
      setModalMessage("Please select at least one invoice.");
      return;
    }

    setModalMessage(`Sending ${type} reminders...`);

    // 1. Get unique user data for selected invoices
    const usersToRemind = {}; // { user_id: { phone, email, name, total_due, invoice_count } }
    let overallTotalDue = 0;

    selectedInvoiceIds.forEach((id) => {
      // Iterate over Set
      const invoice = unpaidInvoices.find((inv) => inv.invoice_id === id);
      if (invoice) {
        if (!usersToRemind[invoice.user_id]) {
          usersToRemind[invoice.user_id] = {
            phone: invoice.user_phone,
            email: invoice.user_email, // Needed for notifications potentially
            name: invoice.user_full_name,
            invoice_ids: [], // Store related invoice IDs if needed elsewhere
            invoice_count: 0,
            total_due: 0,
          };
        }
        usersToRemind[invoice.user_id].invoice_ids.push(invoice.invoice_id);
        usersToRemind[invoice.user_id].invoice_count += 1;
        usersToRemind[invoice.user_id].total_due += invoice.total_amount;
        overallTotalDue += invoice.total_amount; // Optional: Track overall total selected
      }
    });

    const userEntries = Object.entries(usersToRemind); // [ [user_id, userData], ... ]
    const reminderPromises = [];

    // 2. Prepare and execute API calls
    userEntries.forEach(([userId, userData]) => {
      // Replace placeholders in the template from state
      const finalReminderMessage = reminderMessage
        .replace(/\{name\}/g, userData.name) // Use regex global flag
        .replace(/\{total_due\}/g, userData.total_due.toFixed(2))
        .replace(/\{invoice_count\}/g, userData.invoice_count.toString());

      const finalReminderTitle = reminderTitle // Use state for title
        .replace(/\{name\}/g, userData.name); // Allow name placeholder in title too

      if (type === "SMS") {
        if (!userData.phone) {
          console.warn(
            `Skipping SMS for user ${userId} (${userData.name}): No phone number.`
          );
          reminderPromises.push(
            Promise.resolve({
              status: "skipped",
              reason: "No phone number",
              name: userData.name || `User ID ${userId}`,
            })
          );
          return; // Skip this user for SMS
        }
        const smsPayload = {
          to: userData.phone,
          // Add standard prefix/suffix to SMS
          message: `From Express Auto: ${finalReminderMessage} Reply STOP to unsubscribe.`,
        };
        reminderPromises.push(
          axios
            .post("http://localhost:5000/api/send-sms", smsPayload, {
              withCredentials: true,
            })
            .then((res) => ({
              status: "fulfilled",
              value: userData.name || `User ID ${userId}`,
            })) // Success object
            .catch((err) => ({
              // Failure object
              status: "failed",
              reason: err.response?.data?.error || err.message || "API Error",
              name: userData.name || `User ID ${userId}`,
            }))
        );
      } else if (type === "Notification") {
        const notificationPayload = {
          user_id: userId,
          title: finalReminderTitle, // Use processed title
          message: finalReminderMessage, // Use processed message
          type: "invoice_reminder", // Optional: Custom type
          // related_id: Could link to user's invoice list page? Or first invoice ID?
        };
        reminderPromises.push(
          axios
            .post(
              "http://localhost:5000/api/send-notification",
              notificationPayload,
              { withCredentials: true }
            )
            .then((res) => ({
              status: "fulfilled",
              value: userData.name || `User ID ${userId}`,
            }))
            .catch((err) => ({
              status: "failed",
              reason: err.response?.data?.message || err.message || "API Error",
              name: userData.name || `User ID ${userId}`,
            }))
        );
      }
    });

    // 3. Process results
    const results = await Promise.allSettled(reminderPromises);
    setModalMessage("Processing results..."); // Intermediate message

    const successes = [];
    const failures = [];
    const skips = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const outcome = result.value;
        if (outcome.status === "fulfilled") successes.push(outcome.value);
        else if (outcome.status === "failed")
          failures.push({ name: outcome.name, reason: outcome.reason });
        else if (outcome.status === "skipped")
          skips.push({ name: outcome.name, reason: outcome.reason });
      } else if (result.status === "rejected") {
        console.error("A reminder promise was rejected:", result.reason);
        failures.push({
          name: "Unknown User",
          reason: result.reason?.message || "Network/Request Error",
        });
      }
    });

    // 4. Construct feedback message
    let feedback = `Finished sending ${type} reminders. `;
    if (successes.length > 0)
      feedback += `Success (${successes.length}): ${successes.join(", ")}. `;
    if (failures.length > 0)
      feedback += `Failures (${failures.length}): ${failures
        .map((f) => `${f.name} (${f.reason})`)
        .join(", ")}. `;
    if (skips.length > 0)
      feedback += `Skipped (${skips.length}): ${skips
        .map((s) => `${s.name} (${s.reason})`)
        .join(", ")}. `;

    setModalMessage(feedback.trim());

    // Optional: Clear selection after sending
    if (successes.length > 0 && failures.length === 0 && skips.length === 0) {
      // Only clear on full success (no failures/skips)
      setSelectedInvoiceIds(new Set());
    }
  };
  // --- END: Handlers for Unpaid Invoices Modal ---

  // --- JSX Return ---
  return (
    <>
      <Header />
      <main className="admin-container">
        <div className="admin-box">
          <section className="admin-overview">
            <h1>Admin Panel</h1>
            <p>Manage users, vehicles, invoices, and communications.</p>
          </section>
          {/* Display general success message state */}
          {message && <div className="status-message success">{message}</div>}

          <section className="admin-actions">
            {/* Buttons */}
            <button onClick={() => openModal("addUser")}>Add User</button>
            {/* --- UPDATED Button --- */}
            <button onClick={() => openModal("unpaidInvoices")}>
              Unpaid Invoices
            </button>
            {/* --- END UPDATED Button --- */}
            <button onClick={() => openModal("addLoyaltyPoints")}>
              Add Loyalty Points
            </button>
            <button onClick={() => openModal("sendSms")}>Send Bulk SMS</button>
            <button onClick={() => openModal("active-jobs")}>
              Active Jobs
            </button>
            <button onClick={() => openModal("viewPhotos")}>View Photos</button>
            <button onClick={() => openModal("updateVehicleStatus")}>
              Update Vehicle Status
            </button>
            <button onClick={() => openModal("sendNotifications")}>
              Send Notification
            </button>
            <button onClick={() => openModal("sendInvoice")}>
              Create Invoice
            </button>
          </section>
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Send Notifications Modal (Individual) */}
      <Modal
        isOpen={activeModal === "sendNotifications"}
        onRequestClose={closeModal}
        contentLabel="Send Notification Modal"
        overlayClassName="modal-overlay"
        className="modal-content-container"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Send Individual Notification</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
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
        overlayClassName="modal-overlay"
        className="modal-content-container"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add User</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              {" "}
              <X size={20} />{" "}
            </button>
          </div>
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
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
              type="tel"
              placeholder="Phone (e.g., +15551234567)"
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
              className="modal-form-input"
            />
            <button type="submit">Add User</button>
          </form>
        </div>
      </Modal>

      {/* --- ADDED Unpaid Invoices Modal --- */}
      <Modal
        isOpen={activeModal === "unpaidInvoices"}
        onRequestClose={closeModal}
        contentLabel="Unpaid Invoices Modal"
        overlayClassName="modal-overlay"
        className="modal-content-container modal-lg" // Apply content style + large variant
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Unpaid Invoices</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Display Loading / Error / Content */}
          {modalMessage && (
            <div
              className={`status-message modal-message ${
                unpaidInvoiceError ? "error" : "info"
              }`}
            >
              {modalMessage}
            </div>
          )}

          {isLoadingUnpaidInvoices && (
            <p style={{ textAlign: "center", margin: "20px" }}>
              Loading invoices...
            </p>
          )}

          {!isLoadingUnpaidInvoices &&
            !unpaidInvoiceError &&
            unpaidInvoices.length === 0 && (
              <p style={{ textAlign: "center", margin: "20px" }}>
                No unpaid invoices found.
              </p>
            )}

          {!isLoadingUnpaidInvoices &&
            !unpaidInvoiceError &&
            unpaidInvoices.length > 0 && (
              <>
                {/* Reminder Message Customization */}
                <div className="reminder-config">
                  <h4>Reminder Settings</h4>
                  <div className="form-group">
                    <label htmlFor="reminderTitle">
                      Notification Title Template:
                    </label>
                    <input
                      type="text"
                      id="reminderTitle"
                      className="modal-form-input"
                      value={reminderTitle}
                      onChange={(e) => setReminderTitle(e.target.value)}
                      placeholder="e.g., Unpaid Invoice Reminder for {name}"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reminderMessage">
                      Reminder Message Template:
                    </label>
                    <textarea
                      id="reminderMessage"
                      className="modal-form-textarea"
                      rows="3"
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                      placeholder="e.g., Reminder: {invoice_count} invoice(s) totaling ${total_due}."
                    />
                    <small>
                      Use {"{name}"}, {"{total_due}"}, {"{invoice_count}"}{" "}
                      placeholders.
                    </small>
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="modal-actions"
                  style={{ marginTop: "15px", marginBottom: "15px" }}
                >
                  <button
                    onClick={() => sendReminders("SMS")}
                    disabled={
                      selectedInvoiceIds.size === 0 || isLoadingUnpaidInvoices
                    }
                  >
                    <MessageSquare size={16} style={{ marginRight: "5px" }} />{" "}
                    Send SMS ({selectedInvoiceIds.size})
                  </button>
                  <button
                    onClick={() => sendReminders("Notification")}
                    disabled={
                      selectedInvoiceIds.size === 0 || isLoadingUnpaidInvoices
                    }
                  >
                    <Bell size={16} style={{ marginRight: "5px" }} /> Send
                    Notification ({selectedInvoiceIds.size})
                  </button>
                </div>

                {/* Invoice Table */}
                <div className="modal-table-container">
                  <table className="modal-table unpaid-invoices-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            onChange={handleSelectAllInvoices}
                            checked={
                              selectedInvoiceIds.size ===
                                unpaidInvoices.length &&
                              unpaidInvoices.length > 0
                            }
                            disabled={
                              isLoadingUnpaidInvoices ||
                              unpaidInvoices.length === 0
                            }
                            title="Select/Deselect All"
                          />
                        </th>
                        <th>Inv #</th>
                        <th>User</th>
                        <th>Amount Due</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Phone</th> {/* Added for visibility */}
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidInvoices.map((invoice) => (
                        <tr key={invoice.invoice_id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedInvoiceIds.has(
                                invoice.invoice_id
                              )} // Use Set's has method
                              onChange={() =>
                                handleInvoiceCheckboxChange(invoice.invoice_id)
                              }
                              disabled={isLoadingUnpaidInvoices}
                            />
                          </td>
                          <td data-label="Inv #">{invoice.invoice_number}</td>
                          <td data-label="User">
                            {invoice.user_full_name}
                            <br />
                            <small>{invoice.user_email}</small>
                          </td>
                          <td data-label="Amount Due">
                            ${invoice.total_amount.toFixed(2)}
                          </td>
                          <td data-label="Due Date">
                            {invoice.due_date
                              ? new Date(invoice.due_date).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td data-label="Status">
                            <span
                              className={`status-${invoice.status.toLowerCase()}`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td data-label="Phone">
                            {invoice.user_phone || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </div>
      </Modal>
      {/* --- END ADDED Unpaid Invoices Modal --- */}

      {/* Add Loyalty Points Modal */}
      <Modal
        isOpen={activeModal === "addLoyaltyPoints"}
        onRequestClose={closeModal}
        contentLabel="Add Loyalty Points Modal"
        overlayClassName="modal-overlay"
        className="modal-content-container"
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
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
          <input
            type="text"
            className="modal-form-input"
            placeholder="Search user by name, email, or phone"
            value={loyaltySearchQuery}
            onChange={(e) => setLoyaltySearchQuery(e.target.value)}
            style={{ marginBottom: "15px" }}
          />
          <form className="modal-form" onSubmit={handleAddLoyaltyPointsSubmit}>
            <select
              value={loyaltySelectedUser}
              onChange={(e) => setLoyaltySelectedUser(e.target.value)}
              required
              className="modal-form-select"
            >
              <option value="">Select User</option>
              {filteredUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.email})
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
              min="1"
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
        overlayClassName="modal-overlay"
        className="modal-content-container"
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
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
          <form
            className="modal-form"
            onSubmit={handleUpdateVehicleStatusSubmit}
          >
            <select
              value={selectedUserForVehicleStatus}
              onChange={handleUserChangeForVehicleStatus} // Use specific handler
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
              value={selectedVehicle ? selectedVehicle.vehicle_id : ""}
              onChange={handleVehicleChangeForVehicleStatus} // Use specific handler
              required
              disabled={
                !selectedUserForVehicleStatus ||
                vehiclesForSelectedUser.length === 0
              }
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
            <select
              value={newVehicleStatus}
              onChange={(e) => setNewVehicleStatus(e.target.value)}
              required
              disabled={!selectedVehicle}
              className="modal-form-select"
            >
              <option value="Waiting">Waiting</option>
              <option value="Active">Active</option>
              <option value="OffLot">OffLot</option>
            </select>
            <button type="submit" disabled={!selectedVehicle}>
              {" "}
              Update Status{" "}
            </button>
          </form>
        </div>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={activeModal === "sendInvoice"}
        onRequestClose={closeModal}
        contentLabel="Create Invoice Modal"
        overlayClassName="modal-overlay"
        className="modal-content-container"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create Invoice</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
          <input
            type="text"
            className="modal-form-input"
            placeholder="Search user by name, email, or phone"
            value={invoiceSearchQuery}
            onChange={(e) => setInvoiceSearchQuery(e.target.value)}
            style={{ marginBottom: "15px" }}
          />
          <form className="modal-form" onSubmit={handleSendInvoiceSubmit}>
            <select
              value={invoiceSelectedUser}
              onChange={handleInvoiceUserChange} // Specific handler
              required
              className="modal-form-select"
            >
              <option value="">Select User</option>
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
              <option value="draft">Draft</option> {/* Added Draft */}
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
        overlayClassName="modal-overlay"
        className="modal-content-container modal-lg" // Use large variant
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
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
          <form className="modal-form" style={{ marginBottom: "20px" }}>
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
          <div className="photo-grid">
            {vehiclePhotos.length > 0
              ? vehiclePhotos.map((photo) => (
                  <div key={photo.media_id} className="photo-item">
                    {" "}
                    {/* Added class */}
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
                    <div className="photo-caption-container">
                      {photo.title && (
                        <span className="photo-caption">{photo.title}</span>
                      )}
                      <a
                        href={photo.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open image link"
                        className="photo-link-icon"
                      >
                        <ExternalLink size={14} strokeWidth={2.5} />
                      </a>
                    </div>
                    {/* Optional Description display */}
                    {/* {photo.description && <p className="photo-description">{photo.description}</p>} */}
                  </div>
                ))
              : selectedVehicleForPhotos &&
                !modalMessage.startsWith("Loading") && ( // Don't show "No photos" while loading
                  <p>No photos found for this vehicle.</p>
                )}
            {!selectedVehicleForPhotos && selectedUserForPhotos && (
              <p>Please select a vehicle to view photos.</p>
            )}
            {!selectedUserForPhotos && (
              <p>Please select a user and vehicle to view photos.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Send Bulk SMS Modal */}
      <Modal
        isOpen={activeModal === "sendSms"}
        onRequestClose={closeModal}
        contentLabel="Send Bulk SMS Message Modal"
        overlayClassName="modal-overlay"
        className="modal-content-container"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Send Bulk SMS Message</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
          <input
            type="text"
            placeholder="Search users by name, email, phone..."
            value={smsSearchQuery}
            onChange={(e) => setSmsSearchQuery(e.target.value)}
            className="modal-form-input"
            style={{ marginBottom: "15px" }}
          />
          <form className="modal-form" onSubmit={handleSendSmsSubmit}>
            <select
              onChange={handleSmsUserSelectToAdd}
              value=""
              className="modal-form-select"
              aria-label="Add SMS Recipient"
            >
              <option value="">-- Add Recipient --</option>
              {filteredSmsUsersForDropdown.length > 0 ? (
                filteredSmsUsersForDropdown.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.full_name} ({user.phone})
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
            <div
              className="sms-selected-recipients"
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
                    margin: "5px 0 0 0",
                  }}
                >
                  No recipients added yet.
                </p>
              ) : (
                <ul className="recipient-list">
                  {" "}
                  {/* Added class */}
                  {smsRecipients.map((userId) => {
                    const user = users.find((u) => u.user_id === userId);
                    if (!user) return <li key={userId}>Loading user...</li>;
                    return (
                      <li key={userId} className="recipient-item">
                        {" "}
                        {/* Added class */}
                        <span>
                          {user.full_name} ({user.phone})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSmsRecipient(userId)}
                          title={`Remove ${user.full_name}`}
                          className="remove-recipient-button"
                          aria-label={`Remove ${user.full_name}`}
                        >
                          &times;
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <textarea
              placeholder="Enter your message content here... 'From Express Auto:' and 'Reply STOP...' will be added automatically."
              rows="4"
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              required
              className="modal-form-textarea"
            />
            <button
              type="submit"
              disabled={smsRecipients.length === 0 || !smsMessage.trim()}
            >
              Send SMS to {smsRecipients.length} User(s)
            </button>
          </form>
        </div>
      </Modal>

      {/* Active Jobs Modal */}
      <Modal
        isOpen={activeModal === "active-jobs"}
        onRequestClose={closeModal}
        contentLabel="Active Jobs Modal"
        overlayClassName="modal-overlay"
        className="modal-content-container modal-lg" // Use large variant
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Active Jobs</h2>
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          {modalMessage && (
            <div className="status-message modal-message info">
              {modalMessage}
            </div>
          )}
          {activeJobs.length > 0 ? (
            <div className="modal-table-container">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>License Plate</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {activeJobs.map((job) => (
                    <tr key={job.vehicle_id}>
                      <td data-label="Owner">{job.owner.full_name}</td>
                      <td data-label="License">{job.license_plate}</td>
                      <td data-label="Make">{job.make}</td>
                      <td data-label="Model">{job.model}</td>
                      <td data-label="Year">{job.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: "center", margin: "20px" }}>
              No active jobs found.
            </p>
          )}
        </div>
      </Modal>

      <Footer />
    </>
  );
}

export default AdminPage;
