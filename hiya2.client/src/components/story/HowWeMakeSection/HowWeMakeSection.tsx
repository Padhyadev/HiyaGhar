import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './HowWeMakeSection.css';

export const HowWeMakeSection: React.FC = () => {
  return (
    <section className="hg-how-section" aria-label="How We Make It">
      <div className="hg-story-container">
        <ScrollReveal variant="fade-up" className="hg-how-header">
          <span className="hg-section-label">THE HIYA WAY</span>
          <h2 className="hg-section-heading">Still made the ghar way</h2>
          <p className="hg-how-intro">
            Every jar is made the way we make it for our own family.
          </p>
        </ScrollReveal>

        {/* 3 cards in a row on desktop, one column on mobile */}
        <div className="hg-how-cards-grid">
          {/* Card 1: Family recipes */}
          <ScrollReveal variant="fade-up" delay={50} className="hg-how-card">
            <div className="hg-how-icon-wrap" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #C9982E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M6 14h6" />
              </svg>
            </div>
            <h3 className="hg-how-card-title">Family recipes</h3>
            <p className="hg-how-card-text">
              Recipes passed down at home, made the same way they always have been.
            </p>
          </ScrollReveal>

          {/* Card 2: Small batches */}
          <ScrollReveal variant="fade-up" delay={150} className="hg-how-card">
            <div className="hg-how-icon-wrap" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #C9982E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="8" width="14" height="13" rx="2" />
                <path d="M9 4h6" />
                <path d="M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>
            <h3 className="hg-how-card-title">Small batches</h3>
            <p className="hg-how-card-text">
              Made in small quantities so every jar is fresh, never mass-produced.
            </p>
          </ScrollReveal>

          {/* Card 3: Made by hand */}
          <ScrollReveal variant="fade-up" delay={250} className="hg-how-card">
            <div className="hg-how-icon-wrap" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #C9982E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
            </div>
            <h3 className="hg-how-card-title">Made by hand</h3>
            <p className="hg-how-card-text">
              Roasted, mixed and filled by hand, with care at every step.
            </p>
          </ScrollReveal>

          {/* Card 4: Honest ingredients (Kept as commented-out block per specification)
          <div className="hg-how-card">
            <div className="hg-how-icon-wrap" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #C9982E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <h3 className="hg-how-card-title">Honest ingredients</h3>
            <p className="hg-how-card-text">
              Simple ingredients you can recognise, chosen the way we would for our own home.
            </p>
          </div>
          */}
        </div>
      </div>
    </section>
  );
};
