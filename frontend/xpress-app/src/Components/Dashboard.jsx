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
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (user) {
      // Fetch current loyalty points
      axios
        .get("http://localhost:5000/api/get-loyalty-points", { withCredentials: true })
        .then((res) => {
          if (res.data.status === "success") {
            setLoyaltyPoints(res.data.points);
          }
        })
        .catch((err) => console.error("Error fetching loyalty points", err));

      // Fetch notifications
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

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const getDisplayName = () => {
    if (!user) return "Guest";
    if (user.name && user.name.trim() !== "") return user.name;
    if (user.first_name) return user.first_name;
    return "Guest";
  };

  const dismissNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((n) => n.notification_id !== notificationId)
    );
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
      <div className={`dashboard-container ${theme}`}>
        <div className="theme-toggle">
          <button onClick={toggleTheme}>
            Switch to {theme === "light" ? "Dark" : "Light"} Mode
          </button>
        </div>
        <h1>Welcome, {getDisplayName()}</h1>
        <div className="dashboard-content">
          <p>This is your personal dashboard.</p>

          <div className="dashboard-stats">
            {/* Loyalty Points Section */}
            <div className="stat-box loyalty-points">
              <h3>Loyalty Points</h3>
              {loyaltyPoints ? (
                <>
                  <p>Points Balance: {loyaltyPoints.points_balance}</p>
                  <p>Total Earned: {loyaltyPoints.total_points_earned}</p>
                </>
              ) : (
                <ContentLoader speed={2} width={300} height={50} viewBox="0 0 300 50">
                  <rect x="0" y="0" rx="5" ry="5" width="300" height="50" />
                </ContentLoader>
              )}
            </div>

            {/* Notifications Section */}
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
                        <button onClick={() => dismissNotification(note.notification_id)}>
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
