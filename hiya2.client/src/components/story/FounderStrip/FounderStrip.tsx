import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { ArchImage } from '../ArchImage/ArchImage';
import { Link } from '../../common/Link/Link';
import './FounderStrip.css';

export const FounderStrip: React.FC = () => {
  return (
    <section className="hg-founder-strip" aria-label="Meet the Founder">
      <div className="hg-founder-strip-container">
        <div className="hg-founder-strip-grid">
          {/* Left Column: Arch-shaped portrait */}
          <ScrollReveal variant="fade-right" className="hg-founder-strip-photo-col">
            <ArchImage
              alt="Priti Shah, founder of HIYA Ghar"
              width={380}
              height={480}
              loading="lazy"
              badgeText="Handmade in Ahmedabad"
            />
          </ScrollReveal>

          {/* Right Column: Copy, quote & button */}
          <ScrollReveal variant="fade-left" className="hg-founder-strip-content-col">
            <span className="hg-section-label">MEET THE FOUNDER</span>
            <h2 className="hg-section-heading">From our kitchen to your family table</h2>

            <p className="hg-founder-strip-body">
              Hi, I&apos;m Priti Shah. Two years ago, I started HIYA Ghar in my kitchen in Ahmedabad to celebrate traditional flavours, family memories, and the joy of that little handful of mukhwas after every meal. Every jar is still made in small batches, by hand, the way we make it for our own family.
            </p>

            <div className="hg-founder-strip-quote-box">
              <blockquote className="hg-founder-strip-quote">
                &ldquo;What began as a love for traditions is now a little happiness I share with your family.&rdquo;
              </blockquote>
              <div className="hg-founder-strip-sig">
                <span className="hg-founder-strip-name">Priti Shah, Founder</span>
              </div>
            </div>

            <div className="hg-founder-strip-btn-wrap">
              <Link to="/our-story" className="hg-btn-gold">
                <span>Read our story</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
