import Header from "./Header";
import Footer from "./Footer";


const TireService = () => {
    return (
        <>
             <Header />
            <div className="hero" 
        style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/tirechange1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
            }}>
                <h1>Tire Services</h1>
                <p>All Major Tire Brands Available</p>
                <p>GoodYear,Michellin,Firestone</p>
                
            </div>
            <Footer />
        </>
    );
};

export default TireService;