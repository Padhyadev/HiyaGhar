import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { ArchImage } from '../ArchImage/ArchImage';
import './FounderSection.css';

export const FounderSection: React.FC = () => {
  return (
    <section className="hg-founder-section" aria-label="Meet the Founder">
      <div className="hg-story-container">
        <div className="hg-founder-grid">
          {/* Left Column: Arch-shaped portrait */}
          <ScrollReveal variant="fade-right" className="hg-founder-photo-col">
            <ArchImage
              alt="Priti Shah, founder of HIYA Ghar"
              width={380}
              height={480}
              loading="lazy"
              badgeText="Handmade with Love"
            />
          </ScrollReveal>

          {/* Right Column: Text & Quote */}
          <ScrollReveal variant="fade-left" className="hg-founder-content-col">
            <span className="hg-section-label">MEET THE FOUNDER</span>
            <h2 className="hg-section-heading">Hi, I&apos;m Priti Shah</h2>
            <span className="hg-founder-title">Founder, HIYA Ghar</span>

            <div className="hg-story-paragraphs">
              <p>
                Two years ago, I started HIYA Ghar with a simple dream: to celebrate traditional flavours, family memories, and the joy of that little handful of mukhwas after every meal.
              </p>
              <p>
                In our home, mukhwas was never just a mouth freshener. It was the bowl passed around after dinner, the jar we filled before festivals, the recipe my family made the same way for years. I wanted to share that feeling with other families.
              </p>
              <p>
                Today I still make every batch in my kitchen, with the same recipes, the same care and the same patience. If it isn&apos;t good enough for my own family&apos;s table, it doesn&apos;t go into a HIYA jar.
              </p>
            </div>

            <div className="hg-founder-quote-card">
              <span className="hg-quote-symbol" aria-hidden="true">&ldquo;</span>
              <blockquote className="hg-founder-quote-text">
                What began as a love for traditions is now a little happiness I share with your family.
              </blockquote>
              <cite className="hg-founder-signature">Priti Shah</cite>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
