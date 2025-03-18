import Header from "./Header";
import Footer from "./Footer";

const brakeServices = [
    {
        name: "Brake Pad Replacement",
        description: "Ensure your vehicle stops safely with high-quality brake pad replacements, reducing wear and improving braking efficiency.",
    },
    {
        name: "Brake Fluid Flush",
        description: "Remove old, contaminated brake fluid and replace it with fresh fluid to maintain optimal brake performance.",
    },
    {
        name: "Rotor Resurfacing & Replacement",
        description: "Smooth out worn rotors or replace them to ensure even braking and prevent vibrations while stopping.",
    },
    {
        name: "Brake Inspection & Diagnostics",
        description: "Comprehensive brake system checks to detect issues early and ensure safe driving conditions.",
    },
];

const BrakeService = () => {
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
                    backgroundImage: 'url(/images/brakechange1.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    textAlign: 'center',
                }}
            >
                <h1>Brake Services</h1>
                <p>Brakes are one of the most important components of your vehicle.</p>
                <p>Ensure your safety with regular brake inspections and maintenance.</p>
            </div>

            {/* Brake Service Types Section */}
            <div style={{ padding: "40px", maxWidth: "1000px", margin: "auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Our Brake Services</h2>
                
                {brakeServices.map((service, index) => (
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
                        {/* Image with Grey Background */}
                        <div style={{
                            backgroundColor: "#f5f5f5",
                            borderRadius: "12px",
                            padding: "15px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                            <img 
                                src="/images/Brake.png" 
                                alt={service.name} 
                                style={{ width: "120px", height: "120px" }}
                            />
                        </div>
                        
                        {/* Text Content */}
                        <div>
                            <h3 style={{ margin: "0", color: "#333", fontSize: "20px" }}>{service.name}</h3>
                            <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.8", maxWidth: "600px" }}>
                                {service.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Book an Appointment Section */}
            <div style={{
                backgroundColor: "rgba(255, 204, 0, 0.95)",
                color: "#fff",
                textAlign: "center",
                padding: "30px 20px",
                marginTop: "40px",
            }}>
                <h2 style={{ color: "#000" }}>Schedule Your Brake Service Today</h2>
                <p style={{ color: "#000" }}>Ensure your safety and optimal vehicle performance with professional brake services.</p>
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

export default BrakeService;
