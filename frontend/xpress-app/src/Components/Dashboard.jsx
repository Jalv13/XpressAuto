//Authors: Joshua, , , , ,
import { Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";

function Dashboard() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>
      Loading.....
    </div>
  }

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (!user) return "Guest";
    if (user.name && user.name.trim() !== "") return user.name;
    if (user.first_name) return user.first_name;
    return "Guest";  // Fallback to username part of email
  };

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <h1>Welcome, {getDisplayName()}</h1>
        <div className="dashboard-content">
          <p>This is your personal dashboard.</p>
          {/* Add dashboard content here */}
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