//Authors: Joshua, , , , ,


function Hero() {

  return (
    <section 
      className="hero" 
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundImage: 'url(/images/building2.JPG)',
        backgroundSize: 'cover',
        backgroundRepeat: "no-repeat",
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
      }}
    >

      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        }}
      ></div>

      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          backdropFilter: 'blur(10px)',
          padding: '20px',
          borderRadius: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Atlantic City&apos;s Most Trusted Auto Repair Shop
        </h2>
      </div>
    </section>
  );
}

export default Hero;
