import React, { useState, useEffect, useRef, useCallback } from 'react';
import { reviewsData } from './reviewsData';
import { ReviewCard } from './ReviewCard';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './ReviewsSection.css';

export const ReviewsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [cardsPerView, setCardsPerView] = useState<number>(3);

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const totalReviews = reviewsData.length;
  // Duplicate reviews for infinite seamless looping
  const extendedReviews = [...reviewsData, ...reviewsData];

  // Responsive cards per view listener
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setCardsPerView(1);
      } else if (w < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev <= 0 ? totalReviews - 1 : prev - 1));
  }, [totalReviews]);

  // Seamless reset when transition ends past original array length
  const handleTransitionEnd = () => {
    if (currentIndex >= totalReviews) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex % totalReviews);
    }
  };

  // Re-enable smooth transitions after invisible reset
  useEffect(() => {
    if (!isTransitioning) {
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [isTransitioning]);

  // Always Autoplay effect (4.5 seconds per review) - Paused only on direct mouse hover
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      const minSwipeDistance = 40;

      if (diff > minSwipeDistance) {
        nextSlide();
      } else if (diff < -minSwipeDistance) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Calculate translateX shift per single card step
  const stepPercentage = 100 / cardsPerView;
  const translateX = currentIndex * stepPercentage;
  const activeDotIndex = currentIndex % totalReviews;

  return (
    <section
      className="hiyaghar-reviews-section"
      aria-label="Customer Reviews Section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Subtle Background Accents */}
      <div className="hiyaghar-reviews-bg-accents" aria-hidden="true">
        <div className="hiyaghar-reviews-glow-left" />
        <div className="hiyaghar-reviews-glow-right" />
      </div>

      <div className="hiyaghar-reviews-inner-container">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <header className="hiyaghar-reviews-header">
            <span className="hiyaghar-reviews-eyebrow">WHAT OUR CUSTOMERS SAY</span>
            <h2 className="hiyaghar-reviews-title">Loved by people who love good things.</h2>
            <p className="hiyaghar-reviews-subtitle">
              Real experiences from people who have made Hiya part of their everyday moments.
            </p>

            {/* Aggregate Trust Summary Badge */}
            <div className="hiyaghar-reviews-trust-summary" aria-label="Rating summary 4.9 out of 5 stars based on 17,000 plus customer reviews">
              <div className="hiyaghar-trust-stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg
                    key={idx}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#f59e0b"
                    stroke="#f59e0b"
                    strokeWidth="1"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="hiyaghar-trust-score">4.9 / 5</span>
              <span className="hiyaghar-trust-divider">•</span>
              <span className="hiyaghar-trust-count">Based on 17,000+ customer reviews</span>
            </div>
          </header>
        </ScrollReveal>

        {/* Reviews Carousel Wrapper */}
        <ScrollReveal variant="scale-up" delay={150}>
          <div
            className="hiyaghar-reviews-carousel-wrapper"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="Customer Reviews Carousel"
          >
            {/* Carousel Track */}
            <div className="hiyaghar-reviews-track-container">
              <div
                className="hiyaghar-reviews-track"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${translateX}%)`,
                  transition: isTransitioning ? 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                }}
              >
                {extendedReviews.map((review, index) => {
                  const isActive = (index % totalReviews) === activeDotIndex;
                  return (
                    <div key={`${review.id}-${index}`} className="hiyaghar-reviews-slide">
                      <ReviewCard review={review} isActive={isActive} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carousel Controls: Arrows + Dots */}
            <div className="hiyaghar-reviews-controls">
              <button
                type="button"
                className="hiyaghar-reviews-nav-btn prev"
                onClick={prevSlide}
                aria-label="Previous review"
                title="Previous review"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>

              {/* Pagination Dots */}
              <div className="hiyaghar-reviews-dots" role="tablist" aria-label="Review Carousel Pagination">
                {reviewsData.map((review, idx) => (
                  <button
                    key={review.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === activeDotIndex}
                    aria-label={`Go to review ${idx + 1} (${review.customerName})`}
                    className={`hiyaghar-reviews-dot ${idx === activeDotIndex ? 'active' : ''}`}
                    onClick={() => {
                      setIsTransitioning(true);
                      setCurrentIndex(idx);
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                className="hiyaghar-reviews-nav-btn next"
                onClick={nextSlide}
                aria-label="Next review"
                title="Next review"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 5" />
                </svg>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Section Primary Action */}
        <ScrollReveal variant="fade-up" delay={250}>
          <div className="hiyaghar-reviews-action">
            <a
              href="#shop-smoothies"
              className="hiyaghar-reviews-explore-btn"
              onClick={(e) => e.preventDefault()}
            >
              <span>Explore Hiya</span>
              <svg
                className="hiyaghar-reviews-arrow-icon"
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="1" y1="7" x2="15" y2="7" />
                <polyline points="10 2 15 7 10 12" />
              </svg>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};



