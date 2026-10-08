import React, { useEffect, useState } from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { navigateTo } from '../../../utils/navigation';
import { GiftHamperService, type GiftHamperOccasion } from '../../../services/giftHamperService';
import './GiftingHampersSection.css';

const ACCENT_PALETTE = ['#CB992C', '#2d6a4f', '#e11d48', '#c2410c', '#11223A'];
const BADGE_BG_PALETTE = ['#FFFDF0', '#e8f5e9', '#fff1f2', '#fff7ed', '#FFFDF0'];
const SCROLL_VARIANTS: Array<'fade-left' | 'fade-up' | 'fade-right'> = ['fade-left', 'fade-up', 'fade-up', 'fade-up', 'fade-right'];

export const GiftingHampersSection: React.FC = () => {
  const [occasions, setOccasions] = useState<GiftHamperOccasion[]>([]);

  useEffect(() => {
    GiftHamperService.getOccasions(true).then((data) => setOccasions(data.slice(0, 5)));
  }, []);

  const handleNavigate = (slug: string) => {
    navigateTo(`/gift-hampers?category=${slug}`);
  };

  if (occasions.length === 0) {
    return null;
  }

  return (
    <section className="hiyaghar-gifting-section" aria-label="Gifting and Hampers Section">
      {/* Background Decorative Accents */}
      <div className="hiyaghar-gifting-bg-accents" aria-hidden="true">
        <div className="hiyaghar-gifting-glow-left" />
        <div className="hiyaghar-gifting-glow-right" />
      </div>

      <div className="hiyaghar-gifting-inner-container">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <header className="hiyaghar-gifting-header">
            <span className="hiyaghar-gifting-eyebrow">FOR EVERY OCCASION</span>
            <h2 className="hiyaghar-gifting-title">Gifts That Say It Better.</h2>
            <p className="hiyaghar-gifting-subtitle">
              Thoughtful Hiya hampers made for celebrations, appreciation, and the moments worth remembering.
            </p>
          </header>
        </ScrollReveal>

        {/* Occasion Cards Grid (admin-managed) */}
        <div className="hiyaghar-gifting-cards-grid">
          {occasions.map((occasion, idx) => {
            const accentColor = ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
            const badgeBg = BADGE_BG_PALETTE[idx % BADGE_BG_PALETTE.length];
            return (
              <ScrollReveal key={occasion.id} variant={SCROLL_VARIANTS[idx % SCROLL_VARIANTS.length]} delay={idx * 100}>
                <a
                  href={`/gift-hampers?category=${occasion.slug}`}
                  className="hiyaghar-gifting-card"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(occasion.slug);
                  }}
                  aria-label={`${occasion.name} - ${occasion.description || ''}`}
                >
                  {/* Image Container (~60% height) */}
                  <div className="hiyaghar-gifting-image-wrapper">
                    <div className="hiyaghar-gifting-image-bg" style={{ backgroundColor: badgeBg }} />
                    <img
                      src={occasion.bannerImagePath || '/uploads/Noimage.png'}
                      alt={occasion.name}
                      className="hiyaghar-gifting-img"
                      loading="lazy"
                    />
                    <span className="hiyaghar-gifting-badge" style={{ color: accentColor, backgroundColor: '#ffffff' }}>
                      {occasion.products.length} Gift{occasion.products.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Content Box */}
                  <div className="hiyaghar-gifting-content">
                    <h3 className="hiyaghar-gifting-card-title">{occasion.name}</h3>
                    <p className="hiyaghar-gifting-card-desc">{occasion.description || 'Curated gift hampers for this occasion.'}</p>
                    <div className="hiyaghar-gifting-card-cta">
                      <span className="hiyaghar-gifting-cta-text" style={{ color: accentColor }}>
                        Gift Hampers →
                      </span>
                      <svg
                        className="hiyaghar-gifting-cta-arrow"
                        width="16"
                        height="12"
                        viewBox="0 0 18 14"
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="1" y1="7" x2="15" y2="7" />
                        <polyline points="10 2 15 7 10 12" />
                      </svg>
                    </div>
                  </div>
                </a>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Primary Section Action */}
        <ScrollReveal variant="fade-up" delay={400}>
          <div className="hiyaghar-gifting-main-action">
            <a
              href="/gift-hampers"
              className="hiyaghar-gifting-explore-all-btn"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/gift-hampers');
              }}
            >
              <span>Explore All Hampers</span>
              <svg
                className="hiyaghar-gifting-arrow-icon"
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
