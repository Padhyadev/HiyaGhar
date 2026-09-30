import React from 'react';
import { navigateTo } from '../../../utils/navigation';

export interface FloatingIngredient {
  src: string;
  alt: string;
  className: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  tagline?: string;
  image: string;
  bgColor: string;
  accentColor: string;
  floatingIngredients: FloatingIngredient[];
}

interface CategoryCardProps {
  category: CategoryItem;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isActive,
  onActivate,
  onDeactivate,
}) => {
  const handleClick = () => {
    onDeactivate?.();
    if (category.id.startsWith('product/')) {
      const productId = category.id.replace('product/', '');
      navigateTo(`/product/${productId}`);
    } else {
      const cleanPath = category.id.replace(/^#\/?/, '/');
      navigateTo(cleanPath);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const actionText = category.id.startsWith('product/') ? 'Explore Product' : 'Explore Category';

  return (
    <article
      className={`hiyaghar-category-card ${isActive ? 'is-active' : ''}`}
      style={{ backgroundColor: category.bgColor }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
      aria-label={`${category.title} - ${category.tagline || ''}`}
    >
      {/* Floating Ingredient Images Container */}
      <div className="hiyaghar-floating-ingredients-container" aria-hidden="true">
        {category.floatingIngredients.map((ingredient, idx) => (
          <img
            key={`${category.id}-ing-${idx}`}
            src={ingredient.src}
            alt=""
            className={`hiyaghar-floating-ingredient ${ingredient.className}`}
            loading="lazy"
          />
        ))}
      </div>

      {/* Category Header Info */}
      <div className="hiyaghar-category-card-header">
        <h3 className="hiyaghar-category-card-title">{category.title}</h3>
        {category.tagline && (
          <p className="hiyaghar-category-card-tagline">{category.tagline}</p>
        )}
      </div>

      {/* Center Product Image Container */}
      <div className="hiyaghar-category-card-media-wrapper">
        <div className="hiyaghar-category-main-image-box">
          <img
            src={category.image}
            alt={category.title}
            className="hiyaghar-category-main-img"
            loading="lazy"
          />
        </div>
      </div>

      {/* Action Footer Indicator */}
      <div className="hiyaghar-category-card-action">
        <span className="hiyaghar-category-explore-badge">
          {actionText}
          <svg
            className="hiyaghar-badge-arrow"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 5" />
          </svg>
        </span>
      </div>
    </article>
  );
};
