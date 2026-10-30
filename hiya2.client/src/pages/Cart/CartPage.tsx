import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { CartService } from '../../cart';
import type { CartItem } from '../../cart';
import { CouponService } from '../../services/couponService';
import type { AutoOfferResult } from '../../services/couponService';
import { SHIPPING_CONFIG, ShippingService } from '../../services/shippingService';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { CustomerAuthService } from '../../services/customerAuthService';
import { navigateTo } from '../../utils/navigation';
import './CartPage.css';

interface CartPageProps {
  onNavigateHome?: () => void;
  onNavigateMukhwas?: () => void;
  onNavigateToDetail: (id: string, name?: string) => void;
  onNavigateCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateHome = () => navigateTo('/'),
  onNavigateToDetail,
  onNavigateCheckout,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(CartService.getItems());
  const [subtotal, setSubtotal] = useState<number>(CartService.getSubtotal());
  
  // Automatic offer (no coupon code): re-priced whenever the cart total changes.
  const [offer, setOffer] = useState<AutoOfferResult>({ applied: null, next: null });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = CartService.subscribe(() => {
      setCartItems(CartService.getItems());
      setSubtotal(CartService.getSubtotal());
    });
    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    CouponService.getAutoOffer(subtotal).then((result) => {
      if (!cancelled) setOffer(result);
    });
    return () => { cancelled = true; };
  }, [subtotal]);

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

  // Financial Calculations
  const appliedOffer = offer.applied;
  const nextOffer = offer.next;
  const discountAmount = appliedOffer ? appliedOffer.discountAmount : 0;
  const freeShippingThreshold = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
  // Free shipping is judged on the price after coupon discount
  // (e.g. ₹500 − ₹50 = ₹450 → not free; ₹600 − ₹60 = ₹540 → free).
  const amountAfterDiscount = Math.max(0, subtotal - discountAmount);
  // Same rule as checkout and the server: the admin switch + threshold, on the discounted amount.
  const freeShippingEnabled = ShippingService.getSettings().enableFreeShipping;
  const isFreeShippingUnlocked = ShippingService.qualifiesForFreeShipping(amountAfterDiscount);
  const shippingFee = subtotal === 0 ? 0 : isFreeShippingUnlocked ? 0 : SHIPPING_CONFIG.STANDARD_SHIPPING_PRICE;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - amountAfterDiscount);
  const progressPercentage = Math.min(100, Math.round((amountAfterDiscount / freeShippingThreshold) * 100));

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
          {/* Page Heading */}
          <div className="hiyaghar-cart-header-section">
            <h2 className="hiyaghar-cart-title">Your Shopping Cart</h2>
            {cartItems.length > 0 && (() => {
              const totalCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
              return (
                <span className="hiyaghar-cart-item-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AnimatedNumber value={totalCount} /> {totalCount === 1 ? 'item' : 'items'}
                </span>
              );
            })()}
          </div>

          {cartItems.length === 0 ? (
            /* 11. EMPTY CART STATE */
            <div className="hiyaghar-empty-cart-card">
              <h2 className="hiyaghar-empty-cart-heading">Your Cart is Empty</h2>
              <p className="hiyaghar-empty-cart-text">
                {!CustomerAuthService.isLoggedIn()
                  ? "You are browsing as a guest. Sign in to your account to save your cart across devices."
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
                {/* 8. FREE SHIPPING PROGRESS BAR (hidden when the admin has switched free shipping off) */}
                {freeShippingEnabled && (
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
                )}

                {/* 3. CART ITEMS LIST */}
                <div className="hiyaghar-cart-items-list">
                  {cartItems.map((item) => (
                    <div key={item.id} className="hiyaghar-cart-item-card">
                      <div
                        className="hiyaghar-cart-item-img-wrapper"
                        onClick={() => onNavigateToDetail(item.productId, item.name)}
                        role="button"
                        tabIndex={0}
                      >
                        <img src={item.image} alt={item.name} className="hiyaghar-cart-item-img" />
                      </div>

                      <div className="hiyaghar-cart-item-details">
                        <span className="hiyaghar-cart-item-cat">Gourmet Mukhwas</span>
                        <h3
                          className="hiyaghar-cart-item-name"
                          onClick={() => onNavigateToDetail(item.productId, item.name)}
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

                {/* 7. AUTOMATIC OFFER (set in Admin → Coupons & Vouchers; no code to enter) */}
                {(appliedOffer || nextOffer) && (
                  <div className="hiyaghar-coupon-card">
                    <div className="hiyaghar-coupon-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span className="hiyaghar-coupon-title">Offers</span>
                    </div>

                    {appliedOffer && (
                      <div className="hiyaghar-coupon-applied-box">
                        <div className="hiyaghar-coupon-info">
                          <span className="hiyaghar-coupon-tag">✓ {appliedOffer.label}</span>
                          <span className="hiyaghar-coupon-msg">
                            Applied automatically. You save ₹<AnimatedNumber value={appliedOffer.discountAmount} />.
                          </span>
                        </div>
                      </div>
                    )}

                    {nextOffer && (
                      <div className="hiyaghar-offer-nudge" role="status" aria-live="polite">
                        <i className="fa-solid fa-gift" aria-hidden="true"></i>
                        <span>
                          Add <strong>₹<AnimatedNumber value={Math.ceil(nextOffer.amountNeeded)} /></strong> more to get{' '}
                          <strong>{nextOffer.benefit}</strong> on your order
                        </span>
                      </div>
                    )}
                  </div>
                )}

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
                        <span>Offer Discount</span>
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
                    onClick={onNavigateCheckout}
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
