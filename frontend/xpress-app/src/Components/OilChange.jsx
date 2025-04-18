//Authors: Joe, Michael, , , ,

import Header from "./Header";

const oilTypes = [
    {
        name: "Full Synthetic Oil",
        description: "Full synthetic oil is engineered with high-performance additives to provide maximum protection and efficiency. It helps prevent sludge buildup, reduces engine wear, and enhances fuel efficiency. This oil is ideal for high-performance vehicles and extreme driving conditions, ensuring long-lasting engine health.",
    },
    {
        name: "Synthetic Blend Oil",
        description: "A combination of synthetic and conventional oil, offering a middle ground between cost and performance. It provides better oxidation resistance and engine protection than conventional oil, making it a great choice for drivers who need extra durability without the price of full synthetic.",
    },
    {
        name: "High Mileage Oil",
        description: "Designed specifically for vehicles with over 75,000 miles, high mileage oil contains additives that condition engine seals, reducing leaks and oil consumption. It also helps minimize wear and tear on aging engines, prolonging their lifespan and maintaining optimal performance.",
    },
    {
        name: "Conventional Oil",
        description: "A budget-friendly choice for standard vehicles and regular driving conditions. While it requires more frequent changes, it offers reliable lubrication and protection. Best suited for older vehicles or drivers who stick to normal commuting without heavy strain on the engine.",
    },
];

const OilChange = () => {
    return (
        <>
        <title>Oil Change Services</title>
            <Header />
            
            {/* Hero Section with Blur Effect */}
            <div 
                className="hero-container"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '40vh',
                    overflow: 'hidden',  // Important to contain the blur effect
                }}
            >
                {/* Background Image */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: 'url(/images/oilchange2.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                
                
                {/* Content Container */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        backdropFilter: 'blur(3px)',
                        padding: '0px 0px',
                        borderRadius: '20px',
                        background: 'rgba(35, 35, 35, 0.8)',
                        boxShadow: '0px 4px 4px rgba(133, 133, 133, 0.5)',
                        margin: 'auto',
                        top: '35%',
                        width: '40%',
                        height: '40%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        textAlign: 'center',
                        border: '2px solid rgba(255, 204, 0, 0.95)',
                    }}
                >
                    
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>
                        Oil Change Services
                    </h1>
                    
                    <p style={{ 
                        fontSize: '1 rem',
                        maxWidth: '600px',
                        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)'
                    }}>
                        We offer a variety of oil change options to keep your vehicle running smoothly.
                    </p>
                </div>
            </div>

            {/* Oil Types Section */}
            <div style={{ padding: "40px", maxWidth: "1000px", margin: "auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Types of Oil We Offer</h2>
                


                {oilTypes.map((oil, index) => (
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
                        {/* Image with Background */}
                        <div style={{
                            backgroundColor: "#f5f5f5",
                            borderRadius: "12px",
                            padding: "15px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                            <img 
                                src="/images/MotorOil.png" 
                                alt={oil.name} 
                                style={{ 
                                    width: "120px", 
                                    height: "120px", 
                                    transition: "transform 0.2s ease-in-out", 
                                    cursor: "pointer" 
                                }}
                                onMouseEnter={(e) => e.target.style.transform = "translateX(-3px) rotate(-2deg)"}
                                onMouseLeave={(e) => e.target.style.transform = "translateX(3px) rotate(0deg)"}
                            />
                        </div>
                        
                        {/* Text Content */}
                        <div>
                            <h3 style={{ margin: "0", color: "#333", fontSize: "20px" }}>{oil.name}</h3>
                            <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.8", maxWidth: "600px" }}>
                                {oil.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default OilChange;