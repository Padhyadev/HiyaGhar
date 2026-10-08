import React, { useState, useEffect } from 'react';
import { CartService } from '../../../cart';
import type { CartItem } from '../../../cart';
import '../../../cart.css';
import './FloatingWidgets.css';

export const FloatingWidgets: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(CartService.getItems());
  const [cartCount, setCartCount] = useState<number>(CartService.getTotalCount());
  const [isPillVisible, setIsPillVisible] = useState<boolean>(CartService.isPillVisible());

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const unsubscribeCart = CartService.subscribe(() => {
      setCartItems(CartService.getItems());
      setCartCount(CartService.getTotalCount());
      setIsPillVisible(CartService.isPillVisible());
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribeCart();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const whatsappNumber = '919274443617';
  const whatsappMsg = encodeURIComponent('Hello HIYA Team! I have an enquiry.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  const showCartPill =
    isPillVisible &&
    cartItems.length > 0 &&
    !window.location.hash.toLowerCase().includes('/cart') &&
    !window.location.hash.toLowerCase().includes('/checkout');

  // On mobile the pill becomes a full-width sticky bar (see cart.css), so the
  // page needs reserved bottom space while it's showing so it never covers the
  // last row of product cards or their Add to Cart / Buy Now buttons.
  useEffect(() => {
    document.body.classList.toggle('hiyaghar-has-mobile-cart-bar', showCartPill);
    return () => {
      document.body.classList.remove('hiyaghar-has-mobile-cart-bar');
    };
  }, [showCartPill]);

  return (
    <div
      className={`hiyaghar-floating-widgets-stack ${showCartPill ? 'has-cart-bar' : ''}`}
      aria-label="Floating Actions"
    >
      {/* 1. Floating "View Cart" Pill — shown once on an explicit Add to Cart click.
          Rendered first so it sits topmost, above Back to Top and WhatsApp. */}
      {showCartPill && (
        <div className="hiyaghar-floating-cart-pill-wrapper">
          <button
            type="button"
            className="hiyaghar-floating-cart-pill"
            onClick={() => CartService.toggleCart()}
            aria-label={`View cart with ${cartCount} items`}
          >
            {/* Left: Overlapping Circular Product Thumbnails */}
            <div className="hiyaghar-pill-avatars-group">
              {cartItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  id={`hiyaghar-pill-avatar-${item.id}`}
                  className="hiyaghar-pill-avatar-circle"
                  title={item.name}
                >
                  <img src={item.image} alt={item.name} />
                </div>
              ))}
            </div>

            {/* Center: Title & Subtitle */}
            <div className="hiyaghar-pill-text-content">
              <span className="hiyaghar-pill-title">View cart</span>
              <span className="hiyaghar-pill-subtitle">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            </div>

            {/* Right: Circular Arrow Accent */}
            <div className="hiyaghar-pill-arrow-circle">
              &gt;
            </div>
          </button>
        </div>
      )}

      {/* 2. Back to Top Button — only mounted once scrolled past the threshold, so it
          doesn't reserve stack space while hidden. When it mounts, the View Cart pill
          above it is pushed up automatically by the flex layout to make room. */}
      {showBackToTop && (
        <button
          type="button"
          className="hiyaghar-floating-top-btn"
          onClick={scrollToTop}
          aria-label="Back to Top"
          title="Back to top"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* 3. WhatsApp Direct Chat Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hiyaghar-floating-whatsapp-btn"
        aria-label="Chat on WhatsApp with HIYA Team"
        title="Chat with us on WhatsApp"
      >
        <span className="hiyaghar-whatsapp-tooltip">Chat with us</span>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>
    </div>
  );
};
