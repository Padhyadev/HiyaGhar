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
  /** Phone-only shade behind the title, for banners whose busy or matching colours hide it:
   *  'dark' for white titles, 'light' for dark titles. */
  textShade?: 'dark' | 'light';
}

export const MukhwasHero: React.FC<MukhwasHeroProps> = ({
  title = "Premium Mukhwas",
  subtitle = "",
  description = "",
  bgImage = "/image/mukhwas_hero_bg.webp",
  bgPosition,
  textShade,
}) => {
  return (
    <section className="hiyaghar-mukhwas-hero-fullwidth" aria-label={`${title} Hero Banner`}>
      <div
        className={`hiyaghar-mukhwas-banner-card${textShade ? ` hiyaghar-mukhwas-banner-card--shade-${textShade}` : ''}`}
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
