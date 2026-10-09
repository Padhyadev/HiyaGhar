import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { CartService } from '../../cart';
import type { CartItem } from '../../cart';
import { CouponService } from '../../services/couponService';
import type { CouponResult } from '../../services/couponService';
import { SHIPPING_CONFIG } from '../../services/shippingService';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { CustomerAuthService } from '../../services/customerAuthService';
import { navigateTo } from '../../utils/navigation';
import './CartPage.css';

interface CartPageProps {
  onNavigateHome?: () => void;
  onNavigateMukhwas?: () => void;
  onNavigateToDetail: (id: string) => void;
  onNavigateCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateHome = () => navigateTo('/'),
  onNavigateToDetail,
  onNavigateCheckout,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(CartService.getItems());
  const [subtotal, setSubtotal] = useState<number>(CartService.getSubtotal());
  
  // Coupon State
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = CartService.subscribe(() => {
      const items = CartService.getItems();
      const currentSubtotal = CartService.getSubtotal();
      setCartItems(items);
      setSubtotal(currentSubtotal);

      // Re-validate coupon if cart subtotal changes
      if (appliedCoupon && appliedCoupon.code) {
        CouponService.validateCoupon(appliedCoupon.code, currentSubtotal).then((reval) => {
          if (reval.success) {
            setAppliedCoupon(reval);
          } else {
            setAppliedCoupon(null);
            showToast('Coupon removed: Cart total no longer satisfies minimum requirement.');
          }
        });
      }
    });
    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, [appliedCoupon]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleQuantityChange = (id: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    CartService.updateQuantity(id, newQty);
  };

  const handleRemoveItem = (item: CartItem) => {
    CartService.removeItem(item.id);
    showToast(`"${item.name}" removed from your cart.`);
  };

  const handleApplyCoupon = async (e: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const codeToApply = customCode || couponInput;
    if (!codeToApply.trim()) {
      showToast('Please enter a coupon code.');
      return;
    }
    const result = await CouponService.validateCoupon(codeToApply, subtotal);
    if (result.success) {
      setAppliedCoupon(result);
      setCouponInput(result.code || codeToApply.toUpperCase());
      showToast(result.message);
    } else {
      showToast(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    showToast('Coupon code removed.');
  };

  // Financial Calculations
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const freeShippingThreshold = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
  const isFreeShippingUnlocked = subtotal >= freeShippingThreshold || appliedCoupon?.coupon?.type === 'free_shipping';
  const shippingFee = subtotal === 0 ? 0 : isFreeShippingUnlocked ? 0 : SHIPPING_CONFIG.STANDARD_SHIPPING_PRICE;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercentage = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  // Dynamic Estimated Tax (GST settings from Admin)
  const gstPercent = SHIPPING_CONFIG.GST_PERCENT ?? 5;
  const enableGstDisplay = SHIPPING_CONFIG.ENABLE_GST_DISPLAY ?? true;
  const gstLabel = SHIPPING_CONFIG.GST_LABEL || `Estimated GST (${gstPercent}% Included)`;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableSubtotal * (gstPercent / 100));

  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  return (
    <div className="hiyaghar-cart-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-cart-main">
        {/* Subtle Non-Intrusive Toast Banner */}
        {toastMessage && (
          <div className="hiyaghar-cart-toast" role="status" aria-live="polite">
            <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ color: '#10b981' }}></i>
            <span>{toastMessage}</span>
          </div>
        )}

        <MukhwasHero
          onNavigateHome={onNavigateHome}
          breadcrumbCurrent="Shopping Cart"
          title="Shopping Cart"
          bgImage="/image/hiya_mukhwas_auth_lifestyle.webp"
        />

