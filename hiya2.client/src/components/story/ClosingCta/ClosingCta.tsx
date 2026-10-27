import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { Link } from '../../common/Link/Link';
import './ClosingCta.css';

export const ClosingCta: React.FC = () => {
  return (
    <section className="hg-cta-section" aria-label="Welcome to our Ghar">
      <div className="hg-story-narrow-container">
        <ScrollReveal variant="scale-up" className="hg-cta-box">
          {/* HIYA logo above it */}
          <div className="hg-cta-logo-wrap">
            <img
              src="/image/HIYA LOGO.webp"
              alt="HIYA Ghar Logo"
              className="hg-cta-logo-img"
              width={140}
              height={50}
              loading="lazy"
            />
          </div>

          <h2 className="hg-cta-heading">Welcome to our ghar</h2>
          <p className="hg-cta-body">
            Thank you for being part of our story. From our kitchen to your family.
          </p>

          <div className="hg-cta-buttons">
            {/* Primary button (navy fill): Explore our products */}
            <Link to="/mukhwas" className="hg-btn-navy">
              <span>Explore our products</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            {/* Secondary button (outline): Follow us on Instagram (new tab) */}
            <a
              href="https://instagram.com/hiyaghar_"
              target="_blank"
              rel="noopener noreferrer"
              className="hg-btn-outline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Follow us on Instagram</span>
            </a>
          </div>

          {/* Line under the buttons */}
          <div className="hg-cta-footer-line">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--gold, #C9982E)" stroke="var(--gold, #C9982E)" strokeWidth="1" aria-hidden="true">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span>Made with love in Ahmedabad</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
