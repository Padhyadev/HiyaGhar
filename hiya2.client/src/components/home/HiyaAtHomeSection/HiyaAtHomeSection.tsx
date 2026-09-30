import React from 'react';
import { MagicBentoGrid } from './MagicBentoGrid';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './HiyaAtHomeSection.css';

export const HiyaAtHomeSection: React.FC = () => {
  return (
    <section className="hiyaghar-athome-section" aria-label="Hiya at Home Section">
      {/* Background Decorative Accents */}
      <div className="hiyaghar-athome-bg-accents" aria-hidden="true">
        <div className="hiyaghar-athome-glow-left" />
        <div className="hiyaghar-athome-glow-right" />
      </div>

      <div className="hiyaghar-athome-inner-container">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <header className="hiyaghar-athome-header">
            <span className="hiyaghar-athome-eyebrow">HIYA AT HOME</span>
            <h2 className="hiyaghar-athome-title">Goodness, right where life happens.</h2>
            <p className="hiyaghar-athome-subtitle">
              See how our community brings a little Hiya into their everyday moments.
            </p>
          </header>
        </ScrollReveal>

        {/* MagicBento Lifestyle Gallery - each card reveals individually as it scrolls into view */}
        <MagicBentoGrid
          glowColor="203, 153, 44"
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
        />

        {/* Social / Community Action */}
        <ScrollReveal variant="fade-up" delay={300}>
          <div className="hiyaghar-athome-action">
            <a
              href="#our-story"
              className="hiyaghar-athome-share-btn"
              onClick={(e) => e.preventDefault()}
            >
              <span>Share your Hiya moment</span>
              <svg
                className="hiyaghar-athome-arrow-icon"
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

