import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { Link } from '../../common/Link/Link';
import { HomeCategoriesSection } from '../../home/HomeCategoriesSection/HomeCategoriesSection';
import { LOGO_URL } from '../../../utils/brand';
import './ClosingCtaSection.css';

const INSTAGRAM_URL = 'https://www.instagram.com/hiyaghar_/';

/**
 * Our Story, section 5 (client copy, 26 Oct): closing call-to-action before the footer.
 * The category cards between the text and the buttons let a reader go straight to a range.
 */
export const ClosingCtaSection: React.FC = () => {
  return (
    <section className="hg-closing-cta-section" aria-labelledby="hg-closing-cta-heading">
      <div className="hg-story-narrow-container">
        <ScrollReveal variant="fade-up">
          <div className="hg-closing-cta-inner">
            {/* The logo's navy lettering needs a light badge on this dark section */}
            <div className="hg-closing-cta-logo-badge">
              <img src={LOGO_URL} alt="HIYA Ghar" width={160} height={48} loading="lazy" className="hg-closing-cta-logo" />
            </div>

            <h2 id="hg-closing-cta-heading" className="hg-section-heading">Welcome to our ghar</h2>
            <p className="hg-closing-cta-text">
              Thank you for being part of our story. From our kitchen to your family.
            </p>
          </div>
        </ScrollReveal>
      </div>

      <div className="hg-closing-cta-categories">
        <HomeCategoriesSection embedded />
      </div>

      <div className="hg-story-narrow-container">
        <div className="hg-closing-cta-inner">
          <div className="hg-closing-cta-buttons">
            <Link to="/" className="hg-closing-cta-btn is-primary">
              <span>Explore our products</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hg-closing-cta-btn is-outline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Follow us on Instagram</span>
              <span className="hg-visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>

          <p className="hg-closing-cta-footnote">Made with love in Ahmedabad</p>
        </div>
      </div>
    </section>
  );
};
