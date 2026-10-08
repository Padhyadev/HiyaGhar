import React, { useEffect, useState } from 'react';
import { ReviewApiService, type ProductReview } from '../../services/reviewApiService';
import { CustomerAuthService } from '../../services/customerAuthService';
import { navigateTo } from '../../utils/navigation';
import './ProductReviews.css';

interface ProductReviewsProps {
  productId: number | string;
}

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 18 }) => {
  const fullStars = Math.round(rating);
  return (
    <div className="hiyaghar-pr-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <svg
          key={idx}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={idx < fullStars ? '#CB992C' : '#E5E7EB'}
          stroke={idx < fullStars ? '#CB992C' : '#D1D5DB'}
          strokeWidth="1"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
};

const StarPicker: React.FC<{ value: number; onChange: (rating: number) => void }> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="hiyaghar-pr-star-picker">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="hiyaghar-pr-star-btn"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${star} out of 5`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill={(hovered || value) >= star ? '#CB992C' : '#E5E7EB'}
            stroke={(hovered || value) >= star ? '#CB992C' : '#D1D5DB'}
            strokeWidth="1"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    const result = await ReviewApiService.getProductReviews(productId);
    setReviews(result.reviews);
    setAverageRating(result.averageRating);
    setTotalReviews(result.totalReviews);
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (rating < 1 || rating > 5) {
      setFormMessage('Please select a star rating.');
      return;
    }
    if (!reviewText.trim()) {
      setFormMessage('Please write your review before submitting.');
      return;
    }

    setSubmitting(true);
    const result = await ReviewApiService.submitReview(productId, rating, reviewText.trim());
    setSubmitting(false);

    if (result.success) {
      setRating(0);
      setReviewText('');
      setFormMessage('Thank you! Your review has been posted.');
      await loadReviews();
    } else {
      setFormMessage(result.message || 'Something went wrong. Please try again.');
    }
  };

  const isLoggedIn = CustomerAuthService.isLoggedIn();

  return (
    <div className="hiyaghar-pr-container">
      <div className="hiyaghar-pr-summary">
        <div className="hiyaghar-pr-summary-score">{averageRating.toFixed(1)}</div>
        <div className="hiyaghar-pr-summary-details">
          <StarRow rating={averageRating} />
          <span className="hiyaghar-pr-summary-count">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      <div className="hiyaghar-pr-write">
        <h4 className="hiyaghar-pr-write-title">Write a Review</h4>
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="hiyaghar-pr-form">
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              className="hiyaghar-pr-textarea"
              placeholder="Share your experience with this product..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
            {formMessage && <p className="hiyaghar-pr-form-message">{formMessage}</p>}
            <button type="submit" className="hiyaghar-pr-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="hiyaghar-pr-login-prompt">
            <p>Please log in to write a review.</p>
            <button
              type="button"
              className="hiyaghar-pr-login-btn"
              onClick={() => navigateTo('/login')}
            >
              Log In
            </button>
          </div>
        )}
      </div>

      <div className="hiyaghar-pr-list">
        {loading ? (
          <p className="hiyaghar-pr-empty">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="hiyaghar-pr-empty">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="hiyaghar-pr-card">
              <div className="hiyaghar-pr-card-header">
                <StarRow rating={review.rating} size={15} />
                <span className="hiyaghar-pr-card-date">
                  {new Date(review.createdDate).toLocaleDateString()}
                </span>
              </div>
              <p className="hiyaghar-pr-card-text">{review.reviewText}</p>
              <span className="hiyaghar-pr-card-author">{review.customerName}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
