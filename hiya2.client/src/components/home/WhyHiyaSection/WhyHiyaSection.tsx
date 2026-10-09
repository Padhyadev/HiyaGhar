import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './WhyHiyaSection.css';

interface BrandValueItem {
  id: string;
  title: string;
  description: string;
  accentBg: string;
  icon: React.ReactNode;
  variant: 'fade-left' | 'fade-up' | 'fade-right';
}

const brandValues: BrandValueItem[] = [
  {
    id: 'natural-goodness',
    title: 'Natural Goodness',
    description: 'Thoughtfully selected ingredients for everyday goodness.',
    accentBg: '#FFFDF0',
    variant: 'fade-left',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    id: 'made-with-care',
    title: 'Made With Care',
    description: 'Every product is created with attention, care and intention.',
    accentBg: '#FFFDF0',
    variant: 'fade-up',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    id: 'quality-first',
    title: 'Quality First',
    description: 'We focus on quality in every product and every detail.',
    accentBg: '#FFFDF0',
    variant: 'fade-up',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: 'made-for-everyday',
    title: 'Made for Everyday',
    description: 'Simple, feel-good essentials made to fit into everyday life.',
    accentBg: '#FFFDF0',
    variant: 'fade-right',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
];

export const WhyHiyaSection: React.FC = () => {
  return (
    <section className="hiyaghar-why-section" aria-label="Why Hiya Section">
      {/* Background Decorative Botanical Accents */}
      <div className="hiyaghar-why-bg-accents" aria-hidden="true">
        <div className="hiyaghar-why-dot dot-1" />
        <div className="hiyaghar-why-dot dot-2" />
        <div className="hiyaghar-why-curve curve-left" />
        <div className="hiyaghar-why-curve curve-right" />
      </div>

      <div className="hiyaghar-why-inner-container">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="hiyaghar-why-header">
            <span className="hiyaghar-why-badge">WHY HIYA?</span>
            <h2 className="hiyaghar-why-title">Goodness you can trust.</h2>
            <p className="hiyaghar-why-subtitle">
              Thoughtfully made essentials, created with care for the little moments that make everyday life better.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Brand Values Cards Grid */}
        <div className="hiyaghar-why-cards-grid">
          {brandValues.map((value, idx) => (
            <ScrollReveal
              key={value.id}
              variant={value.variant}
              delay={idx * 100}
            >
              <div
                className="hiyaghar-why-card"
                tabIndex={0}
                role="region"
                aria-label={value.title}
              >
                <div
                  className="hiyaghar-why-icon-box"
                  style={{ backgroundColor: value.accentBg }}
                >
                  {value.icon}
                </div>

                <h3 className="hiyaghar-why-card-title">{value.title}</h3>
                <p className="hiyaghar-why-card-desc">{value.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

