//Authors: Joshua, Joe, , , ,


function Hero() {
  return (
    <section 
      className="hero" 
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/Express-At-Night.jpg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        paddingBottom: '50px',
      }}
    >
    
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(8, 8, 8, 0.5)',
          zIndex: 1,
        }}
      ></div>

      
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          backdropFilter: 'blur(8px)',
          padding: '15px 20px',
          borderRadius: '10px',
          background: 'rgba(43, 43, 43, 0.6)',
          boxShadow: '0px 4px 10px rgba(133, 133, 133, 0.5)',
        }}
      >
        <h2 
          style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            margin: '0' 
          }}
        >
          Atlantic City&apos;s Most Trusted Auto Repair Shop
        </h2>
      </div>
    </section>
  );
}

export default Hero;
