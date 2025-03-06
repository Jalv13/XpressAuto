import Header from "./Header";
import Footer from "./Footer";


const Diagnostic = () => {
    return (
        <>
            <Header />
            <div className="hero" 
        style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/Diagnostic1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
            }}>
                <h1>Diagnostic</h1>
                <p>Welcome to our diagnostic services page. .</p>
                <p>We offer a variety of diagnostic options to keep your vehicle running smoothly.</p>
                <p>Come Check what's wrong with your vehicle</p>
                <p>OBD2 Meter checks are available</p>
            </div>
            <Footer />
        </>
    );
};

export default Diagnostic;