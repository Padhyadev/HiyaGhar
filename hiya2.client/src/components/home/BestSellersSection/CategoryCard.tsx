import React, { useRef } from 'react';
import { navigateTo } from '../../../utils/navigation';
import { CartService, triggerFlyingProductAnimation } from '../../../cart';
import { showToast } from '../../../utils/alertService';

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
  isProduct?: boolean;
  productId?: string;
  price?: number;
  originalPrice?: number;
  weight?: string;
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
  const imageRef = useRef<HTMLImageElement>(null);
  const isProduct = category.isProduct || category.id.startsWith('product/');

  const handleClick = () => {
    onDeactivate?.();
    if (isProduct) {
      const productId = category.productId || category.id.replace('product/', '');
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prodId = category.productId || category.id.replace('product/', '');
    const weightVal = category.weight || '';
    const priceVal = category.price || 0;

    triggerFlyingProductAnimation(imageRef.current, `${prodId}-${weightVal}`);

    CartService.addItem({
      productId: prodId,
      name: category.title,
      image: category.image,
      price: priceVal,
      originalPrice: category.originalPrice,
      weight: weightVal,
      quantity: 1,
    });

    showToast(`Added ${category.title} to cart!`);
  };

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

      {/* Center Product Image Container */}
      <div className="hiyaghar-category-card-media-wrapper">
        <div className="hiyaghar-category-main-image-box">
          <img
            ref={imageRef}
            src={category.image}
            alt={category.title}
            className="hiyaghar-category-main-img"
            loading="lazy"
          />
        </div>
      </div>

      {/* Category / Product Info at Bottom */}
      <div className="hiyaghar-category-card-header">
        <h3 className="hiyaghar-category-card-title">{category.title}</h3>
        {category.tagline && (
          <p className="hiyaghar-category-card-tagline">{category.tagline}</p>
        )}
      </div>

      {/* Action Footer Indicator / Add to Cart Button */}
      <div className="hiyaghar-category-card-action">
        {isProduct ? (
          <button
            type="button"
            className="hiyaghar-category-add-cart-btn"
            onClick={handleAddToCart}
            aria-label={`Add ${category.title} to cart`}
          >
            <svg
              className="hiyaghar-cart-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Add to Cart
          </button>
        ) : (
          <span className="hiyaghar-category-explore-badge">
            Explore Category
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
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        )}
      </div>
    </article>
  );
};
