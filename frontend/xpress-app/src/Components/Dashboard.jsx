import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";

function Dashboard() {
  const { user, loading } = useAuth();
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      axios
        .get("http://localhost:5000/api/get-loyalty-points", { withCredentials: true })
        .then((res) => {
          if (res.data.status === "success") {
            setLoyaltyPoints(res.data.points);
          }
        })
        .catch((err) => console.error("Error fetching loyalty points", err));

      axios
        .get("http://localhost:5000/api/get-notifications", { withCredentials: true })
        .then((res) => {
          if (res.data.status === "success") {
            setNotifications(res.data.notifications);
          }
        })
        .catch((err) => console.error("Error fetching notifications", err));
    }
  }, [user]);

  if (loading) {
    return <div>Loading.....</div>;
  }

  const getDisplayName = () => {
    if (!user) return "Guest";
    if (user.name && user.name.trim() !== "") return user.name;
    if (user.first_name) return user.first_name;
    return "Guest";
  };

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <h1>Welcome, {getDisplayName()}</h1>
        <div className="dashboard-content">
          <p>This is your personal dashboard.</p>

          <div className="dashboard-stats">
            <div className="stat-box">
              <h3>Loyalty Points</h3>
              {loyaltyPoints ? (
                <>
                  <p>Points Balance: {loyaltyPoints.points_balance}</p>
                  <p>Total Earned: {loyaltyPoints.total_points_earned}</p>
                </>
              ) : (
                <p>Loading Loyalty Points...</p>
              )}
            </div>
            <div className="stat-box">
              <h3>Notifications</h3>
              {notifications.length > 0 ? (
                <ul>
                  {notifications.map((note) => (
                    <li key={note.notification_id}>
                      <strong>{note.title}:</strong> {note.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No notifications</p>
              )}
            </div>
          </div>
        </div>
        <div className="dashboard-links">
          <Link to="/profile" className="dashboard-link">
            View/Edit Profile
          </Link>
          <Link to="/photos" className="photos-link">
            Photos
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;