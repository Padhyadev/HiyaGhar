import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { navigateTo } from '../../../utils/navigation';
import './GiftingHampersSection.css';

// Home page teaser for the gift builder (/gift-hampers): pick products, we choose the box,
// Normal or Personalised gifting.

const CARDS = [
  {
    icon: 'fa-solid fa-basket-shopping',
    title: 'Pick Your Products',
    desc: 'Choose any mix of our handcrafted mukhwas, tea masala, soaps and hair oil.',
    cta: 'Start building',
    accent: '#CB992C',
    bg: '#FFFDF0',
    variant: 'fade-left' as const,
  },
  {
    icon: 'fa-solid fa-gift',
    title: 'Normal Gifting',
    desc: 'We pick the right gift box for your products and pack it beautifully - at no extra charge.',
    cta: 'Free gift box',
    accent: '#2d6a4f',
    bg: '#e8f5e9',
    variant: 'fade-up' as const,
  },
  {
    icon: 'fa-solid fa-wand-magic-sparkles',
    title: 'Personalised Gifting',
    desc: 'Add your photo and a styled message, printed on an A4 card inside the box. ₹100 per box.',
    cta: 'Add a personal touch',
    accent: '#e11d48',
    bg: '#fff1f2',
    variant: 'fade-right' as const,
  },
];

export const GiftingHampersSection: React.FC = () => {
  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo('/gift-hampers');
  };

  return (
    <section className="hiyaghar-gifting-section" aria-label="Gifting">
      <div className="hiyaghar-gifting-bg-accents" aria-hidden="true">
        <div className="hiyaghar-gifting-glow-left" />
        <div className="hiyaghar-gifting-glow-right" />
      </div>

      <div className="hiyaghar-gifting-inner-container">
        <ScrollReveal variant="fade-up">
          <header className="hiyaghar-gifting-header">
            <span className="hiyaghar-gifting-eyebrow">FOR EVERY OCCASION</span>
            <h2 className="hiyaghar-gifting-title">Gifts That Say It Better.</h2>
            <p className="hiyaghar-gifting-subtitle">
              Build your own Hiya gift box for celebrations, appreciation, and the moments worth remembering.
            </p>
          </header>
        </ScrollReveal>

        <div className="hiyaghar-gifting-cards-grid is-three">
          {CARDS.map((card, idx) => (
            <ScrollReveal key={card.title} variant={card.variant} delay={idx * 100}>
              <a href="/gift-hampers" className="hiyaghar-gifting-card" onClick={open}>
                <div className="hiyaghar-gifting-image-wrapper is-icon">
                  <div className="hiyaghar-gifting-image-bg" style={{ backgroundColor: card.bg }} />
                  <i className={`${card.icon} hiyaghar-gifting-icon`} style={{ color: card.accent }} aria-hidden="true" />
                </div>
                <div className="hiyaghar-gifting-content">
                  <h3 className="hiyaghar-gifting-card-title">{card.title}</h3>
                  <p className="hiyaghar-gifting-card-desc">{card.desc}</p>
                  <div className="hiyaghar-gifting-card-cta">
                    <span className="hiyaghar-gifting-cta-text" style={{ color: card.accent }}>{card.cta}</span>
                    <svg className="hiyaghar-gifting-cta-arrow" width="16" height="12" viewBox="0 0 18 14" fill="none" stroke={card.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="1" y1="7" x2="15" y2="7" />
                      <polyline points="10 2 15 7 10 12" />
                    </svg>
                  </div>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="fade-up" delay={300}>
          <div className="hiyaghar-gifting-main-action">
            <a href="/gift-hampers" className="hiyaghar-gifting-explore-all-btn" onClick={open}>
              <span>Build Your Gift</span>
              <svg className="hiyaghar-gifting-arrow-icon" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
