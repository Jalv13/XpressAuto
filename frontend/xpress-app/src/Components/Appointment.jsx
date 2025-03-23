// Authors: Michael, , , , 

import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import React, { useState } from 'react';

const AppointmentScheduler = () => {
    const [appointmentData, setAppointmentData] = useState({
        name: '',
        email: '',
        date: '',
        time: '',
        reason: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAppointmentData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the data to your backend
        console.log('Appointment scheduled:', appointmentData);
        // Reset form or show confirmation
        alert('Appointment scheduled successfully!');
        setAppointmentData({
            name: '',
            email: '',
            date: '',
            time: '',
            reason: ''
        });
    };

    return (
        <>
            <title>Appointments</title>
            <Header />
            <div className="appointment-scheduler">
                <h2>Schedule an Appointment</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={appointmentData.name}
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
                            value={appointmentData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={appointmentData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="time">Time</label>
                        <input
                            type="time"
                            id="time"
                            name="time"
                            value={appointmentData.time}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reason">Reason for Appointment</label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={appointmentData.reason}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <button type="submit">Schedule Appointment</button>
                </form>
            </div>
            <Footer />
        </>
    );
};

export default AppointmentScheduler;