import React, { useState, useRef, useEffect } from 'react';
import type { MukhwasProduct } from '../../../data/mukhwasData';
import { triggerFlyingProductAnimation } from '../../../cart';
import { WishlistService } from '../../../services/wishlistService';
import { AnimatedNumber } from '../../common/AnimatedNumber';
import { formatVariantLabel } from '../../../utils/productFormat';
import './MukhwasProductCard.css';

interface MukhwasProductCardProps {
  product: MukhwasProduct;
  index?: number;
  onNavigateToDetail: (productId: string) => void;
  onAddToCart: (product: MukhwasProduct, weight: string, quantity: number) => void;
  onBuyNow: (product: MukhwasProduct, weight: string) => void;
}

export const MukhwasProductCard: React.FC<MukhwasProductCardProps> = ({
  product,
  index = 0,
  onNavigateToDetail,
  onAddToCart,
  onBuyNow,
}) => {
  // A listing card just displays the default variant - it doesn't let the shopper pick one.
  const defaultVariant = (product.variants && product.variants.length > 0)
    ? (product.variants.find((v: any) => v.isDefault) || product.variants[0])
    : undefined;
  const defaultLabel = defaultVariant ? formatVariantLabel(defaultVariant.variantName) : (product.weightOptions?.[0] || '');

  const [isWishlisted, setIsWishlisted] = useState<boolean>(() =>
    WishlistService.isInWishlist(product.id, defaultLabel)
  );
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const cardImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsWishlisted(WishlistService.isInWishlist(product.id, defaultLabel));
    const unsubscribe = WishlistService.subscribe(() => {
      setIsWishlisted(WishlistService.isInWishlist(product.id, defaultLabel));
    });
    return () => unsubscribe();
  }, [product.id, defaultLabel]);

  const calculatedPrice = defaultVariant ? defaultVariant.price : product.price;
  const calculatedOriginalPrice = defaultVariant ? (defaultVariant.originalPrice || defaultVariant.price) : (product.originalPrice || product.price);
  const discountPct = product.discountPercentage || (calculatedOriginalPrice > calculatedPrice ? Math.round(((calculatedOriginalPrice - calculatedPrice) / calculatedOriginalPrice) * 100) : 0);

  const handleCardClick = () => {
    onNavigateToDetail(product.id);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wishlistItem = {
      id: `${product.id}-${defaultLabel}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      price: calculatedPrice,
      originalPrice: calculatedOriginalPrice,
      weight: defaultLabel,
    };
    const newState = WishlistService.toggleWishlist(wishlistItem);
    setIsWishlisted(newState);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, defaultLabel, 1);
    triggerFlyingProductAnimation(cardImgRef.current);
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(product, defaultLabel);
  };

  return (
    <div
      className={`hiyaghar-mukhwas-card ${index % 2 === 0 ? 'hiyaghar-tone-cream' : 'hiyaghar-tone-mint'}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      tabIndex={0}
      aria-label={`${product.name} - ₹${calculatedPrice}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      {/* Top Header Badge & Wishlist Heart */}
      <div className="hiyaghar-mukhwas-card-top-bar">
        <span />

        <button
          type="button"
          className={`hiyaghar-card-wishlist-btn ${isWishlisted ? 'is-active' : ''}`}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? '#CB992C' : 'none'} stroke={isWishlisted ? '#CB992C' : 'currentColor'} strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Main Image Area with Image Hover Swap */}
      <div className="hiyaghar-mukhwas-card-image-box">
        <img
          ref={cardImgRef}
          src={isHovered && product.secondaryImage ? product.secondaryImage : product.image}
          alt={product.name}
          className="hiyaghar-mukhwas-card-img"
          loading="lazy"
        />
        <div className="hiyaghar-mukhwas-quick-view-overlay">
          <span>View Details</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="hiyaghar-mukhwas-card-body">
        {/* Title */}
        <h3 className="hiyaghar-mukhwas-card-title">{product.name}</h3>

        {/* Short Description */}
        <p className="hiyaghar-mukhwas-card-desc">{product.shortDescription}</p>

        {/* Price & Discount Bar */}
        <div className="hiyaghar-mukhwas-card-price-row">
          <div className="hiyaghar-price-group">
            <span className="hiyaghar-current-price" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={calculatedPrice} /></span>
            {calculatedOriginalPrice > calculatedPrice && (
              <span className="hiyaghar-original-price" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={calculatedOriginalPrice} /></span>
            )}
          </div>
          {discountPct > 0 && (
            <span className="hiyaghar-discount-pill">{discountPct}% OFF</span>
          )}
        </div>

        {/* Action Buttons: Add to Cart & Buy Now */}
        <div className="hiyaghar-mukhwas-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="hiyaghar-btn-add-cart"
            onClick={handleAddToCartClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            className="hiyaghar-btn-buy-now"
            onClick={handleBuyNowClick}
          >
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
