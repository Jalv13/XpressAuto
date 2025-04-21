import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaPhone } from "react-icons/fa";
import "./cssFiles/DropDownMenu.css";
import "./cssFiles/Header.css";
import "./cssFiles/PossibleDeadCSS.css";

function Header() {
  const { user, logout } = useAuth();
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
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=ChIJA8e8LmfulIkRI7Ig6viyRoY&travelmode=driving`;
    }

    window.open(mapsUrl, "_blank");
  };

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
              className={servicesDropdownOpen ? "dropdown-active" : ""}
              onClick={toggleServicesDropdown}
            >
              Services <span className="dropdown-arrow">▾</span>
            </a>
            <div
              className={`dropdown-menu ${servicesDropdownOpen ? "show" : ""}`}
            >
              <Link
                to="/services/oil-change"
                onClick={() => setMobileMenuOpen(false)}
              >
                Oil Change
              </Link>
              <Link
                to="/services/tire-services"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tire Service
              </Link>
              <Link
                to="/services/brake-services"
                onClick={() => setMobileMenuOpen(false)}
              >
                Brake Service
              </Link>
              <Link
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
                className={profileDropdownOpen ? "dropdown-active" : ""}
                onClick={toggleProfileDropdown}
              >
                Profile <span className="dropdown-arrow">▾</span>
              </a>
              <div
                className={`dropdown-menu ${profileDropdownOpen ? "show" : ""}`}
              >
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  Edit Profile
                </Link>
                <a
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
        <button
          className="icon-button"
          aria-label="Get Directions"
          onClick={handleOpenMaps}
          title="Get Directions"
        >
          <i className="fa-solid fa-location-dot"></i>
        </button>
        {/* commented out dead search button */}
        {/* <button className="icon-button" aria-label="Search">
          <i className="fa-solid fa-search"></i>
        </button> */}

        <a href="tel:6092344566" className="phone-link">
          <button className="icon-button phone-button" aria-label="Call Us">
            <FaPhone />
          </button>
        </a>

        {user && (
          <div className="user-avatar">
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt="User Avatar"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span>
                {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
              </span>
            )}
          </div>
        )}

        <div
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
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
