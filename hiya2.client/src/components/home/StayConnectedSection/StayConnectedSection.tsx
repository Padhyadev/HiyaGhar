import React from 'react';
import { WhatsAppCard } from './WhatsAppCard';
import { NewsletterCard } from './NewsletterCard';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './StayConnectedSection.css';

export const StayConnectedSection: React.FC = () => {
  return (
    <section className="hiyaghar-stay-connected-section" aria-label="Stay Connected Section">
      {/* Subtle Background Accents */}
      <div className="hiyaghar-stay-connected-bg-accents" aria-hidden="true">
        <div className="hiyaghar-stay-connected-glow-left" />
        <div className="hiyaghar-stay-connected-glow-right" />
      </div>

      <div className="hiyaghar-stay-connected-inner-container">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <header className="hiyaghar-stay-connected-header">
            <span className="hiyaghar-stay-connected-eyebrow">STAY CONNECTED</span>
            <h2 className="hiyaghar-stay-connected-title">Stay in the Hiya Loop</h2>
            <p className="hiyaghar-stay-connected-subtitle">
              Get new launches, special offers, gifting ideas and little moments of goodness delivered to you.
            </p>
          </header>
        </ScrollReveal>

        {/* 2 Equal Retention Cards Grid */}
        <div className="hiyaghar-stay-connected-cards-grid">
          <ScrollReveal variant="fade-down" delay={100}>
            <WhatsAppCard />
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={200}>
            <NewsletterCard />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

