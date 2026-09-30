import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './MukhwasCTASection.css';

interface MukhwasCTASectionProps {
  onShopNowClick: () => void;
}

export const MukhwasCTASection: React.FC<MukhwasCTASectionProps> = ({ onShopNowClick }) => {
  return (
    <section className="hiyaghar-mukhwas-cta-section" aria-label="Explore Collection CTA">
      {/* Premium background glows */}
      <div className="hiyaghar-cta-bg-glow hiyaghar-cta-glow-left" />
      <div className="hiyaghar-cta-bg-glow hiyaghar-cta-glow-right" />
      
      <div className="hiyaghar-mukhwas-cta-inner">
        <div className="hiyaghar-mukhwas-cta-card">
          <ScrollReveal variant="fade-up" className="hiyaghar-cta-content-wrapper">
            <div className="hiyaghar-cta-content">
              <span className="hiyaghar-cta-badge">Handcrafted Post-Meal Indulgence</span>
              <h2 className="hiyaghar-cta-heading">Discover Your Favourite Mukhwas</h2>
              <p className="hiyaghar-cta-subtext">
                From sweet Gulkand rose paan to fiery spiced kharek & organic jamun drops — bring home authentic Gujarati digestive taste and health in every bite.
              </p>
              <button
                type="button"
                className="hiyaghar-cta-shop-btn"
                onClick={onShopNowClick}
              >
                <span>Shop All Mukhwas</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-left" delay={200} className="hiyaghar-cta-image-wrapper">
            <div className="hiyaghar-cta-image-group">
              {/* Decorative spotlight behind images */}
              <div className="hiyaghar-cta-spotlight" />
              
              <img
                src="/image/Tadka.webp"
                alt="Mukhwas Bowl"
                className="hiyaghar-cta-img-main"
              />
              <img
                src="/image/Sahi_Kharekh.webp"
                alt="Masala Kharek"
                className="hiyaghar-cta-img-sub"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
