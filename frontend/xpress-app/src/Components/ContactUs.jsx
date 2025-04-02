//Authors: Joe, Michael, , ,

import Header from "./Header";
import Footer from "./Footer";

const storeHours = [
    {
        day: "Monday",
        hours: "8:30 AM - 5:30 PM",
    },
    {
        day: "Tuesday",
        hours: "8:30 AM - 5:30 PM",
    },
    {
        day: "Wednesday",
        hours: "8:30 AM - 5:30 PM",
    },
    {
        day: "Thursday",
        hours: "8:30 AM - 5:30 PM",
    },
    {
        day: "Friday",
        hours: "8:30 AM - 5:30 PM",
    },
    {
        day: "Saturday",
        hours: "8:30 AM - 5:30 PM",
    },
    {
        day: "Sunday",
        hours: "Closed",
    },
];

const contactInfo = [
    {
        name: "Phone",
        description: "You can call us at the shop here at: (609) 348-0894. Our team is ready to assist you with any questions or to schedule your appointment.",
        image : "/images/phone.png"
    },
    {
        name: "Email",
        description: "Email us at: xpress2425@gmail.com",
        emailLink: "xpress2425@gmail.com",
        image : "/images/email.png"
    },
    {
        name: "Mailing Address",
        description: "Mail us at this address: 2425 Atlantic Ave, Atlantic City, NJ 08401",
        image : "/images/email.png"
    },
    {
        name: "Social Media Platforms",
        description: "Follow us on our social media platforms for updates and promotions.",
        image : "/images/socialMedia.png"
    },
    {
        name: "Store Hours",
        description: "Our business hours",
        image : "/images/storeicon.png",
        isHours: true // Flag to identify this as the store hours entry
    }
];

const ContactUs = () => {
    return (
        <>
        <title>Contact Us</title>
            <Header />
            
            {/* Hero Section */}
            <div 
                className="hero"
                style={{
                    position: 'relative',
                    padding: '100px 0',
                    width: '100%',
                    height: '',
                    scale: '0.8',
                    backgroundImage: 'url(/images/contact-us1.jpeg)',
                    backgroundRepeat: 'no-repeat',
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
                <h1></h1>
                <p></p>
            </div>

            {/* Contact Info Section */}
            <div style={{ padding: "40px", maxWidth: "1000px", margin: "auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Contact Us</h2>
                
                {contactInfo.map((info, index) => (
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
                                src={info.image} 
                                alt={info.name} 
                                style={{ 
                                    width: "120px", 
                                    height: "120px", 
                                    transition: "transform 0.2s ease-in-out", 
                                    cursor: "pointer" 
                                }}
                                onMouseEnter={(e) => e.target.style.transform = "translateX(-3px) rotate(-2deg)"}
                                onMouseLeave={(e) => e.target.style.transform = "translateX(0) rotate(0deg)"}
                            />
                        </div>
                        
                        {/* Text Content */}
                        <div>
                            <h3 style={{ margin: "0", color: "#333", fontSize: "20px" }}>{info.name}</h3>
                            {info.isHours ? (
                                <div style={{ color: "#555", fontSize: "15px", lineHeight: "1.8", maxWidth: "600px" }}>
                                    {storeHours.map((hour, i) => (
                                        <div key={i}>
                                            {hour.day}: {hour.hours}
                                        </div>
                                    ))}
                                </div>
                            ) : info.emailLink ? (
                                <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.8", maxWidth: "600px" }}>
                                    {info.description.split(info.emailLink)[0]}
                                    <a href={`mailto:${info.emailLink}`}>{info.emailLink}</a>
                                </p>
                            ) : (
                                <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.8", maxWidth: "600px" }}>
                                    {info.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <Footer />
        </>
    );
};

export default ContactUs;