        <div className="hiyaghar-container">
          {/* Breadcrumb Navigation */}
          <nav className="hiyaghar-cart-breadcrumb" aria-label="Breadcrumb">
            <ol className="hiyaghar-cart-breadcrumb-list">
              <li>
                <a href="#/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
                  Home
                </a>
              </li>
              <li className="sep">/</li>
              <li className="current">Cart</li>
            </ol>
          </nav>

          {/* Page Heading */}
          <div className="hiyaghar-cart-header-section">
            <h2 className="hiyaghar-cart-title">Your Shopping Cart</h2>
            {cartItems.length > 0 && (
              <span className="hiyaghar-cart-item-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <AnimatedNumber value={cartItems.reduce((acc, i) => acc + i.quantity, 0)} /> Items
              </span>
            )}
          </div>

          {cartItems.length === 0 ? (
            /* 11. EMPTY CART STATE */
            <div className="hiyaghar-empty-cart-card">
              <h2 className="hiyaghar-empty-cart-heading">Your Cart is Empty</h2>
              <p className="hiyaghar-empty-cart-text">
                {!CustomerAuthService.isLoggedIn()
                  ? "You are browsing as a guest. Sign in to your account to save your cart across devices and enjoy exclusive rewards!"
                  : "Looks like you haven't added anything to your cart yet."}
              </p>
              <div className="hiyaghar-empty-cart-actions">
                {!CustomerAuthService.isLoggedIn() && (
                  <button
                    type="button"
                    className="hiyaghar-btn-primary"
                    onClick={() => navigateTo('/auth')}
                    style={{ background: '#CB992C', borderColor: 'var(--hiya-gold-text, #855F0F)' }}
                  >
                    Sign In / Register
                  </button>
                )}
                <button
                  type="button"
                  className="hiyaghar-btn-primary"
                  onClick={() => navigateTo('/#bestsellers-section')}
                  style={{ background: 'var(--hiya-navy, #11223A)' }}
                >
                  View Best Sellers
                </button>
              </div>
            </div>
          ) : (
            /* MAIN 2-COLUMN CART CONTENT */
            <div className="hiyaghar-cart-grid">
              {/* LEFT COLUMN — Cart Items, Free Shipping, Addons */}
              <div className="hiyaghar-cart-left-col">
                {/* 8. FREE SHIPPING PROGRESS BAR */}
                <div className="hiyaghar-shipping-progress-card">
                  <div className="hiyaghar-shipping-progress-header">
                    <span className="hiyaghar-shipping-icon" style={{ color: 'var(--hiya-gold-text, #855F0F)' }}>
                      <i className="fa-solid fa-truck-fast" aria-hidden="true"></i>
                    </span>
                    <span className="hiyaghar-shipping-text">
                      {isFreeShippingUnlocked ? (
                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1e7e34' }}>
                          <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                          You've unlocked FREE SHIPPING!
                        </strong>
                      ) : (
                        <>
                          You're <strong>₹<AnimatedNumber value={remainingForFreeShipping} /></strong> away from <strong>FREE SHIPPING</strong>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="hiyaghar-shipping-track">
                    <div
                      className={`hiyaghar-shipping-fill ${isFreeShippingUnlocked ? 'is-complete' : ''}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* 3. CART ITEMS LIST */}
                <div className="hiyaghar-cart-items-list">
                  {cartItems.map((item) => (
                    <div key={item.id} className="hiyaghar-cart-item-card">
                      <div
                        className="hiyaghar-cart-item-img-wrapper"
                        onClick={() => onNavigateToDetail(item.productId)}
                        role="button"
                        tabIndex={0}
                      >
                        <img src={item.image} alt={item.name} className="hiyaghar-cart-item-img" />
                      </div>

                      <div className="hiyaghar-cart-item-details">
                        <span className="hiyaghar-cart-item-cat">Gourmet Mukhwas</span>
                        <h3
                          className="hiyaghar-cart-item-name"
                          onClick={() => onNavigateToDetail(item.productId)}
                        >
                          {item.name}
                        </h3>
                        <span className="hiyaghar-cart-item-weight">Pack Size: {item.weight}</span>
                        <span className="hiyaghar-cart-item-price-row">
                          <span className="hiyaghar-cart-item-unit-price">₹{item.price}</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="hiyaghar-original-price">₹{item.originalPrice}</span>
                          )}
                        </span>

                        {/* Actions Row: Remove */}
                        <div className="hiyaghar-cart-item-actions">
                          <button
                            type="button"
                            className="hiyaghar-action-link remove"
                            onClick={() => handleRemoveItem(item)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Right Quantity & Subtotal Column */}
                      <div className="hiyaghar-cart-item-right">
                        <div className="hiyaghar-cart-qty-selector">
                          <button
                            type="button"
                            className="hiyaghar-qty-btn"
                            onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="hiyaghar-qty-val" style={{ display: 'inline-flex', alignItems: 'center' }}><AnimatedNumber value={item.quantity} /></span>
                          <button
                            type="button"
                            className="hiyaghar-qty-btn"
                            onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="hiyaghar-cart-item-subtotal" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={item.price * item.quantity} /></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 7. COUPON SECTION */}
                <div className="hiyaghar-coupon-card">
                  <div className="hiyaghar-coupon-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span className="hiyaghar-coupon-title">Have a coupon?</span>
                  </div>

                  {!appliedCoupon ? (
                    <form className="hiyaghar-coupon-form" onSubmit={handleApplyCoupon}>
                      <input
                        type="text"
                        className="hiyaghar-coupon-input"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                      />
                      <button type="submit" className="hiyaghar-coupon-btn">
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div className="hiyaghar-coupon-applied-box">
                      <div className="hiyaghar-coupon-info">
                        <span className="hiyaghar-coupon-tag">✓ {appliedCoupon.code}</span>
                        <span className="hiyaghar-coupon-msg">{appliedCoupon.message}</span>
                      </div>
                      <button
                        type="button"
                        className="hiyaghar-coupon-remove"
                        onClick={handleRemoveCoupon}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN — Sticky Order Summary Card */}
              <div className="hiyaghar-cart-right-col">
                <div className="hiyaghar-order-summary-card">
                  <h3 className="hiyaghar-summary-title">Order Summary</h3>

                  <div className="hiyaghar-summary-rows">
                    <div className="hiyaghar-summary-row">
                      <span>Subtotal</span>
                      <span className="val" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={subtotal} /></span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="hiyaghar-summary-row discount">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span className="val" style={{ display: 'inline-flex', alignItems: 'center' }}>-₹<AnimatedNumber value={discountAmount} /></span>
                      </div>
                    )}

                    <div className="hiyaghar-summary-row">
                      <span>Shipping</span>
                      <span className="val highlight">
                        {shippingFee === 0 ? 'FREE' : <span style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={shippingFee} /></span>}
                      </span>
                    </div>

                    {enableGstDisplay && (
                      <div className="hiyaghar-summary-row subtle">
                        <span>{gstLabel}</span>
                        <span className="val" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={taxAmount} /></span>
                      </div>
                    )}

                    <div className="hiyaghar-summary-divider" />

                    <div className="hiyaghar-summary-row total">
                      <span>Total</span>
                      <span className="val" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={finalTotal} /></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="hiyaghar-checkout-cta-btn"
                    onClick={() => {
                      if (!CustomerAuthService.isLoggedIn()) {
                        showToast('Please sign in to complete your checkout.');
                        navigateTo('/login?redirect=/checkout');
                        return;
                      }
                      onNavigateCheckout();
                    }}
                  >
                    <span>Proceed to Checkout</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Trust Badges */}
                  <div className="hiyaghar-summary-trust-badges">
                    <div className="hiyaghar-trust-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>100% Safe & Secure Checkout</span>
                    </div>
                    <div className="hiyaghar-trust-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Authentic Fresh Gourmet Quality</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
