//Authors: Joshua, , , , ,

import { Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";

function Dashboard() {
  const { user, loading } = useAuth();
  

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <h1>Welcome, {"Tony"}</h1>
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