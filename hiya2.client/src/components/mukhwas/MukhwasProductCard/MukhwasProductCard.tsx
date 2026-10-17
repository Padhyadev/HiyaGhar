import React, { useState, useRef, useEffect } from 'react';
import type { MukhwasProduct } from '../../../data/mukhwasData';
import { CartService, triggerFlyingProductAnimation } from '../../../cart';
import { WishlistService } from '../../../services/wishlistService';
import { AnimatedNumber } from '../../common/AnimatedNumber';
import { formatVariantLabel, toProductSlug } from '../../../utils/productFormat';
import { showToast } from '../../../utils/alertService';
import './MukhwasProductCard.css';

interface MukhwasProductCardProps {
  product: MukhwasProduct;
  index?: number;
  onNavigateToDetail: (productId: string) => void;
  onAddToCart: (product: MukhwasProduct, weight: string, quantity: number, price?: number, originalPrice?: number) => void;
  onBuyNow: (product: MukhwasProduct, weight: string, price?: number, originalPrice?: number) => void;
}

export const MukhwasProductCard: React.FC<MukhwasProductCardProps> = ({
  product,
  index = 0,
  onNavigateToDetail,
  onAddToCart,
  onBuyNow,
}) => {
  const [cartItems, setCartItems] = useState(CartService.getItems());

  useEffect(() => {
    const unsub = CartService.subscribe(() => {
      setCartItems(CartService.getItems());
    });
    return () => unsub();
  }, []);

  // Get total stock and available stock (subtracting already in-cart quantity)
  const getVariantStock = (v: any) => {
    if (!v) return { total: 99, available: 99 };
    const total = typeof v.sellableStock === 'number'
      ? v.sellableStock
      : (typeof v.stockQuantity === 'number' ? v.stockQuantity : 99);
    const label = formatVariantLabel(v.variantName);
    const rawName = v.variantName || '';
    // Match cart item either by formatted label or raw variant name or product weightOptions
    const inCart = cartItems.reduce((acc, item) => {
      if (item.productId === product.id.toString()) {
        const itemWeight = item.weight || '';
        if (
          itemWeight === label ||
          itemWeight === rawName ||
          (label === '' && (itemWeight === '' || itemWeight === product.name || (product.weightOptions && product.weightOptions.includes(itemWeight))))
        ) {
          return acc + item.quantity;
        }
      }
      return acc;
    }, 0);

    return {
      total,
      available: Math.max(0, total - inCart)
    };
  };

  const isVariantAvailable = (v: any) => getVariantStock(v).available > 0;
  const isVariantHasTotalStock = (v: any) => getVariantStock(v).total > 0;

  const variants = product.variants || [];
  const hasAnyTotalStock = variants.length > 0
    ? variants.some(isVariantHasTotalStock)
    : true;
  const hasAnyAvailableStock = variants.length > 0
    ? variants.some(isVariantAvailable)
    : true;

  const defaultVar = variants.find((v: any) => v.isDefault) || variants[0];
  const firstInStockVar = variants.find(isVariantHasTotalStock);
  const firstAvailableVar = variants.find(isVariantAvailable);

  // Automatically pick an in-stock variant (if default has 0 stock, pick the variant with stock like 200g)
  const activeVariant = product.selectedWeight && variants.length > 0
    ? (variants.find((v: any) => formatVariantLabel(v.variantName) === product.selectedWeight || v.variantName === product.selectedWeight) || defaultVar)
    : (defaultVar && isVariantHasTotalStock(defaultVar)
        ? (isVariantAvailable(defaultVar) ? defaultVar : (firstAvailableVar || defaultVar))
        : (firstAvailableVar || firstInStockVar || defaultVar));

  const defaultLabel = product.selectedWeight || (activeVariant ? formatVariantLabel(activeVariant.variantName) : (product.weightOptions?.[0] || ''));

  const activeVariantStock = getVariantStock(activeVariant);
  const isOutOfStock = !hasAnyTotalStock || activeVariantStock.total <= 0;
  const isAllInCart = !isOutOfStock && activeVariantStock.available <= 0 && !hasAnyAvailableStock;
  const isCardDisabled = isOutOfStock || isAllInCart;

  const availableUnits = activeVariantStock.available;
  const isLowStock = !isOutOfStock && !isAllInCart && activeVariantStock.available > 0 && activeVariantStock.available <= 10;

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

  const calculatedPrice = product.selectedWeight ? product.price : (activeVariant ? activeVariant.price : product.price);
  const calculatedOriginalPrice = product.selectedWeight ? (product.originalPrice || product.price) : (activeVariant ? (activeVariant.originalPrice || activeVariant.price) : (product.originalPrice || product.price));
  const discountPct = product.discountPercentage || (calculatedOriginalPrice > calculatedPrice ? Math.round(((calculatedOriginalPrice - calculatedPrice) / calculatedOriginalPrice) * 100) : 0);

  const handleCardClick = () => {
    onNavigateToDetail(toProductSlug(product.name, product.id));
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wishlistItem = {
      id: `${product.id}-${defaultLabel || 'default'}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      price: calculatedPrice,
      originalPrice: calculatedOriginalPrice,
      weight: defaultLabel,
    };
    const newState = WishlistService.toggleWishlist(wishlistItem);
    setIsWishlisted(newState);
    if (newState) {
      showToast(`Saved ${product.name} to Wishlist!`);
    } else {
      showToast(`Removed from Wishlist`);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      showToast(`${product.name} is currently out of stock.`, 'error');
      return;
    }
    if (isAllInCart || availableUnits <= 0) {
      showToast(`All available stock of ${product.name} (${defaultLabel || 'Standard'}) is in your cart.`, 'error');
      return;
    }
    onAddToCart(product, defaultLabel, 1, calculatedPrice, calculatedOriginalPrice);
    triggerFlyingProductAnimation(cardImgRef.current);
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      showToast(`${product.name} is currently out of stock.`, 'error');
      return;
    }
    if (isAllInCart || availableUnits <= 0) {
      showToast(`All available stock of ${product.name} (${defaultLabel || 'Standard'}) is in your cart.`, 'error');
      return;
    }
    onBuyNow(product, defaultLabel, calculatedPrice, calculatedOriginalPrice);
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
        {isOutOfStock || isAllInCart ? (
          <span className="hiyaghar-card-badge badge-out-of-stock">Out of Stock</span>
        ) : isLowStock ? (
          <span className="hiyaghar-card-badge badge-low-stock">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {availableUnits === 1 ? 'Only 1 left' : `${availableUnits} left`}
          </span>
        ) : product.badge ? (
          <span className={`hiyaghar-card-badge ${product.badge.toLowerCase().includes('best') ? 'badge-best-seller' : 'badge-popular'}`}>
            {product.badge}
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          className={`hiyaghar-card-wishlist-btn ${isWishlisted ? 'is-active' : ''}`}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : 'currentColor'} strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Main Image Area with Image Hover Swap */}
      <a
        href={`/product/${toProductSlug(product.name, product.id)}`}
        className="hiyaghar-mukhwas-card-image-box product-card-link"
        onClick={(e) => {
          e.preventDefault();
          handleCardClick();
        }}
        aria-label={`View ${product.name} details`}
      >
        <img
          ref={cardImgRef}
          src={isHovered && product.secondaryImage ? product.secondaryImage : product.image}
          alt={product.name}
          width={300}
          height={270}
          decoding="async"
          className="hiyaghar-mukhwas-card-img"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== window.location.origin + '/image/TEA MASALA.webp' && product.name.toLowerCase().includes('tea')) {
              target.src = '/image/TEA MASALA.webp';
            } else if (!target.src.includes('Noimage.png')) {
              target.src = '/image/Noimage.png';
            }
          }}
        />
        <div className="hiyaghar-mukhwas-quick-view-overlay">
          <span>View Details</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </a>

      {/* Product Content Body */}
      <div className="hiyaghar-mukhwas-card-body">
        {/* Title */}
        <h3 className="hiyaghar-mukhwas-card-title">
          <a
            href={`/product/${toProductSlug(product.name, product.id)}`}
            className="product-card-title-link"
            onClick={(e) => {
              e.preventDefault();
              handleCardClick();
            }}
          >
            {product.name}
          </a>
        </h3>

        {/* Short Description */}
        <p className="hiyaghar-mukhwas-card-desc">{product.shortDescription}</p>

        {/* Price & Discount Bar */}
        <div className="hiyaghar-mukhwas-card-price-row">
          <div className="hiyaghar-price-group">
            <span className="hiyaghar-current-price" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={calculatedPrice} /></span>
            {defaultLabel && (
              <span className="hiyaghar-card-weight-tag">{defaultLabel}</span>
            )}
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
            className={`hiyaghar-btn-add-cart ${isCardDisabled ? 'is-disabled' : ''}`}
            onClick={handleAddToCartClick}
            disabled={isCardDisabled}
            aria-disabled={isCardDisabled}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>{isOutOfStock ? 'Out of Stock' : isAllInCart ? 'In Cart' : 'Add to Cart'}</span>
          </button>

          <button
            type="button"
            className={`hiyaghar-btn-buy-now ${isCardDisabled ? 'is-disabled' : ''}`}
            onClick={handleBuyNowClick}
            disabled={isCardDisabled}
            aria-disabled={isCardDisabled}
          >
            <span>{isOutOfStock ? 'Unavailable' : isAllInCart ? 'In Cart' : 'Buy Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
