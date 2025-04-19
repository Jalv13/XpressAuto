//Authors: Joshua, Joe, Michael, , ,
import { Link } from "react-router-dom"; // Import Link from React Router
import "./cssFiles/Effects.css"
import "./cssFiles/AdditionalServices.css"
import "./cssFiles/Frontpage.css"

function Services() {
  return (
    <section className="services">
      <h2>Our Services</h2>
      <div className="services-container">
        <Link to="/services/oil-change" className="service-link">
          <div className="service-box">Oil Change</div>
        </Link>

        <Link to="/services/tire-services" className="service-link">
          <div className="service-box">Tire Services</div>
        </Link>

        <Link to="/services/brake-services" className="service-link">
          <div className="service-box">Brake Services</div>
        </Link>

        <Link to="/services/diagnostics" className="service-link">
          <div className="service-box">Diagnostics</div>
        </Link>
      </div>

      <div className="additional-services">
        <h3>Additional Services</h3>
        <div className="additional-services-container">
          <div className="additional-service-card">
            <h4>Check-Up</h4>
            <p>
              Comprehensive vehicle check to identify potential issues before
              they become problems.
            </p>
          </div>
          <div className="additional-service-card">
            <h4>Repair</h4>
            <p>
              Expert repair services for all vehicle makes and models with
              quality parts and workmanship.
            </p>
          </div>
          <div className="additional-service-card">
            <h4>Maintenance</h4>
            <p>
              Regular maintenance services to keep your vehicle running smoothly
              and extend its lifespan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Services;
