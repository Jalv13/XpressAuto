//Authors: Joshua, , , , ,


import { useState, useEffect } from "react";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Your Google Place ID
  const PLACE_ID = "ChIJv55qw2fuwIkReDtLLJcfUYk";

  useEffect(() => {
    // Function to fetch reviews from Google Places API via our backend
    const fetchGoogleReviews = async () => {
      try {
        setLoading(true);
        
        // Use the Flask endpoint path
        const response = await fetch(`/api/reviews`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if data has the expected structure
        if (!data.reviews || !Array.isArray(data.reviews)) {
          console.error("Unexpected API response structure:", data);
          throw new Error("API response missing reviews array");
        }
        
        // Format the reviews
        const formattedReviews = data.reviews.map(review => ({
          id: review.time,
          name: review.author_name,
          rating: review.rating,
          date: new Date(review.time * 1000).toLocaleDateString(),
          comment: review.text,

        }));
        
        setReviews(formattedReviews);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Google reviews:", err);
        setError("Failed to load reviews. Please try again later.");
        setLoading(false);
        
      }
    };

    fetchGoogleReviews();
  }, []);


  // Auto-rotate reviews
  useEffect(() => {
    if (reviews.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  // Navigate to a specific review
  const goToReview = (index) => {
    setCurrentIndex(index);
  };

  // Helper function to generate star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < rating ? "star filled" : "star"}>
          {i < rating ? "★" : "☆"}
        </span>
      );
    }
    return stars;
  };

  // Show loading state
  if (loading) {
    return (
      <section className="reviews">
        <div className="reviews-container">
          <h2>Customer Reviews</h2>
          <p className="reviews-subtitle">Loading our latest customer feedback...</p>
          <div className="loading-spinner">Loading...</div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error && reviews.length === 0) {
    return (
      <section className="reviews">
        <div className="reviews-container">
          <h2>Customer Reviews</h2>
          <p className="reviews-subtitle">We're having trouble loading our reviews</p>
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  // No reviews to display
  if (reviews.length === 0) {
    return (
      <section className="reviews">
        <div className="reviews-container">
          <h2>Customer Reviews</h2>
          <p className="reviews-subtitle">Be the first to leave us a review!</p>
          <div className="review-cta">
            <a href="#" className="review-button">
              Leave a Review
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="reviews">
      <div className="reviews-container">
        <h2>Customer Reviews</h2>
        <p className="reviews-subtitle">Don&apos;t just take our word for it</p>

        <div className="reviews-carousel">
          <div className="review-card" key={reviews[currentIndex].id}>
            <div className="review-header">
              <div className="rating">
                {renderStars(reviews[currentIndex].rating)}
              </div>
              {reviews[currentIndex].service && (
                <div className="service-tag">{reviews[currentIndex].service}</div>
              )}
            </div>
            <p className="review-comment">{reviews[currentIndex].comment}</p>
            <div className="review-footer">
              <div className="reviewer-info">
                {reviews[currentIndex].profilePhoto && (
                  <img 
                    src={reviews[currentIndex].profilePhoto} 
                    alt={`${reviews[currentIndex].name} profile`}
                    className="reviewer-photo" 
                  />
                )}
                <span className="review-name">{reviews[currentIndex].name}</span>
              </div>
              <span className="review-date">{reviews[currentIndex].date}</span>
            </div>
          </div>
        </div>

        <div className="review-dots">
          {reviews.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToReview(index)}
              aria-label={`View review ${index + 1}`}
            ></button>
          ))}
        </div>

        <div className="review-cta">
          <a 
            href={`https://search.google.com/local/writereview?placeid=${PLACE_ID}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="review-button"
          >
            Leave a Review
          </a>
          <a 
            href={`https://search.google.com/local/reviews?placeid=${PLACE_ID}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="review-button secondary"
          >
            See All Reviews
          </a>
        </div>
      </div>
    </section>
  );
}

export default Reviews;