import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
// Import useAuth to access user and isAdmin status
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaPhone } from "react-icons/fa";
import "./cssFiles/DropDownMenu.css";
import "./cssFiles/Header.css";

function Header() {
  // Get user and isAdmin status from the context
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
    // Also close dropdowns when navigating
    setServicesDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Close menu on ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setServicesDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const nav = document.querySelector("nav");
      const mobileToggle = document.querySelector(".mobile-menu-toggle");

      if (
        mobileMenuOpen &&
        nav &&
        !nav.contains(event.target) &&
        mobileToggle && // Check if mobileToggle exists before accessing contains
        !mobileToggle.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Check if a link is active
  const isActive = (path) => {
    // Consider making admin active if on dashboard too for admins? Optional.
    // if (isAdmin && path === '/dashboard' && location.pathname === '/admin') return true;
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Close dropdowns when toggling mobile menu
    setServicesDropdownOpen(false);
    setProfileDropdownOpen(false);
  };

  const toggleServicesDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    setServicesDropdownOpen(!servicesDropdownOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    setProfileDropdownOpen(!profileDropdownOpen);
    if (servicesDropdownOpen) setServicesDropdownOpen(false);
  };

  const handleOpenMaps = () => {
    const address = "2425 Atlantic Ave, Atlantic City, NJ 08401";
    const latitude = 39.3571342;
    const longitude = -74.4417163;

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    let mapsUrl;
    if (isIOS) {
      mapsUrl = `http://maps.apple.com/?daddr=${encodeURIComponent(
        address
      )}&ll=${latitude},${longitude}&dirflg=d`;
    } else {
      // Updated Google Maps URL for better compatibility
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        address
      )}`;
    }

    window.open(mapsUrl, "_blank");
  };

  // Determine the correct dashboard path based on admin status
  const dashboardPath = isAdmin ? "/admin" : "/dashboard";
  // Determine the text for the link
  const dashboardText = isAdmin ? "Admin Panel" : "Dashboard";

  return (
    <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="logo">
        <Link to="/">
          <img
            src="/images/New-Express-Logo.png"
            alt="Express Auto Care"
            className="logo-image"
          />
        </Link>
      </div>

      <nav className={mobileMenuOpen ? "nav-active" : ""}>
        <ul className="main-menu">
          <li>
            <Link
              to="/"
              className={isActive("/") ? "active-link" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/aboutus"
              className={isActive("/aboutus") ? "active-link" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
          </li>
          <li>
            <Link
              to="/contactform"
              className={isActive("/contactform") ? "active-link" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
          </li>
          <li className="dropdown">
            <a
              href="#"
              className={`dropdown-toggle ${
                servicesDropdownOpen ? "dropdown-active" : ""
              }`}
              onClick={toggleServicesDropdown}
              aria-haspopup="true"
              aria-expanded={servicesDropdownOpen}
            >
              Services <span className="dropdown-arrow">▾</span>
            </a>
            <div
              className={`dropdown-menu ${servicesDropdownOpen ? "show" : ""}`}
              role="menu"
            >
              <Link
                role="menuitem"
                to="/services/oil-change"
                onClick={() => setMobileMenuOpen(false)}
              >
                Oil Change
              </Link>
              <Link
                role="menuitem"
                to="/services/tire-services"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tire Service
              </Link>
              <Link
                role="menuitem"
                to="/services/brake-services"
                onClick={() => setMobileMenuOpen(false)}
              >
                Brake Service
              </Link>
              <Link
                role="menuitem"
                to="/services/diagnostics"
                onClick={() => setMobileMenuOpen(false)}
              >
                Diagnostics
              </Link>
            </div>
          </li>

          {user ? (
            <li className="dropdown">
              <a
                href="#"
                className={`dropdown-toggle ${
                  profileDropdownOpen ? "dropdown-active" : ""
                }`}
                onClick={toggleProfileDropdown}
                aria-haspopup="true"
                aria-expanded={profileDropdownOpen}
              >
                Profile <span className="dropdown-arrow">▾</span>
              </a>
              <div
                className={`dropdown-menu ${profileDropdownOpen ? "show" : ""}`}
                role="menu"
              >
                <Link
                  role="menuitem"
                  // Set the 'to' prop based on isAdmin status
                  to={dashboardPath}
                  className={isActive(dashboardPath) ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {/* Display appropriate text */}
                  {dashboardText}
                </Link>

                <Link
                  role="menuitem"
                  to="/profile"
                  className={isActive("/profile") ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Edit Profile
                </Link>
                <a
                  role="menuitem"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </a>
              </div>
            </li>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className={isActive("/login") ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className={isActive("/register") ? "active-link" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="header-actions">
        {/* <button className="icon-button" aria-label="Search">
          <i className="fa-solid fa-search"></i>
        </button> */}

        <button
          className="icon-button"
          aria-label="Get Directions"
          onClick={handleOpenMaps}
          title="Get Directions"
        >
          <i className="fa-solid fa-location-dot"></i>
        </button>

        <a href="tel:6092344566" className="phone-link">
          <button className="icon-button phone-button" aria-label="Call Us">
            <FaPhone />
          </button>
        </a>

        {user && (
          <div className="user-avatar" title={user.name || user.email}>
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt={user.name || "User Avatar"} // Add alt text
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                // Add error handling for broken image links
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loop if fallback fails
                  e.target.style.display = "none"; // Hide broken image icon
                  // Optionally display initials or a default icon here
                }}
              />
            ) : (
              // Fallback display (e.g., initials)
              <span className="avatar-initials">
                {user.name?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "U"}
              </span>
            )}
          </div>
        )}

        <div
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-menu" // Link toggle to the menu for accessibility
          aria-label="Toggle menu"
        >
          <div className={`hamburger ${mobileMenuOpen ? "active" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
