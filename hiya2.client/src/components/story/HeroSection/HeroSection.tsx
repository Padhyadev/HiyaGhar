import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { Link } from '../../common/Link/Link';
import './HeroSection.css';

export const HeroSection: React.FC = () => {
  return (
    <section className="hg-hero-section" aria-label="Our Story Hero Banner">
      <div className="hg-hero-banner-card">
        {/* Full-width hero background banner on both desktop & mobile */}
        <div className="hg-hero-bg-container">
          <img
            src="/image/hiya_ghar_story_banner.webp"
            alt="HIYA Dil Rajan Mukhwas in a glass bottle with traditional brass bowls"
            className="hg-hero-bg-img"
            loading="eager"
            fetchPriority="high"
            width={1664}
            height={894}
          />
          <div className="hg-hero-overlay" />
        </div>

        {/* Centered Hero Content contained in inner container */}
        <div className="hg-hero-inner-container">
          <div className="hg-hero-content-wrap">
            <ScrollReveal variant="fade-up">
              

              <h1 className="hg-hero-title">
                Every Goodness Has A Heartfelt Story
              </h1>

              <p className="hg-hero-subline">
                HIYA Ghar is a small, family-run brand making mukhwas and everyday wellness products by hand, in small batches, from recipes we grew up with in Ahmedabad.
              </p>

              <div className="hg-hero-btn-wrap">
                <Link to="/mukhwas" className="hg-btn-gold">
                  <span>Shop our mukhwas</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

