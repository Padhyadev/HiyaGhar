import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './Hero.css';

export const Hero: React.FC = () => {
  return (
    <section className="hiyaghar-ref-hero-section" aria-label="Hero Section">
      {/* 3D Radial Spotlight Backdrop Glow */}
      <div className="hiyaghar-hero-radial-glow" aria-hidden="true" />

      {/* Organic Noise Structure Overlay */}
      <div className="hiyaghar-hero-noise-overlay" aria-hidden="true" />

      <div className="hiyaghar-container">
        <div className="hiyaghar-ref-hero-grid">
          {/* Left Column: Headlines, Rating & CTA */}
          <div className="hiyaghar-ref-hero-content">
            {/* Floating Ingredients in Text Area */}
            <img
              src="/image/Aavla.webp"
              alt=""
              className="hiyaghar-ingredient-floating hiyaghar-ing-aavla-text-bg"
            />
            <img
              src="/image/Jamun.webp"
              alt=""
              className="hiyaghar-ingredient-floating hiyaghar-ing-jamun-text-fg"
            />

            {/* Headline */}
            <ScrollReveal variant="fade-up" delay={0}>
              <h1 className="hiyaghar-ref-hero-title">
                superfood smoothies made simple
              </h1>
            </ScrollReveal>

            {/* Subtitle */}
            <ScrollReveal variant="fade-up" delay={150}>
              <p className="hiyaghar-ref-hero-subtitle">
                nutritious & delicious smoothies that blend effortlessly into your life
              </p>
            </ScrollReveal>

            {/* White Pill CTA */}
            <ScrollReveal variant="fade-up" delay={300}>
              <a
                href="#shop-smoothies"
                className="hiyaghar-btn-white-pill"
                onClick={(e) => e.preventDefault()}
              >
                shop smoothies
              </a>
            </ScrollReveal>
          </div>

          {/* Right Column: Main Products & 3D Layered Floating Ingredients */}
          <ScrollReveal variant="scale-up" delay={100} className="hiyaghar-ref-hero-visual-wrapper">
            <div className="hiyaghar-ref-hero-visual" aria-hidden="true">
              <div className="hiyaghar-products-stage">
                {/* 1. Background Layer (z-index: 1 - Behind products) */}
                <img
                  src="/image/Aavla.webp"
                  alt=""
                  className="hiyaghar-ingredient-floating hiyaghar-ing-aavla-bg"
                />
                <img
                  src="/image/Jamun.webp"
                  alt=""
                  className="hiyaghar-ingredient-floating hiyaghar-ing-jamun-bg"
                />

                {/* 2. Main Product Images Layer (z-index: 2 & 3) */}
                <img
                  src="/image/jamunbottole_clean.webp"
                  alt="Jamun Superfood Smoothie Bottle"
                  className="hiyaghar-product-img-main"
                />
                <img
                  src="/image/Aavlamukvash.webp"
                  alt="Organic Superfood Aavla Mukhwas"
                  className="hiyaghar-product-img-secondary"
                />

                {/* 3. Foreground Layer (z-index: 5 - Overlapping products naturally) */}
                <img
                  src="/image/Jamun.webp"
                  alt=""
                  className="hiyaghar-ingredient-floating hiyaghar-ing-jamun-fg"
                />
                <img
                  src="/image/Aavla.webp"
                  alt=""
                  className="hiyaghar-ingredient-floating hiyaghar-ing-aavla-fg"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
