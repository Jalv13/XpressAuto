import Header from "./Header";


const OilChange = () => {
    return (
        <>
            <Header />
            <div className="hero" 
        style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/oilchange1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
            }}>
                <h1>Oil Change Services</h1>
                <p>Welcome to our oil change services page. .</p>
                <p>We offer a variety of oil change options to keep your vehicle running smoothly.</p>
                <p>Synthethic and Regular Oil</p>
                <p>Filter Changes are available as well</p>
            </div>
        </>
    );
};

export default OilChange;