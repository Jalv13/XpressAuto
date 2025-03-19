import Header from "./Header";
import Footer from "./Footer";
/* import background from "../Components/images/Oilchange1demo.jpg"; */

const OilChange = () => {
    return (
        <>
            <Header />
            <div className="oil-change-services" 
        /*
        style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/oilchange2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
            }}*/>
                <h1>Oil Change Services</h1>
                <p>Welcome to our oil change services page. .</p>
                <p>We offer a variety of oil change options to keep your vehicle running smoothly.</p>
                <p>Synthethic and Regular Oil</p>
                <p>Filter Changes are available as well</p>
            </div>

        <Header/>
        <div className="oil-change-body" /* style={{backgroundImage: `url(${background})`, backgroundSize: "cover", height: "10%", color: "Black", textAlign: "left", padding: "20px"}} */>
            <h1 /*style={{ backgroundColor: 'orange', textAlign: 'center'}}*/>Oil Change Services</h1>
            <p /* style= {{ backgroundColor: 'orange'}}*/ >Welcome to our oil change services page. We offer a variety of oil change options to keep your vehicle running smoothly.</p>
            {/* Add more content and components as needed */}
        </div>

            <Footer />
        </>
    );
};

export default OilChange;