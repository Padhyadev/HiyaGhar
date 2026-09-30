import React from 'react';
import { navigateTo } from '../../../utils/navigation';

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: string;
  rating: string | number;
  reviewsCount: string | number;
  image: string;
  bgColor: string;
  accentColor: string;
  description?: string;
  detailsPath?: string;
  floatingIngredients: {
    src: string;
    alt: string;
    className: string;
  }[];
}

interface ProductCardProps {
  product: ProductItem;
  isActive: boolean;
  onActivate: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isActive,
  onActivate,
}) => {
  const getCategoryRoute = (categoryName: string) => {
    const catLower = categoryName.toLowerCase();
    if (catLower.includes('mukhwas')) return '/mukhwas';
    if (catLower.includes('tea')) return '/tea-masala';
    if (catLower.includes('soap')) return '/handmade-soap';
    if (catLower.includes('hair') || catLower.includes('oil')) return '/hair-oil';
    if (catLower.includes('gift') || catLower.includes('hamper')) return '/gift-hampers';
    if (catLower.includes('combo')) return '/combos';
    return '/mukhwas';
  };

  const handleCardClick = () => {
    onActivate();
    const route = getCategoryRoute(product.category);
    navigateTo(route);
  };

  return (
    <div
      className={`hiyaghar-product-card ${isActive ? 'is-active' : ''}`}
      style={{ backgroundColor: product.bgColor }}
      onClick={handleCardClick}
      onFocus={onActivate}
      tabIndex={0}
      role="article"
      aria-label={`${product.title} - ${product.price}`}
    >
      {/* Top Rating & Price Header */}
      <div className="hiyaghar-product-card-top">
        <span />
        <span className="hiyaghar-product-price-badge">{product.price}</span>
      </div>

      {/* Center Media Area & Floating Ingredients */}
      <div className="hiyaghar-product-card-media">
        <div className="hiyaghar-product-main-img-box">
          <img
            src={product.image}
            alt={product.title}
            className="hiyaghar-product-main-img"
          />
        </div>

        {/* Floating Ingredients Layer */}
        <div className="hiyaghar-floating-ingredients-container">
          {product.floatingIngredients.map((ing, idx) => (
            <img
              key={idx}
              src={ing.src}
              alt={ing.alt}
              className={`hiyaghar-floating-ingredient ${ing.className}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Product Info & Add to Cart Action */}
      <div className="hiyaghar-product-card-bottom">
        <div className="hiyaghar-product-rating">
          <span className="hiyaghar-star-icon">★</span>
          <span className="hiyaghar-rating-val">{product.rating}</span>
          <span className="hiyaghar-reviews-count">({product.reviewsCount})</span>
        </div>

        <h3 className="hiyaghar-product-card-title">{product.title}</h3>

        <button type="button" className="hiyaghar-add-to-cart-btn" onClick={(e) => e.stopPropagation()}>
          <span>Add to Cart</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
