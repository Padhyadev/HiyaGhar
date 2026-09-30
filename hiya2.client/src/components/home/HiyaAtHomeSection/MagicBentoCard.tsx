import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import type { BentoItemData } from './bentoData';

interface MagicBentoCardProps {
  item: BentoItemData;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  glowColor?: string;
}

export const MagicBentoCard: React.FC<MagicBentoCardProps> = ({
  item,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  glowColor = '203, 153, 44',
}) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    if (window.innerWidth >= 768) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;

      if (enableTilt || enableMagnetism) {
        gsap.to(cardRef.current, {
          rotateX: enableTilt ? -deltaY * 3 : 0,
          rotateY: enableTilt ? deltaX * 3 : 0,
          x: enableMagnetism ? deltaX * 3 : 0,
          y: enableMagnetism ? deltaY * 3 : 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: -1000, y: -1000 });
    if (cardRef.current && window.innerWidth >= 768) {
      gsap.to(cardRef.current, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  };

  return (
    <a
      ref={cardRef}
      href={item.href || '#our-story'}
      className={`magic-bento-card ${isHovered ? 'hovered' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.preventDefault()}
      aria-label={`${item.title} - ${item.category}`}
    >
      {/* Lifestyle Photo Image Wrapper */}
      <div className="magic-bento-image-wrapper">
        <img
          src={item.image}
          alt={item.imageAlt}
          className="magic-bento-img"
          loading="lazy"
        />
        <div className="magic-bento-image-overlay" />
      </div>

      {/* Spotlight Radial Glow Following Cursor */}
      {enableSpotlight && (
        <div
          className="magic-bento-spotlight"
          style={{
            background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${glowColor}, 0.24), transparent 75%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Border Glow Effect */}
      {enableBorderGlow && (
        <div
          className="magic-bento-border-glow"
          style={{
            background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${glowColor}, 0.55), transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Card Content & Hover Info Overlay */}
      <div className="magic-bento-card-content">
        <div className="magic-bento-bottom-info">
          <span className="magic-bento-category">{item.category}</span>
          <h3 className="magic-bento-card-title">{item.title}</h3>
        </div>
      </div>
    </a>
  );
};
