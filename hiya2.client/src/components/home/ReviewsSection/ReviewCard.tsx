import React from 'react';
import type { Review } from './reviewsData';

interface ReviewCardProps {
  review: Review;
  isActive?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, isActive = false }) => {
  const fullStars = Math.floor(review.rating);

  return (
    <article className={`hiyaghar-review-card ${isActive ? 'active' : ''}`}>
      {/* Top Header: Rating & Verified Badge */}
      <div className="hiyaghar-review-card-header">
        <div
          className="hiyaghar-review-stars"
          role="img"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <svg
              key={idx}
              className={`hiyaghar-star-icon ${idx < fullStars ? 'filled' : ''}`}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={idx < fullStars ? '#f59e0b' : '#e5e7eb'}
              stroke={idx < fullStars ? '#f59e0b' : '#d1d5db'}
              strokeWidth="1"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
          <span className="hiyaghar-review-rating-num">{review.rating.toFixed(1)}</span>
        </div>

        {review.verified && (
          <div className="hiyaghar-review-verified-badge" title="Verified Purchase">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2d6a4f"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Verified</span>
          </div>
        )}
      </div>

      {/* Review Body */}
      <blockquote className="hiyaghar-review-body">
        <p className="hiyaghar-review-text">“{review.review}”</p>
      </blockquote>

      {/* Customer Info & Product Context */}
      <div className="hiyaghar-review-footer">
        <div className="hiyaghar-review-author-info">
          <div>
            <strong className="hiyaghar-review-author-name">{review.customerName}</strong>
            {review.location && <span className="hiyaghar-review-author-loc"> • {review.location}</span>}
          </div>
          {review.date && <span className="hiyaghar-review-date">{review.date}</span>}
        </div>

        {review.productName && (
          <div className="hiyaghar-review-product-tag">
            <span className="hiyaghar-review-product-label">Verified Purchase:</span>
            <span className="hiyaghar-review-product-name">{review.productName}</span>
          </div>
        )}
      </div>
    </article>
  );
};

