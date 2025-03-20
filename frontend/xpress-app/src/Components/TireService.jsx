//Authors: Joe, , , , ,
import Header from "./Header";
import Footer from "./Footer";

const tireServices = [
    {
        name: "Tire Installation",
        description: "Professional tire installation services ensure a secure fit and proper balance, improving your vehicle’s performance and safety."
    },
    {
        name: "Tire Rotation",
        description: "Regular tire rotation helps extend the lifespan of your tires by ensuring even wear across all wheels."
    },
    {
        name: "Wheel Alignment",
        description: "Proper wheel alignment improves handling, fuel efficiency, and tire longevity by ensuring correct tire angles."
    },
    {
        name: "Flat Tire Repair",
        description: "Quick and reliable flat tire repair services to get you back on the road safely and efficiently."
    },
];

const TireService = () => {
    return (
        <>
            <Header />
            
            {/* Hero Section */}
            <div className="hero" 
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '500px',
                    backgroundImage: 'url(/images/tirechange1.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    textAlign: 'center',
                }}>
                <h1>Tire Services</h1>
                <p>All Major Tire Brands Available</p>
                <p>Goodyear, Michelin, Firestone, and more</p>
            </div>

            {/* Tire Services Section */}
            <div style={{ padding: "40px", maxWidth: "1000px", margin: "auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Our Tire Services</h2>
                
                {tireServices.map((service, index) => (
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
                        <div style={{
                            backgroundColor: "#f5f5f5",
                            borderRadius: "12px",
                            padding: "15px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                            <img 
                                src="/images/wheel.png" 
                                alt="Tire Service" 
                                style={{ 
                                    width: "120px", 
                                    height: "120px", 
                                    transition: "transform 0.5s linear", 
                                    cursor: "pointer" 
                                }}
                                onMouseEnter={(e) => e.target.style.transform = "rotate(360deg)"}
                                onMouseLeave={(e) => e.target.style.transform = "rotate(0deg)"}
                            />
                        </div>
                        
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
                <h2 style={{ color: "#000" }}>Schedule Your Tire Service Today</h2>
                <p style={{ color: "#000" }}>Ensure your vehicle’s safety and performance with our professional tire services.</p>
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

export default TireService;
