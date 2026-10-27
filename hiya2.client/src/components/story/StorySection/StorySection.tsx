import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './StorySection.css';

export const StorySection: React.FC = () => {
  return (
    <section className="hg-story-roots-section" aria-label="Our Story Origins">
      <div className="hg-story-narrow-container">
        <ScrollReveal variant="fade-up">
          {/* Small leaf divider (inline SVG) above the label */}
          <div className="hg-leaf-divider" aria-hidden="true">
            <span className="hg-divider-line" />
            <svg className="hg-leaf-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #C9982E)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span className="hg-divider-line" />
          </div>

          <div className="hg-story-center-header">
            <span className="hg-section-label">HOW IT ALL BEGAN</span>
            <h2 className="hg-section-heading">From our ghar to yours</h2>
          </div>

          <div className="hg-story-paragraphs hg-story-centered-text">
            <p>
              HIYA Ghar started small: one kitchen in Ahmedabad, a few family recipes and jars made for friends and relatives. Word spread, the orders grew, and what began as a hobby became a brand.
            </p>
            <p>
              &ldquo;Ghar&rdquo; means home, and that is still what we are. We have grown from mukhwas into traditional tea masala, handmade soap, Ayurvedic hair oil and gift hampers, but everything is made the same way: slowly, in small batches, with honest ingredients.
            </p>
            <p>
              When you open a HIYA jar, we hope it feels like a little piece of home, the kind of thing someone made for you because they care.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
