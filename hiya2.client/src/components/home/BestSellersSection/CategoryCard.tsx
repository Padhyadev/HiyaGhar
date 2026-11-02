import React, { useRef, useState, useEffect } from 'react';
import { WishlistService } from '../../../services/wishlistService';
import { navigateTo } from '../../../utils/navigation';
import { CartService, triggerFlyingProductAnimation } from '../../../cart';
import { showToast } from '../../../utils/alertService';
import { productPath } from '../../../utils/productFormat';

export interface FloatingIngredient {
  src: string;
  alt: string;
  className: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  tagline?: string;
  description?: string;
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
  const prodId = category.productId || category.id.replace('product/', '');
  const weightVal = category.weight || '';

  const [isWishlisted, setIsWishlisted] = useState<boolean>(() =>
    isProduct ? WishlistService.isInWishlist(prodId, weightVal) : false
  );

  useEffect(() => {
    if (!isProduct) return;
    setIsWishlisted(WishlistService.isInWishlist(prodId, weightVal));
    const unsubscribe = WishlistService.subscribe(() => {
      setIsWishlisted(WishlistService.isInWishlist(prodId, weightVal));
    });
    return () => unsubscribe();
  }, [isProduct, prodId, weightVal]);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wishlistItem = {
      id: `${prodId}-${weightVal || 'default'}`,
      productId: prodId,
      name: category.title,
      image: category.image,
      price: calculatedPrice,
      originalPrice: calculatedOriginalPrice || category.originalPrice,
      weight: weightVal,
    };
    const newState = WishlistService.toggleWishlist(wishlistItem);
    setIsWishlisted(newState);
    if (newState) {
      showToast(`Saved ${category.title} to Wishlist!`);
    } else {
      showToast('Removed from Wishlist');
    }
  };

  const href = isProduct
    ? productPath(category.title, category.productId || category.id.replace('product/', ''))
    : category.id.replace(/^#\/?/, '/');

  const handleClick = () => {
    onDeactivate?.();
    navigateTo(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const calculatedPrice = category.price || 0;
  const rawOrig = category.originalPrice && category.originalPrice > calculatedPrice
    ? category.originalPrice
    : Math.round(calculatedPrice * 1.25);
  const calculatedOriginalPrice = rawOrig > calculatedPrice ? rawOrig : 0;
  const discountPct = calculatedOriginalPrice > calculatedPrice
    ? Math.round(((calculatedOriginalPrice - calculatedPrice) / calculatedOriginalPrice) * 100)
    : 0;

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
      originalPrice: calculatedOriginalPrice || category.originalPrice,
      weight: weightVal,
      quantity: 1,
    });

    showToast(`Added ${category.title} to cart!`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prodId = category.productId || category.id.replace('product/', '');
    const weightVal = category.weight || '';
    const priceVal = category.price || 0;

    CartService.buyNow({
      productId: prodId,
      name: category.title,
      image: category.image,
      price: priceVal,
      originalPrice: calculatedOriginalPrice || category.originalPrice,
      weight: weightVal,
      quantity: 1,
    });
  };

  return (
    <article
      className={`hiyaghar-category-card ${isProduct ? 'is-product-card' : ''} ${isActive ? 'is-active' : ''}`}
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
      {/* Wishlist Heart Button for Products */}
      {isProduct && (
        <button
          type="button"
          className={`hiyaghar-category-wishlist-btn ${isWishlisted ? 'is-active' : ''}`}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : 'currentColor'} strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}
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
        <h3 className="hiyaghar-category-card-title">
          {/* Real link so crawlers can follow it; the card's own click handler does the navigation. */}
          <a
            href={href}
            style={{ color: 'inherit', textDecoration: 'none' }}
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClick();
            }}
          >
            {category.title}
          </a>
        </h3>

        {isProduct ? (
          <>
            {category.description && (
              <p className="hiyaghar-category-card-desc">{category.description}</p>
            )}

            <div className="hiyaghar-category-price-row">
              <div className="hiyaghar-price-group">
                <span className="hiyaghar-current-price">₹{calculatedPrice}</span>
                {calculatedOriginalPrice > calculatedPrice && (
                  <span className="hiyaghar-original-price">₹{calculatedOriginalPrice}</span>
                )}
                {category.weight && (
                  <span className="hiyaghar-card-weight-tag">{category.weight}</span>
                )}
              </div>
              {discountPct > 0 && (
                <span className="hiyaghar-discount-pill">{discountPct}% OFF</span>
              )}
            </div>
          </>
        ) : (
          category.tagline && (
            <p className="hiyaghar-category-card-tagline">{category.tagline}</p>
          )
        )}
      </div>

      {/* Action Footer Indicator / Add to Cart + Buy Now Buttons */}
      <div className="hiyaghar-category-card-action">
        {isProduct ? (
          <div className="hiyaghar-category-card-actions" onClick={(e) => e.stopPropagation()}>
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
              <span>Add to Cart</span>
            </button>
            <button
              type="button"
              className="hiyaghar-category-buy-now-btn"
              onClick={handleBuyNow}
              aria-label={`Buy ${category.title} now`}
            >
              <span>Buy Now</span>
            </button>
          </div>
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
