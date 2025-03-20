//Authors: Joe, , , , ,

import Header from "./Header";
import Footer from "./Footer";

const diagnosticServices = [
    {
        name: "OBD2 Check",
        description: "Quickly identify check engine light issues with our advanced OBD2 scanning system.",

    },
    {
        name: "Battery & Charging System Test",
        description: "Ensure your battery, alternator, and starter are functioning properly to prevent breakdowns.",

    },
    {
        name: "Brake Inspection",
        description: "Diagnose brake system issues, including worn pads, leaks, and ABS functionality.",

    },
    {
        name: "Engine Performance Analysis",
        description: "Comprehensive engine diagnostics to detect misfires, fuel efficiency issues, and sensor malfunctions.",

    },
];

const Diagnostic = () => {
    return (
        <>
            <Header />
            
            {/* Hero Section */}
            <div 
                className="hero"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '500px',
                    backgroundImage: 'url(/images/Diagnostic1.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '20px',
                }}
            >
                <h1>Vehicle Diagnostics</h1>
                <p>Identify and fix potential issues before they become major problems.</p>
                <p>We offer advanced diagnostic services to keep your vehicle running at peak performance.</p>
            </div>

            {/* Diagnostic Services Section */}
            <div style={{ padding: "40px", maxWidth: "1000px", margin: "auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Our Diagnostic Services</h2>
                
                {diagnosticServices.map((service, index) => (
                    <div 
                        key={index} 
                        style={{
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: "#fff",
                            borderRadius: "12px",
                            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                            padding: "30px",
                            marginBottom: "30px",
                            borderLeft: "6px solid rgba(255, 204, 0, 0.95)",
                            gap: "20px",
                        }}
                    >
                        {/* Service Icon */}
                        <div style={{
                            backgroundColor: "#f5f5f5",
                            borderRadius: "12px",
                            padding: "15px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                           <img 
                                src="/images/obd2.png" 
                                alt={service.name} 
                                style={{ width: "120px", height: "120px" }}
                            />
                        </div>
                        
                        {/* Service Details */}
                        <div>
                            <h3 style={{ margin: "0", color: "#333", fontSize: "20px" }}>{service.name}</h3>
                            <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.8", maxWidth: "600px" }}>
                                {service.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Call to Action Section */}
            <div style={{
                backgroundColor: "rgba(255, 204, 0, 0.95)",
                color: "#fff",
                textAlign: "center",
                padding: "30px 20px",
                marginTop: "40px",
            }}>
             <h2 style={{ color: "#000" }}>Schedule Your Diagnostic Check Today</h2>
    <p style={{ color: "#000" }}>Don't wait for a breakdown! Get a professional diagnostic check to keep your car in top shape.</p>
    <button 
        style={{
            backgroundColor: "#fff", 
            color: "#007BFF",
            padding: "15px 30px", 
            fontSize: "18px",
            fontWeight: "bold",
            borderRadius: "10px", 
            border: "none",
            cursor: "pointer",
            textTransform: "uppercase", 
            letterSpacing: "1px", 
            transition: "background-color 0.3s ease, transform 0.3s ease", 
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = "#f2f2f2"}
        onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
    >
        Book an Appointment
    </button>
</div>

            <Footer />
        </>
    );
};

export default Diagnostic;