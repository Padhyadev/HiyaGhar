import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { navigateTo } from '../../../utils/navigation';
import './FeaturedStorySection.css';

const featuredStory = {
  eyebrow: 'FEATURED STORY',
  title: 'Some goodness has a story.',
  description:
    'From familiar flavours and traditional ingredients to the care behind every creation, Hiya brings a little piece of heritage into everyday life.',
  ctaLabel: 'Discover Our Story',
  ctaHref: '/our-story',
  signature: 'A little tradition. A lot of goodness.',
  image: '/image/jamunbottole_clean.webp',
  imageAlt: 'Hiya authentic traditional preparation and natural ingredients',
};

export const FeaturedStorySection: React.FC = () => {
  return (
    <section className="hiyaghar-story-section" aria-label="Featured Story Section">
      {/* Background Subtle Organic Glows */}
      <div className="hiyaghar-story-bg-accents" aria-hidden="true">
        <div className="hiyaghar-story-glow-left" />
        <div className="hiyaghar-story-glow-right" />
      </div>

      <div className="hiyaghar-story-inner-container">
        <div className="hiyaghar-story-layout-grid">
          {/* Story Image Column with Overlapping Floating Fruits */}
          <ScrollReveal variant="scale-up" delay={100} className="hiyaghar-story-image-col">
            <div className="hiyaghar-story-image-card-wrapper">
              {/* Floating Fruit Elements overlapping card edges & product image */}
              <div className="hiyaghar-story-floating-fruits" aria-hidden="true">
                <ScrollReveal variant="fade-right" delay={100} className="hiyaghar-story-float-wrap hiyaghar-story-left-1-wrap">
                  <img
                    src="/image/Aavla.webp"
                    alt=""
                    className="hiyaghar-story-floating-img hiyaghar-story-left-1"
                  />
                </ScrollReveal>

                <ScrollReveal variant="fade-right" delay={250} className="hiyaghar-story-float-wrap hiyaghar-story-left-2-wrap">
                  <img
                    src="/image/Jamun.webp"
                    alt=""
                    className="hiyaghar-story-floating-img hiyaghar-story-left-2"
                  />
                </ScrollReveal>

                <ScrollReveal variant="fade-right" delay={400} className="hiyaghar-story-float-wrap hiyaghar-story-left-3-wrap">
                  <img
                    src="/image/Mango.webp"
                    alt=""
                    className="hiyaghar-story-floating-img hiyaghar-story-left-3"
                  />
                </ScrollReveal>

                <ScrollReveal variant="fade-left" delay={200} className="hiyaghar-story-float-wrap hiyaghar-story-top-right-wrap">
                  <img
                    src="/image/Jamun.webp"
                    alt=""
                    className="hiyaghar-story-floating-img hiyaghar-story-top-right"
                  />
                </ScrollReveal>
              </div>

              <div className="hiyaghar-story-image-card">
                <img
                  src={featuredStory.image}
                  alt={featuredStory.imageAlt}
                  className="hiyaghar-story-img"
                />
                <div className="hiyaghar-story-image-badge">
                  <span className="hiyaghar-story-badge-text">Authentic Heritage</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Story Content Column */}
          <ScrollReveal variant="fade-up" delay={250} className="hiyaghar-story-content-col">
            <div className="hiyaghar-story-eyebrow-wrapper">
              <span className="hiyaghar-story-eyebrow">{featuredStory.eyebrow}</span>
            </div>

            <h2 className="hiyaghar-story-title">{featuredStory.title}</h2>

            <p className="hiyaghar-story-description">{featuredStory.description}</p>

            <div className="hiyaghar-story-action">
              <a
                href={featuredStory.ctaHref}
                className="hiyaghar-story-cta-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/our-story');
                }}
              >
                <span>{featuredStory.ctaLabel}</span>
                <svg className="hiyaghar-story-arrow" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="7" x2="15" y2="7" />
                  <polyline points="10 2 15 7 10 12" />
                </svg>
              </a>
            </div>

            {/* Emotional Signature Closing */}
            <div className="hiyaghar-story-signature-box">
              <div className="hiyaghar-story-signature-divider" aria-hidden="true" />
              <p className="hiyaghar-story-signature">{featuredStory.signature}</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

