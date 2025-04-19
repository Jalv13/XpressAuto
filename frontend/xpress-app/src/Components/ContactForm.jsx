// 1. First, install the package:
// npm install @hcaptcha/react-hcaptcha

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "./Header";
import Footer from "./Footer";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import "./cssFiles/ContactForm.css"
import {
  FaUser,
  FaEnvelope,
  FaComment,
  FaPaperPlane,
  FaSpinner,
  FaTag,
} from "react-icons/fa";
import "../index.css";

function ContactForm() {
  // Add captchaToken to your state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });
  
  // Add a ref for the hCaptcha component
  const captchaRef = useRef(null);
  
  // Add token to your state
  const [captchaToken, setCaptchaToken] = useState(null);
  
  const [status, setStatus] = useState({
    submitted: false,
    submitting: false,
    info: { error: false, msg: null },
  });

  const [validation, setValidation] = useState({
    name: true,
    email: true,
    message: true,
    captcha: true, // Add captcha validation state
  });

  // Clear success message after 5 seconds
  useEffect(() => {
    let timer;
    if (status.submitted && !status.info.error) {
      timer = setTimeout(() => {
        setStatus((prevState) => ({
          ...prevState,
          submitted: false,
          info: { ...prevState.info, msg: null },
        }));
        // Reset captcha after successful submission
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
        setCaptchaToken(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [status.submitted, status.info.error]);

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear validation errors when user types
    if (name in validation) {
      setValidation((prev) => ({
        ...prev,
        [name]: true,
      }));
    }
  };

  // Handle hCaptcha verification
  const handleVerificationSuccess = (token) => {
    setCaptchaToken(token);
    // Clear any previous captcha validation error
    setValidation((prev) => ({
      ...prev,
      captcha: true,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.website) {
      // Silently reject the submission without alerting the bot
      //console.log("Honeypot detected possible spam submission"); 
      setStatus({
        submitted: true,
        submitting: false,
        info: {
          error: false,
          msg: "Thank you! Your message has been sent successfully.",
        },
      });
      return;
    }
    // Validate form
    const nameValid = formData.name.trim() !== "";
    const emailValid = validateEmail(formData.email);
    const messageValid = formData.message.trim() !== "";
    const captchaValid = !!captchaToken; // Verify captcha token exists

    setValidation({
      name: nameValid,
      email: emailValid,
      message: messageValid,
      captcha: captchaValid,
    });

    if (!nameValid || !emailValid || !messageValid || !captchaValid) {
      return;
    }

    setStatus((prevState) => ({ ...prevState, submitting: true }));

    try {
      // Include captcha token in your form submission
      await axios.post("http://127.0.0.1:5000/api/contact", {
        ...formData,
        captchaToken: captchaToken,
      });

      setStatus({
        submitted: true,
        submitting: false,
        info: {
          error: false,
          msg: "Thank you! Your message has been sent successfully.",
        },
      });

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      
      // Reset captcha after successful submission
      setCaptchaToken(null);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    } catch (error) {
      setStatus({
        submitted: false,
        submitting: false,
        info: {
          error: true,
          msg: "There was an error sending your message. Please try again later.",
        },
      });
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="contact-page">
      <Header />

      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1>Get In Touch</h1>
          <p>We&apos;d love to hear from you!</p>
          <p>Send us a message and we'll respond as soon as possible.</p>
        </div>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          {/* Contact Info Content (unchanged) */}
          <h2>Contact Information</h2>
          <div className="info-item">
            <i className="fa-solid fa-location-dot"></i>
            <div>
              <h3>Address</h3>
              <p>2425 Atlantic Ave, Atlantic City, NJ 08401</p>
            </div>
          </div>

          <div className="info-item">
            <i className="fa-solid fa-phone"></i>
            <div>
              <h3>Phone</h3>
              <p>(609) 348-0894</p>
            </div>
          </div>

          <div className="info-item">
            <i className="fa-solid fa-envelope"></i>
            <div>
              <h3>Email</h3>
              <p>info@xpressauto.com</p>
            </div>
          </div>

          <div className="info-item">
            <i className="fa-solid fa-clock"></i>
            <div>
              <h3>Hours</h3>
              <p>Monday - Friday: 8:30 AM - 5:30 PM</p>
              <p>Saturday: 8:30 AM - 5:30 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          <div className="social-links">
            <a href="#" aria-label="Facebook">
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a href="#" aria-label="Twitter">
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a href="#" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>
        </div>

        <div className="contact-form-wrapper">
          <h2>Send us a message</h2>

          {status.info.error && (
            <div className="message error-message">
              <i className="fa-solid fa-circle-exclamation"></i>
              <p>{status.info.msg}</p>
            </div>
          )}

          {status.submitted && !status.info.error && (
            <div className="message success-message">
              <i className="fa-solid fa-circle-check"></i>
              <p>{status.info.msg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div
              className={`form-group ${!validation.name ? "has-error" : ""}`}
            >
              <label htmlFor="name">
                <FaUser /> Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
              {!validation.name && (
                <span className="error-text">Please enter your name</span>
              )}
            </div>

            <div
              className={`form-group ${!validation.email ? "has-error" : ""}`}
            >
              <label htmlFor="email">
                <FaEnvelope /> Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
              {!validation.email && (
                <span className="error-text">
                  Please enter a valid email address
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="subject">
                <FaTag /> Subject (Optional)
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this regarding?"
              />
            </div>

            <div
              className={`form-group ${!validation.message ? "has-error" : ""}`}
            >
              <label htmlFor="message">
                <FaComment /> Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please type your message here..."
                rows="5"
                required
              />
              {!validation.message && (
                <span className="error-text">Please enter your message</span>
              )}
            </div>
            <div className="website-field">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              tabIndex="-1"
              autoComplete="off"
            />
            </div>

            {/* Add hCaptcha Component */}
            <div className={`form-group ${!validation.captcha ? "has-error" : ""}`}>
              <HCaptcha
                sitekey="939e59b0-e52e-48d0-a2a2-0aa4d41a5cde" // Replace with your actual site key
                onVerify={handleVerificationSuccess}
                ref={captchaRef}
              />
              {!validation.captcha && (
                <span className="error-text">Please complete the captcha</span>
              )}
            </div>

            <button
              type="submit"
              disabled={status.submitting}
              className="submit-button"
            >
              {status.submitting ? (
                <>
                  <FaSpinner className="spinner" /> Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane /> Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="map-container">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3064.2842367164823!2d-74.44390482438062!3d39.357131125932215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c5ee162cc47c01%3A0x8644b2fa27ea2323!2s2425%20Atlantic%20Ave%2C%20Atlantic%20City%2C%20NJ%2008401!5e0!3m2!1sen!2sus!4v1712177591493!5m2!1sen!2sus"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="XpressAuto Location"
        ></iframe>
      </div>

      <Footer />
    </div>
  );
}

export default ContactForm;