import React from 'react';
import './MukhwasHero.css';

interface MukhwasHeroProps {
  onNavigateHome: () => void;
  totalProductsCount?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  breadcrumbCurrent?: string;
  bgImage?: string;
  bgPosition?: string;
}

export const MukhwasHero: React.FC<MukhwasHeroProps> = ({
  title = "Premium Mukhwas",
  subtitle = "",
  description = "",
  bgImage = "/image/mukhwas_hero_bg.webp",
  bgPosition,
}) => {
  return (
    <section className="hiyaghar-mukhwas-hero-fullwidth" aria-label={`${title} Hero Banner`}>
      <div
        className="hiyaghar-mukhwas-banner-card"
        style={{
          backgroundImage: `url('${encodeURI(bgImage)}')`,
          ...(bgPosition ? { backgroundPosition: bgPosition } : {})
        }}
      >
        {/* Centered Hero Content contained in hiyaghar-container */}
        <div className="hiyaghar-container">
          <div className="hiyaghar-mukhwas-banner-content">
            {subtitle ? (
              <span className="hiyaghar-mukhwas-banner-subtitle">
                {subtitle}
              </span>
            ) : null}

            <h1 className="hiyaghar-mukhwas-banner-title">
              {title}
            </h1>

            {description ? (
              <p className="hiyaghar-mukhwas-banner-desc">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
