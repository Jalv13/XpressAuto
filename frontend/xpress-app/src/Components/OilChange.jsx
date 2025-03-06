import Header from "./Header";
import Footer from "./Footer";
import React from "react";
import background from "../Components/images/Oilchange1demo.jpg";

const OilChange = () => {
    return (
        <>
        <Header />
        <div style={{backgroundImage: `url(${background})`, backgroundSize: "cover", height: "10%", color: "Black", textAlign: "left", padding: "20px"}}>
            <h1 style={{ backgroundColor: 'white' }}>Oil Change Services</h1>
            <p style= {{ backgroundColor: 'white'}}>Welcome to our oil change services page. We offer a variety of oil change options to keep your vehicle running smoothly.</p>
            {/* Add more content and components as needed */}
        </div>
            <Footer />
            </>
            );
        };


export default OilChange;