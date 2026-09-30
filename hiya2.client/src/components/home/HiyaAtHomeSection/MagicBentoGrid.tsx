import React from 'react';
import { homeMomentsData } from './bentoData';
import { MagicBentoCard } from './MagicBentoCard';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';

interface MagicBentoGridProps {
  glowColor?: string;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
}

// Reveal direction matched to each card's position in the bento grid
// (left-column cards slide in from the left, right-column from the right,
// the small top card drops down, bottom-row cards rise up).
const revealVariantByGridClass: Record<string, 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right'> = {
  'bento-pos-1': 'fade-left',
  'bento-pos-2': 'fade-down',
  'bento-pos-3': 'fade-up',
  'bento-pos-4': 'fade-right',
  'bento-pos-5': 'fade-up',
  'bento-pos-6': 'fade-right',
};

export const MagicBentoGrid: React.FC<MagicBentoGridProps> = ({
  glowColor = '45, 106, 79',
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
}) => {
  return (
    <div className="magic-bento-grid-container" role="region" aria-label="Hiya at Home Lifestyle Gallery Grid">
      {homeMomentsData.map((moment, idx) => (
        <ScrollReveal
          key={moment.id}
          variant={revealVariantByGridClass[moment.gridClass] ?? 'fade-up'}
          delay={(idx % 3) * 100}
          className={moment.gridClass}
        >
          <MagicBentoCard
            item={moment}
            glowColor={glowColor}
            enableSpotlight={enableSpotlight}
            enableBorderGlow={enableBorderGlow}
            enableTilt={enableTilt}
            enableMagnetism={enableMagnetism}
          />
        </ScrollReveal>
      ))}
    </div>
  );
};
