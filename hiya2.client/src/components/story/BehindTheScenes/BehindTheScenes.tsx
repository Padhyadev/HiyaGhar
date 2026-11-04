import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './BehindTheScenes.css';

// Numbers (1-4) of the photos found in public/image/story/bts-N.webp at build time (vite.config.ts).
declare const __STORY_BTS_IMAGES__: number[];

const PHOTOS: Record<number, { caption: string; alt: string }> = {
  1: { caption: 'Roasting', alt: 'Seeds and spices being slow-roasted in the HIYA Ghar kitchen' },
  2: { caption: 'Mixing', alt: 'Roasted ingredients being mixed by hand for a batch of mukhwas' },
  3: { caption: 'Filling jars', alt: 'Fresh mukhwas being filled into HIYA jars by hand' },
  4: { caption: 'Packing your order', alt: 'A HIYA Ghar order being packed for delivery' },
};

/**
 * Our Story: real photos from the kitchen. Add them as public/image/story/bts-1.webp … bts-4.webp
 * (4:5 portrait, 800×1000) and publish; only the photos that exist are shown, and the whole
 * section is hidden while there are none, so the live page never shows a broken image.
 */
export const BehindTheScenes: React.FC = () => {
  const available = __STORY_BTS_IMAGES__.filter((n) => PHOTOS[n]);
  if (available.length === 0) return null;

  return (
    <section className="hg-bts-section" aria-labelledby="hg-bts-heading">
      <div className="hg-story-container">
        <ScrollReveal variant="fade-up" className="hg-bts-header">
          <span className="hg-section-label">INSIDE OUR KITCHEN</span>
          <h2 id="hg-bts-heading" className="hg-section-heading">Where every jar begins</h2>
        </ScrollReveal>

        <ul className={`hg-bts-grid is-count-${available.length}`}>
          {available.map((n, i) => (
            <li key={n} className="hg-bts-item">
              <ScrollReveal variant="fade-up" delay={i * 100}>
                <figure className="hg-bts-figure">
                  <div className="hg-bts-media">
                    <img
                      src={`/image/story/bts-${n}.webp`}
                      alt={PHOTOS[n].alt}
                      width={800}
                      height={1000}
                      loading="lazy"
                      decoding="async"
                      className="hg-bts-img"
                    />
                  </div>
                  <figcaption className="hg-bts-caption">
                    <span className="hg-bts-step" aria-hidden="true">0{n}</span>
                    {PHOTOS[n].caption}
                  </figcaption>
                </figure>
              </ScrollReveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
