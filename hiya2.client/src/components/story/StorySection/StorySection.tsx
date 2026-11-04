import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './StorySection.css';

// True when public/image/story/our-kitchen.webp exists at build time (vite.config.ts).
declare const __STORY_KITCHEN_IMAGE_EXISTS__: boolean;

// The arch photo: the real kitchen photo once it is added, until then the existing heritage
// kitchen photo (also used on the FAQ page), so the arch never shows a broken image.
const ARCH_PHOTO = __STORY_KITCHEN_IMAGE_EXISTS__
  ? {
      src: '/image/story/our-kitchen.webp',
      alt: 'Handmade HIYA mukhwas being prepared in our home kitchen in Ahmedabad',
      width: 800,
      height: 1000,
    }
  : {
      src: '/image/our_story_heritage_kitchen.webp',
      alt: 'Brass spice boxes, fresh mint and jars of mukhwas on a wooden table in a traditional home kitchen',
      width: 1200,
      height: 896,
    };

/**
 * Our Story, section 3 "From our ghar to yours" (client-approved copy, do not reword).
 * Left: a kitchen photo in an arch frame with a "Where it all began" badge.
 * Right: the story; the last paragraph is styled as the emotional close.
 */
export const StorySection: React.FC = () => {
  return (
    <section className="hg-ghar-section" aria-labelledby="hg-ghar-heading">
      <div className="hg-story-container">
        <div className="hg-ghar-grid">
          {/* Left: kitchen photo in the arch */}
          <ScrollReveal variant="fade-right" className="hg-ghar-visual-col">
            <div className="hg-ghar-glow" aria-hidden="true" />
            <figure className="hg-ghar-arch">
              <div className="hg-ghar-photo">
                <img
                  src={ARCH_PHOTO.src}
                  alt={ARCH_PHOTO.alt}
                  width={ARCH_PHOTO.width}
                  height={ARCH_PHOTO.height}
                  loading="lazy"
                  decoding="async"
                  className="hg-ghar-photo-img"
                />
              </div>
              <figcaption className="hg-ghar-badge">Where it all began</figcaption>
            </figure>
          </ScrollReveal>

          {/* Right: story text */}
          <ScrollReveal variant="fade-left" className="hg-ghar-text-col">
            <span className="hg-section-label">HOW IT ALL BEGAN</span>
            <h2 id="hg-ghar-heading" className="hg-section-heading hg-ghar-heading">From our ghar to yours</h2>

            <div className="hg-ghar-paragraphs">
              <p>
                HIYA Ghar started small: one kitchen in Ahmedabad, a few family recipes and jars made for friends and relatives. Word spread, the orders grew, and what began as a hobby became a brand.
              </p>
              <p>
                &ldquo;Ghar&rdquo; means home, and that is still what we are. We have grown from mukhwas into traditional tea masala, handmade soap, Ayurvedic hair oil and gift hampers, but everything is made the same way: slowly, in small batches, with honest ingredients.
              </p>
            </div>

            <p className="hg-ghar-closing">
              When you open a HIYA jar, we hope it feels like a little piece of home, the kind of thing someone made for you because they care.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
