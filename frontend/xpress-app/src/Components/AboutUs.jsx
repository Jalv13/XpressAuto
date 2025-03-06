import Header from "./Header";
import Footer from "./Footer";

function AboutUs() {
   return (
       <>
           <Header />


          
           <div className="about-hero" style={{
               position: 'relative',
               width: '100%',
               maxHeight: '500px',
               overflow: 'hidden',
           }}>
              
               <div style={{
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   width: '100%',
                   height: '100%',
                   background: 'rgba(0, 0, 0, 0.5)', 
                   zIndex: 1,
               }}></div>


               <img
                   src="/images/Aboutus.jpg"
                   alt="Xpress Auto Care Garage"
                   style={{
                       width: '100%',
                       height: '100%',
                       objectFit: 'cover',
                       display: 'block',
                   }}
               />


               <div style={{
                   position: 'absolute',
                   top: '50%',
                   left: '50%',
                   transform: 'translate(-50%, -50%)',
                   color: '#fff',
                   textAlign: 'center',
                   zIndex: 2,
                   width: '80%',
               }}>
                   <h1 style={{
                       fontSize: '3rem',
                       fontWeight: 'bold',
                       textTransform: 'uppercase',
                       marginBottom: '10px',
                   }}>
                       About Xpress Auto Care
                   </h1>
                
               </div>
           </div>


           <div className="about-details-container" style={{
               display: "grid",
               gridTemplateColumns: "1fr 1fr",
               gap: "40px",
               maxWidth: "1200px",
               margin: "0 auto",
               padding: "60px 20px",
               alignItems: "center",
           }}>
               <div className="about-image" style={{
                   width: "100%",
                   borderRadius: "10px",
                   overflow: "hidden",
                   boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
               }}>
                   <img
                       src="/images/garageinside.jpg"
                       alt="Garage Inside"
                       style={{
                           width: "100%",
                           height: "100%",
                           objectFit: "cover",
                       }}
                   />
               </div>




               <div className="about-text" style={{
                   textAlign: "left",
               }}>
                   <h2 style={{
                       fontSize: "2rem",
                       color: "#222",
                       marginBottom: "15px",
                   }}>
                       Why Choose Us?
                   </h2>
                   <p style={{
                       fontSize: "1.2rem",
                       color: "#555",
                       lineHeight: "1.8",
                   }}>
                       We take pride in offering:
                   </p>
                   <ul style={{
                       listStyle: "none",
                       padding: 0,
                       fontSize: "1.2rem",
                       color: "#555",
                       lineHeight: "1.8",
                   }}>
                       <li>✔ Professional and experienced mechanics</li>
                       <li>✔ Affordable pricing with no hidden fees</li>
                       <li>✔ Customer-first approach</li>
                       <li>✔ Quick and efficient service</li>
                   </ul>
               </div>
           </div>




           <div className="about-details-container" style={{
               display: "grid",
               gridTemplateColumns: "1fr 1fr",
               gap: "40px",
               maxWidth: "1200px",
               margin: "0 auto",
               padding: "60px 20px",
               alignItems: "center",
           }}>
   
               <div className="about-text" style={{
                   textAlign: "left",
               }}>
                   <h2 style={{
                       fontSize: "2rem",
                       color: "#222",
                       marginBottom: "15px",
                   }}>
                       Our Commitment to Quality
                   </h2>
                   <p style={{
                       fontSize: "1.2rem",
                       color: "#555",
                       lineHeight: "1.8",
                   }}>
                       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras posuere lectus quis augue viverra, sed blandit eros hendrerit. Sed euismod nibh metus, vitae aliquet erat luctus eget. Nulla facilisi. Nunc vel vulputate augue, sit amet ornare nisi. Proin quis elit eros. In convallis lacus in efficitur pellentesque. Donec in mi est.
                   </p>
                   <p style={{
                       fontSize: "1.2rem",
                       color: "#555",
                       lineHeight: "1.8",
                       marginTop: "15px",
                   }}>
                       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras posuere lectus quis augue viverra, sed blandit eros hendrerit. Sed euismod nibh metus, vitae aliquet erat luctus eget. Nulla facilisi. Nunc vel vulputate augue, sit amet ornare nisi. Proin quis elit eros. In convallis lacus in efficitur pellentesque. Donec in mi est.
                   </p>
               </div>




               <div className="about-image" style={{
                   width: "100%",
                   borderRadius: "10px",
                   overflow: "hidden",
                   boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
               }}>
                   <img
                       src="/images/profilepic.jpg"
                       alt="Car Service"
                       style={{
                           width: "100%",
                           height: "100%",
                           objectFit: "cover",
                       }}
                   />
               </div>
           </div>


           <Footer />
       </>
   );
}


export default AboutUs;
