import React, { useState } from 'react';
import axios from 'axios';
import Header from "./Header";
import Footer from "./Footer";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState({
    submitted: false,
    submitting: false,
    info: { error: false, msg: null }
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus(prevState => ({ ...prevState, submitting: true }));
    
    try {
      // Make a POST request to your Flask API endpoint
      await axios.post('http://127.0.0.1:5000/api/contact', formData);
      
      setStatus({
        submitted: true,
        submitting: false,
        info: { error: false, msg: 'Message sent successfully!' }
      });
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      
    } catch (error) {
      setStatus({
        submitted: false,
        submitting: false,
        info: { error: true, msg: 'An error occurred. Please try again later.' }
      });
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="contact-form-container">
      <Header/>
      <h2>Contact Us</h2>
      
      {status.info.error && (
        <div className="error-message">
          <p>{status.info.msg}</p>
        </div>
      )}
      
      {status.submitted && !status.info.error && (
        <div className="success-message">
          <p>{status.info.msg}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows="5"
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={status.submitting}
        >
          {status.submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
      <Footer/>
    </div>
  );
}

export default ContactForm;