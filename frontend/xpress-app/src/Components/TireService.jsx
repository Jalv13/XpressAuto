import Header from "./Header";
import Footer from "./Footer";


const TireService = () => {
    return (
        <>
            <Header />
            <div className="tire-service" 
        style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/tirechange1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
            }}>
                <h1>Tire Services</h1>
                
            </div>
            <Footer />
        </>
    );
};

export default TireService;