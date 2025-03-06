import Header from "./Header";
import Footer from "./Footer";


const BrakeService = () => {
    return (
        <>
            <Header />
            <div className="hero" 
        style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/brakechange1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
            }}>
                <h1>Brake Services</h1>
                <p>Welcome to our brake services page. .</p>
                <p>Brakes are one of the most important parts of the car.</p>
                <p>Make sure you stay safe by checking your brakes</p>
               
            </div>
            <Footer />
        </>
    );
};

export default BrakeService;