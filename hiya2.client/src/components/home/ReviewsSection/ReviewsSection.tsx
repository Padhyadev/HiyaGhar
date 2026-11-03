import React, { useState, useEffect, useRef, useCallback } from 'react';
import { reviewsData as fallbackReviewsData, type Review } from './reviewsData';
import { ReviewCard } from './ReviewCard';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './ReviewsSection.css';

export const ReviewsSection: React.FC = () => {
  const [reviewsList, setReviewsList] = useState<Review[]>(fallbackReviewsData);
  const [averageRating, setAverageRating] = useState<number>(4.9);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(fallbackReviewsData.length);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [cardsPerView, setCardsPerView] = useState<number>(3);

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  // Set when "previous" is pressed on the first review: the track first jumps (invisibly) to the
  // identical copy one set further on, then slides one step back from there.
  const pendingPrevRef = useRef<boolean>(false);
  const [isPageVisible, setIsPageVisible] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const fetchLiveReviews = async () => {
      try {
        const res = await fetch('/api/review/homepage');
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
            setReviewsList(data.reviews);
          }
          if (typeof data.averageRating === 'number' && data.averageRating > 0) {
            setAverageRating(data.averageRating);
          }
          if (typeof data.totalReviews === 'number' && data.totalReviews > 0) {
            setTotalReviewsCount(data.totalReviews);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live homepage reviews, using curated fallback.', err);
      }
    };
    fetchLiveReviews();
  }, []);

  const totalReviews = reviewsList.length;
  // Duplicate reviews for infinite seamless looping
  const extendedReviews = [...reviewsList, ...reviewsList];

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
    if (currentIndex <= 0) {
      // Going back from the first review: one smooth step, not a rewind across every card.
      pendingPrevRef.current = true;
      setIsTransitioning(false);
      setCurrentIndex(totalReviews);
      return;
    }
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [currentIndex, totalReviews]);

  // Seamless reset when the track's own slide ends past the original array length. Cards inside
  // have their own (shorter) transitions whose end events bubble up here; those are ignored, or
  // the reset would happen mid-slide and show as a jump.
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    if (currentIndex >= totalReviews) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex % totalReviews);
    }
  };

  // Re-enable smooth transitions after invisible reset (then take the pending "previous" step)
  useEffect(() => {
    if (!isTransitioning) {
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          setIsTransitioning(true);
          if (pendingPrevRef.current) {
            pendingPrevRef.current = false;
            setCurrentIndex((prev) => prev - 1);
          }
        });
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
  }, [isTransitioning]);

  // Background tabs don't finish slides, so autoplay there would run past the end of the track.
  useEffect(() => {
    const onVisibility = () => setIsPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Safety net: if a slide end was ever missed, snap back to the matching review without a jump.
  useEffect(() => {
    if (totalReviews > 0 && currentIndex > totalReviews) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex % totalReviews);
    }
  }, [currentIndex, totalReviews]);

  // Autoplay (4.5 seconds per review): paused on hover/focus, in a hidden tab, and for visitors
  // who asked for reduced motion.
  useEffect(() => {
    if (isHovered || !isPageVisible || prefersReducedMotion) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, isPageVisible, prefersReducedMotion, nextSlide]);

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
            <div className="hiyaghar-reviews-trust-summary" aria-label={`Rating summary ${averageRating.toFixed(1)} out of 5 stars based on verified customer reviews`}>
              <div className="hiyaghar-trust-stars" aria-hidden="true">
                {Array.from({ length: Math.round(averageRating) }).map((_, idx) => (
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
              <span className="hiyaghar-trust-score">{averageRating.toFixed(1)} / 5</span>
              <span className="hiyaghar-trust-divider">•</span>
              <span className="hiyaghar-trust-count">
                Based on {totalReviewsCount > 0 ? `${totalReviewsCount.toLocaleString()} verified customer reviews` : 'verified customer reviews'}
              </span>
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
                {reviewsList.map((review, idx) => (
                  <button
                    key={review.id || idx}
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
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Section Primary Action */}

      </div>
    </section>
  );
};



