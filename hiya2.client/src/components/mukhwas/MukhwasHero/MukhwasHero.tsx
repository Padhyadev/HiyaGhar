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
}

export const MukhwasHero: React.FC<MukhwasHeroProps> = ({
  onNavigateHome,
  title = "Premium Mukhwas",
  subtitle = "",
  description = "",
  breadcrumbCurrent = "Mukhwas",
  bgImage = "/image/mukhwas_hero_bg.webp",
}) => {
  return (
    <section className="hiyaghar-mukhwas-hero-fullwidth" aria-label={`${title} Hero Banner`}>
      <div
        className="hiyaghar-mukhwas-banner-card"
        style={{ backgroundImage: `url('${encodeURI(bgImage)}')` }}
      >
        {/* Subtle Dark Overlay */}
        <div className="hiyaghar-mukhwas-banner-overlay" />

        {/* Centered Hero Content contained in hiyaghar-container */}
        <div className="hiyaghar-container">
          <div className="hiyaghar-mukhwas-banner-content">
            {/* Breadcrumb Navigation */}
            <nav className="hiyaghar-mukhwas-banner-breadcrumb" aria-label="Breadcrumb">
              <ol className="hiyaghar-mukhwas-breadcrumb-list-centered">
                <li>
                  <a href="#/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
                    Home
                  </a>
                </li>
                <li className="sep">/</li>
                <li className="current">{breadcrumbCurrent}</li>
              </ol>
            </nav>

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
