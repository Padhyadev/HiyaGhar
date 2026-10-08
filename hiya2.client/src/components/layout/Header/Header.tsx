import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CartService } from '../../../cart';
import type { CartItem } from '../../../cart';
import { CustomerAuthService } from '../../../services/customerAuthService';
import type { CustomerProfile } from '../../../services/customerAuthService';
import { WishlistService } from '../../../services/wishlistService';
import { ShippingService } from '../../../services/shippingService';
import { AnnouncementService } from '../../../services/announcementService';
import { ProductService, type Product } from '../../../services/productService';
import { navigateTo } from '../../../utils/navigation';
import { showToast } from '../../../utils/alertService';
import { AnimatedNumber } from '../../common/AnimatedNumber';
import '../../../cart.css';
import './Header.css';

export const Header: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState<boolean>(CartService.isCartOpen());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const mobileDrawerRef = React.useRef<HTMLDivElement>(null);

  // Search State & Modal
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const toggleMobileSection = (section: string) => {
    setExpandedMobileSection((prev) => (prev === section ? null : section));
  };

  // Lock background scrolling when mobile drawer, side cart, or search modal is active
  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen || isSearchOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen, isCartOpen, isSearchOpen]);

  // Load products when search modal opens & auto focus
  useEffect(() => {
    if (isSearchOpen) {
      ProductService.getProducts().then((res) => {
        if (res && res.length > 0) setAllProducts(res);
      });
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  // Escape key listener for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Reset drawer scroll position to top whenever mobile menu is opened
  useEffect(() => {
    if (isMobileMenuOpen && mobileDrawerRef.current) {
      mobileDrawerRef.current.scrollTop = 0;
    }
  }, [isMobileMenuOpen]);

  // Click outside listener to close any active user / nav dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Auth State & Auth Modal
  const [customer, setCustomer] = useState<CustomerProfile | null>(CustomerAuthService.getCustomer());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(CustomerAuthService.isLoggedIn());
  const [wishlistCount, setWishlistCount] = useState<number>(WishlistService.getItems().length);

  // Dynamic Cart state from CartService
  const [cartItems, setCartItems] = useState<CartItem[]>(CartService.getItems());
  const [cartCount, setCartCount] = useState<number>(CartService.getTotalCount());
  const [cartSubtotal, setCartSubtotal] = useState<number>(CartService.getSubtotal());

  useEffect(() => {
    // Subscribe to cart changes and open/close state
    const unsubscribeCart = CartService.subscribe(() => {
      setCartItems(CartService.getItems());
      setCartCount(CartService.getTotalCount());
      setCartSubtotal(CartService.getSubtotal());
      setIsCartOpen(CartService.isCartOpen());
    });

    const unsubscribeAuth = CustomerAuthService.subscribe(() => {
      setCustomer(CustomerAuthService.getCustomer());
      setIsLoggedIn(CustomerAuthService.isLoggedIn());
    });

    const unsubscribeWishlist = WishlistService.subscribe(() => {
      setWishlistCount(WishlistService.getItems().length);
    });

    return () => {
      unsubscribeCart();
      unsubscribeAuth();
      unsubscribeWishlist();
    };
  }, []);

  const handleQuantityChange = (id: string, delta: number, currentQty: number) => {
    CartService.updateQuantity(id, currentQty + delta);
  };

  const handleRemoveItem = (id: string) => {
    CartService.removeItem(id);
  };

  // Hover Delay Ref to prevent accidental dropdown closing
  const dropdownTimeoutRef = React.useRef<any>(null);

  const handleMouseEnterDropdown = (menuName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(menuName);
  };

  const handleMouseLeaveDropdown = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 250);
  };

  const [marqueeItems, setMarqueeItems] = useState<string[]>(() => {
    const shippingSettings = ShippingService.getSettings();
    const freeShippingLimit = shippingSettings?.freeShippingThreshold || 500;
    return AnnouncementService.getActiveAnnouncementTexts(freeShippingLimit);
  });

  useEffect(() => {
    const updateMarquee = () => {
      const shippingSettings = ShippingService.getSettings();
      const freeShippingLimit = shippingSettings?.freeShippingThreshold || 500;
      setMarqueeItems(AnnouncementService.getActiveAnnouncementTexts(freeShippingLimit));
    };

    window.addEventListener('announcementsUpdated', updateMarquee);
    window.addEventListener('storage', updateMarquee);
    return () => {
      window.removeEventListener('announcementsUpdated', updateMarquee);
      window.removeEventListener('storage', updateMarquee);
    };
  }, []);

  const filteredProducts = searchQuery.trim()
    ? allProducts.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
          p.productName.toLowerCase().includes(query) ||
          p.shortDescription?.toLowerCase().includes(query) ||
          p.category?.categoryName.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <header className="hiyaghar-header-wrapper">
      {/* Skip to Main Content Link for Accessibility */}
      <a href="#main-content" className="hiyaghar-skip-link">
        Skip to main content
      </a>

      {/* 1. Magenta Ticker Marquee */}
      <div className="hiyaghar-ticker-bar" role="region" aria-label="Announcement Marquee">
        <div className="hiyaghar-ticker-track">
          {marqueeItems.concat(marqueeItems).map((item, index) => (
            <div key={index} className="hiyaghar-ticker-item">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Floating Header Pill Container */}
      <div className="hiyaghar-header-nav-container">
        <div className="hiyaghar-header-main-bar" ref={headerRef}>
          {/* Mobile Hamburger Button (<992px) */}
          <button
            type="button"
            className="hiyaghar-mobile-hamburger-btn"
            onClick={() => {
              const nextState = !isMobileMenuOpen;
              setIsMobileMenuOpen(nextState);
              if (nextState) {
                setActiveDropdown(null);
              }
            }}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >

            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Desktop Left Navigation Items (>=992px) */}
          <nav className="hiyaghar-header-left" aria-label="Main Navigation">
            <a href="/mukhwas" className="hiyaghar-header-link" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/mukhwas'); window.dispatchEvent(new Event('popstate')); }}>
              Mukhwas
            </a>

            <a href="/tea-masala" className="hiyaghar-header-link" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/tea-masala'); window.dispatchEvent(new Event('popstate')); }}>
              Tea Masala
            </a>

            {/* Personal Care Dropdown */}
            <div
              className="hiyaghar-header-dropdown-wrapper"
              onMouseEnter={() => setActiveDropdown('personal-care')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="hiyaghar-header-dropdown-btn"
                aria-expanded={activeDropdown === 'personal-care'}
                aria-haspopup="true"
                onClick={() => setActiveDropdown(activeDropdown === 'personal-care' ? null : 'personal-care')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveDropdown(activeDropdown === 'personal-care' ? null : 'personal-care');
                  } else if (e.key === 'Escape') {
                    setActiveDropdown(null);
                  }
                }}
              >
                <span>Personal Care</span>
                <svg className="hiyaghar-dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1L5 5L9 1" />
                </svg>
              </button>

              {activeDropdown === 'personal-care' && (
                <div className="hiyaghar-dropdown-menu" role="menu">
                  <a
                    href="/handmade-soap"
                    role="menuitem"
                    className="hiyaghar-dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, '', '/handmade-soap');
                      window.dispatchEvent(new Event('popstate'));
                      setActiveDropdown(null);
                    }}
                  >
                    Handmade Soap
                  </a>
                  <a
                    href="/hair-oil"
                    role="menuitem"
                    className="hiyaghar-dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, '', '/hair-oil');
                      window.dispatchEvent(new Event('popstate'));
                      setActiveDropdown(null);
                    }}
                  >
                    Hair Oil
                  </a>
                </div>
              )}
            </div>

            {/* Gifting Dropdown */}
            <div
              className="hiyaghar-header-dropdown-wrapper"
              onMouseEnter={() => setActiveDropdown('gifting')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="hiyaghar-header-dropdown-btn"
                aria-expanded={activeDropdown === 'gifting'}
                aria-haspopup="true"
                onClick={() => setActiveDropdown(activeDropdown === 'gifting' ? null : 'gifting')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveDropdown(activeDropdown === 'gifting' ? null : 'gifting');
                  } else if (e.key === 'Escape') {
                    setActiveDropdown(null);
                  }
                }}
              >
                <span>Gifting</span>
                <svg className="hiyaghar-dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1L5 5L9 1" />
                </svg>
              </button>

              {activeDropdown === 'gifting' && (
                <div className="hiyaghar-dropdown-menu">
                  <a
                    href="/gift-hampers"
                    className="hiyaghar-dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, '', '/gift-hampers');
                      window.dispatchEvent(new Event('popstate'));
                      setActiveDropdown(null);
                    }}
                  >
                    Gift Hampers
                  </a>
                  <a
                    href="/combos"
                    className="hiyaghar-dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, '', '/combos');
                      window.dispatchEvent(new Event('popstate'));
                      setActiveDropdown(null);
                    }}
                  >
                    Combos
                  </a>
                </div>
              )}
            </div>

            {/* Our Story Link */}
            <a
              href="/our-story"
              className="hiyaghar-header-link"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/our-story');
                window.dispatchEvent(new Event('popstate'));
              }}
            >
              Our Story
            </a>
          </nav>

          {/* Center Brand Logo */}
          <div className="hiyaghar-header-center">
            <a href="/" className="hiyaghar-ref-logo" aria-label="Home" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate')); }}>
              <img src="/image/HIYA LOGO (1).png" alt="HIYA" className="hiyaghar-logo-img" />
            </a>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="hiyaghar-header-right">
            {/* Search Button */}
            <button
              type="button"
              className="hiyaghar-search-icon-btn"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search Products"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Account User Icon Dropdown */}
            <div
              className="hiyaghar-header-dropdown-wrapper"
              onMouseEnter={() => handleMouseEnterDropdown('account')}
              onMouseLeave={handleMouseLeaveDropdown}
            >
              <button
                type="button"
                className="hiyaghar-account-icon-btn"
                aria-label="Account Menu"
                aria-expanded={activeDropdown === 'account'}
                onClick={() => {
                  if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  const nextAcc = activeDropdown === 'account' ? null : 'account';
                  setActiveDropdown(nextAcc);
                  if (nextAcc) {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {activeDropdown === 'account' && (
                <div className="hiyaghar-dropdown-menu right-aligned">
                  {!isLoggedIn ? (
                    <>
                      <a
                        href="/login"
                        className="hiyaghar-dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState(null, '', '/login');
                          window.dispatchEvent(new Event('popstate'));
                          setActiveDropdown(null);
                        }}
                      >
                        Login / Register
                      </a>
                    </>
                  ) : (
                    <>
                      <div className="hiyaghar-dropdown-header-user">
                        <span>Hi, {customer?.firstName}</span>
                      </div>
                      <a
                        href="/profile"
                        className="hiyaghar-dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState(null, '', '/profile');
                          window.dispatchEvent(new Event('popstate'));
                          setActiveDropdown(null);
                        }}
                      >
                        My Profile
                      </a>
                      <a
                        href="/orders"
                        className="hiyaghar-dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState(null, '', '/orders');
                          window.dispatchEvent(new Event('popstate'));
                          setActiveDropdown(null);
                        }}
                      >
                        Order History
                      </a>
                      <a
                        href="/addresses"
                        className="hiyaghar-dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState(null, '', '/addresses');
                          window.dispatchEvent(new Event('popstate'));
                          setActiveDropdown(null);
                        }}
                      >
                        Saved Addresses
                      </a>
                      <a
                        href="/rewards"
                        className="hiyaghar-dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState(null, '', '/rewards');
                          window.dispatchEvent(new Event('popstate'));
                          setActiveDropdown(null);
                        }}
                      >
                        Reward Coins
                      </a>
                      <button
                        type="button"
                        className="hiyaghar-dropdown-item btn-style logout"
                        onClick={() => {
                          CustomerAuthService.logout();
                          showToast('Logout successfully', 'info');
                          setActiveDropdown(null);
                          navigateTo('/');
                          window.location.hash = '#/';
                        }}
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Header Wishlist Button with Badge */}
            <button
              type="button"
              className="hiyaghar-wishlist-icon-btn"
              onClick={() => navigateTo('/wishlist')}
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={wishlistCount > 0 ? '#ef4444' : 'none'}
                stroke={wishlistCount > 0 ? '#ef4444' : 'currentColor'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="hiyaghar-wishlist-badge-count">
                  <AnimatedNumber value={wishlistCount} />
                </span>
              )}
            </button>

            {/* Header Cart Button with Badge */}
            <button
              type="button"
              className="hiyaghar-cart-cyan-pill"
              onClick={() => CartService.toggleCart()}
              aria-label={`Cart with ${cartCount} items`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="hiyaghar-cart-badge-count">
                  <AnimatedNumber value={cartCount} />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Menu Overlay (<992px) */}
      {isMobileMenuOpen && createPortal(
        <div
          className="hiyaghar-mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            ref={mobileDrawerRef}
            className="hiyaghar-mobile-menu-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hiyaghar-mobile-menu-header">
              <span className="hiyaghar-mobile-menu-title">Menu</span>
              <button
                type="button"
                className="hiyaghar-icon-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close mobile menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="hiyaghar-mobile-menu-links">
              {/* Mobile Search Button */}
              <button
                type="button"
                className="hiyaghar-mobile-search-trigger"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search products...</span>
              </button>

              <a
                href="/mukhwas"
                className="hiyaghar-mobile-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/mukhwas');
                  setIsMobileMenuOpen(false);
                }}
              >
                Mukhwas
              </a>
              <a
                href="/tea-masala"
                className="hiyaghar-mobile-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/tea-masala');
                  setIsMobileMenuOpen(false);
                }}
              >
                Tea Masala
              </a>

              {/* Personal Care Section (Collapsible) */}
              <div className="hiyaghar-mobile-group">
                <button
                  type="button"
                  className="hiyaghar-mobile-group-header"
                  onClick={() => toggleMobileSection('personal-care')}
                  aria-expanded={expandedMobileSection === 'personal-care'}
                >
                  <span className="hiyaghar-mobile-group-title">Personal Care</span>
                  <svg
                    className={`hiyaghar-dropdown-chevron ${expandedMobileSection === 'personal-care' ? 'is-open' : ''}`}
                    width="12"
                    height="8"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M1 1L5 5L9 1" />
                  </svg>
                </button>
                {expandedMobileSection === 'personal-care' && (
                  <div className="hiyaghar-mobile-sublinks-container">
                    <a
                      href="/handmade-soap"
                      className="hiyaghar-mobile-sublink"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/handmade-soap');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Handmade Soap
                    </a>
                    <a
                      href="/hair-oil"
                      className="hiyaghar-mobile-sublink"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/hair-oil');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Hair Oil
                    </a>
                  </div>
                )}
              </div>

              {/* Gifting Section (Collapsible) */}
              <div className="hiyaghar-mobile-group">
                <button
                  type="button"
                  className="hiyaghar-mobile-group-header"
                  onClick={() => toggleMobileSection('gifting')}
                  aria-expanded={expandedMobileSection === 'gifting'}
                >
                  <span className="hiyaghar-mobile-group-title">Gifting</span>
                  <svg
                    className={`hiyaghar-dropdown-chevron ${expandedMobileSection === 'gifting' ? 'is-open' : ''}`}
                    width="12"
                    height="8"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M1 1L5 5L9 1" />
                  </svg>
                </button>
                {expandedMobileSection === 'gifting' && (
                  <div className="hiyaghar-mobile-sublinks-container">
                    <a
                      href="/gift-hampers"
                      className="hiyaghar-mobile-sublink"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/gift-hampers');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Gift Hampers
                    </a>
                    <a
                      href="/combos"
                      className="hiyaghar-mobile-sublink"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/combos');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Combos
                    </a>
                  </div>
                )}
              </div>

              {/* Our Story in Mobile Menu */}
              <a
                href="/our-story"
                className="hiyaghar-mobile-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/our-story');
                  setIsMobileMenuOpen(false);
                }}
              >
                Our Story
              </a>

              {/* Account Section (Collapsible) */}
              <div className="hiyaghar-mobile-group">
                <button
                  type="button"
                  className="hiyaghar-mobile-group-header"
                  onClick={() => toggleMobileSection('account')}
                  aria-expanded={expandedMobileSection === 'account'}
                >
                  <span className="hiyaghar-mobile-group-title">
                    Account {isLoggedIn && customer?.firstName ? `(${customer.firstName})` : ''}
                  </span>
                  <svg
                    className={`hiyaghar-dropdown-chevron ${expandedMobileSection === 'account' ? 'is-open' : ''}`}
                    width="12"
                    height="8"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M1 1L5 5L9 1" />
                  </svg>
                </button>
                {expandedMobileSection === 'account' && (
                  <div className="hiyaghar-mobile-sublinks-container">
                    {!isLoggedIn ? (
                      <>
                        <a
                          href="/login"
                          className="hiyaghar-mobile-sublink"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo('/login');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Login / Register
                        </a>
                      </>
                    ) : (
                      <>
                        <a
                          href="/profile"
                          className="hiyaghar-mobile-sublink"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo('/profile');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          My Profile
                        </a>
                        <a
                          href="/orders"
                          className="hiyaghar-mobile-sublink"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo('/orders');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Order History
                        </a>
                        <a
                          href="/addresses"
                          className="hiyaghar-mobile-sublink"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo('/addresses');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Saved Addresses
                        </a>
                        <button
                          type="button"
                          className="hiyaghar-mobile-sublink btn-style logout"
                          onClick={() => {
                            CustomerAuthService.logout();
                            showToast('Logout successfully', 'info');
                            setIsMobileMenuOpen(false);
                            navigateTo('/');
                            window.location.hash = '#/';
                          }}
                        >
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>,
        document.body
      )}

      {/* 3. Search Modal Overlay */}
      {isSearchOpen && createPortal(
        <div className="hiyaghar-search-modal-overlay" onClick={() => setIsSearchOpen(false)}>
          <div
            className="hiyaghar-search-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search Products"
          >
            <div className="hiyaghar-search-modal-header">
              <div className="hiyaghar-search-input-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CB992C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search mukhwas, tea masala, soap, hair oil..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hiyaghar-search-input-field"
                />
              </div>
              <button
                type="button"
                className="hiyaghar-search-close-btn"
                onClick={() => {
                  if (searchQuery) {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  } else {
                    setIsSearchOpen(false);
                  }
                }}
                aria-label={searchQuery ? "Clear search text" : "Close search"}
                title={searchQuery ? "Clear search" : "Close"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search Suggestions or Results */}
            <div className="hiyaghar-search-modal-body">
              {searchQuery.trim() === '' ? (
                <div className="hiyaghar-search-quick-links">
                  <span className="hiyaghar-search-quick-title">Popular Searches</span>
                  <div className="hiyaghar-search-pills">
                    {(allProducts.length > 0
                      ? allProducts.slice(0, 6).map((p) => p.productName)
                      : ['Kalkatti Pan', 'Amla Madhur', 'Shahi Kharek', 'Jamun Pop', 'Dil Raja', 'Tea Masala']
                    ).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="hiyaghar-search-pill-btn"
                        onClick={() => setSearchQuery(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="hiyaghar-search-results-list">
                  <div className="hiyaghar-search-results-count">
                    Found {filteredProducts.length} matching {filteredProducts.length === 1 ? 'product' : 'products'}
                  </div>
                  {filteredProducts.map((p) => {
                    const primaryImg = p.images?.find((i) => i.isPrimary)?.imagePath || p.mainImagePath || '/image/ImageforMukhwash/Shahi Pan.webp';
                    const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
                    const price = defaultVariant ? defaultVariant.price : (p.discountPrice ?? p.basePrice);

                    return (
                      <div
                        key={p.id}
                        className="hiyaghar-search-result-item"
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigateTo(`/product/${p.id}`);
                        }}
                      >
                        <div className="hiyaghar-search-item-img-wrap">
                          <img
                            src={primaryImg}
                            alt={p.productName}
                            className="hiyaghar-search-item-img"
                            onError={(e) => {
                              e.currentTarget.src = '/image/ImageforMukhwash/Shahi Pan.webp';
                            }}
                          />
                        </div>
                        <div className="hiyaghar-search-item-details">
                          <span className="hiyaghar-search-item-cat">{p.category?.categoryName || 'Natural Product'}</span>
                          <span className="hiyaghar-search-item-title">{p.productName}</span>
                          {p.shortDescription && <p className="hiyaghar-search-item-desc">{p.shortDescription}</p>}
                        </div>
                        <div className="hiyaghar-search-item-price-col">
                          <span className="hiyaghar-search-item-price">₹{price}</span>
                          <span className="hiyaghar-search-item-arrow">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="hiyaghar-search-empty-state">
                  <p>No products found matching "<strong>{searchQuery}</strong>"</p>
                  <span>Try checking for spelling or search general terms like "Mukhwas", "Tea", or "Soap"</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Full Cart Drawer Overlay */}
      {isCartOpen && createPortal(
        <div className="hiyaghar-side-cart-overlay" onClick={() => CartService.closeCart()}>
          <div
            className="hiyaghar-side-cart-widget"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart Drawer"
          >
            {/* Header */}
            <div className="hiyaghar-side-cart-header">
              <div className="hiyaghar-side-cart-title-group">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <h3 className="hiyaghar-side-cart-title">Your Cart</h3>
                <span className="hiyaghar-side-cart-badge"><AnimatedNumber value={cartCount} /></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="hiyaghar-side-cart-view-all-header-link"
                  onClick={() => {
                    navigateTo('/cart');
                    CartService.closeCart();
                  }}
                >
                  View All →
                </button>
                <button
                  type="button"
                  className="hiyaghar-side-cart-close"
                  onClick={() => CartService.closeCart()}
                  aria-label="Close cart"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="hiyaghar-side-cart-body">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item.id} className="hiyaghar-side-cart-item">
                    <div className="hiyaghar-side-cart-item-img-wrap">
                      <img
                        src={item.image || '/image/ImageforMukhwash/Shahi Pan.webp'}
                        alt={item.name}
                        className="hiyaghar-side-cart-item-img"
                        onError={(e) => {
                          e.currentTarget.src = '/image/ImageforMukhwash/Shahi Pan.webp';
                        }}
                      />
                    </div>
                    <div className="hiyaghar-side-cart-item-info">
                      <span className="hiyaghar-side-cart-item-cat">
                        {item.weight ? `Mukhwas • ${item.weight}` : 'Authentic Delicacy'}
                      </span>
                      <span className="hiyaghar-side-cart-item-name">{item.name}</span>
                    </div>
                    <div className="hiyaghar-side-cart-item-right">
                      <span className="hiyaghar-side-cart-item-price" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={item.price * item.quantity} /></span>
                      <div className="hiyaghar-side-cart-qty-row">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}><AnimatedNumber value={item.quantity} /></span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '10px', cursor: 'pointer', marginTop: '2px' }}
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'rgba(255, 255, 255, 0.9)' }}>
                  <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', background: 'rgba(209, 154, 39, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D19A27' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Your Cart is empty</p>
                  <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>Add products to fill your cart!</p>
                </div>
              )}
            </div>

            {/* Shipping Progress Bar */}
            {cartItems.length > 0 && (
              <div className="hiyaghar-side-cart-shipping-bar">
                <span className="hiyaghar-shipping-icon" style={{ color: 'var(--hiya-gold, #CB992C)', display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </span>
                <span>
                  {cartSubtotal >= 500 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 700 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      You unlocked FREE Delivery!
                    </span>
                  ) : (
                    `Add ₹${500 - cartSubtotal} more to unlock FREE Delivery`
                  )}
                </span>
              </div>
            )}

            {/* Subtotal & Action Rows (Only shown when cart has items) */}
            {cartItems.length > 0 && (
              <>
                <div className="hiyaghar-side-cart-subtotal-row">
                  <span className="hiyaghar-side-cart-subtotal-label">Subtotal</span>
                  <span className="hiyaghar-side-cart-subtotal-val" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={cartSubtotal} /></span>
                </div>

                <div className="hiyaghar-side-cart-actions-column">
                  <button
                    type="button"
                    className="hiyaghar-side-cart-checkout-btn"
                    onClick={() => {
                      CartService.closeCart();
                      if (!isLoggedIn) {
                        showToast('Please sign in to complete your checkout.', 'info');
                        navigateTo('/login?redirect=/checkout');
                        return;
                      }
                      navigateTo('/checkout');
                    }}
                  >
                    <span>Proceed to Checkout</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={cartSubtotal} /> &gt;</span>
                  </button>

                  <button
                    type="button"
                    className="hiyaghar-side-cart-fullpage-btn"
                    onClick={() => {
                      navigateTo('/cart');
                      CartService.closeCart();
                    }}
                  >
                    View Full Cart Page (View All) →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

    </header>
  );
};
