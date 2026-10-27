import React from 'react';
import defaultFounderImage from '../../../assets/priti-shah.jpg';
import './ArchImage.css';

interface ArchImageProps {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  loading?: 'lazy' | 'eager';
  badgeText?: string;
}

export const ArchImage: React.FC<ArchImageProps> = ({
  src = defaultFounderImage,
  alt = 'Priti Shah, founder of HIYA Ghar',
  width = 360,
  height = 440,
  className = '',
  loading = 'lazy',
  badgeText,
}) => {
  const customStyles: React.CSSProperties = {
    maxWidth: typeof width === 'number' ? `${width}px` : width,
    ['--custom-frame-height' as string]: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div className={`hg-arch-image-container ${className}`} style={customStyles}>
      <div className="hg-arch-image-frame">
        <img
          src={src}
          alt={alt}
          className="hg-arch-image-img"
          loading={loading}
        />
      </div>
      <div className="hg-arch-image-halo" aria-hidden="true" />
      {badgeText && (
        <div className="hg-arch-image-badge">
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
};
