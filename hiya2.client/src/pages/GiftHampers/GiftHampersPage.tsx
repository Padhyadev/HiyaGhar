import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { MukhwasProductCard } from '../../components/mukhwas/MukhwasProductCard/MukhwasProductCard';
import type { MukhwasProduct } from '../../data/mukhwasData';
import { CartService } from '../../cart';
import { navigateTo } from '../../utils/navigation';
import { GiftHamperService, type GiftHamperOccasion, type GiftHamperProduct as ApiGiftHamperProduct } from '../../services/giftHamperService';
import { formatVariantLabel } from '../../utils/productFormat';
import './GiftHampersPage.css';

interface GiftHampersPageProps {
  onNavigateHome: () => void;
  onNavigateToDetail: (productId: string) => void;
}

function mapApiToMukhwas(p: ApiGiftHamperProduct): MukhwasProduct {
  const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
  const weightOpts = p.variants?.map((v) => formatVariantLabel(v.variantName)) || [];
  const currentPrice = defaultVariant ? defaultVariant.price : p.basePrice;
  const origPrice = defaultVariant?.originalPrice || p.discountPrice || Math.round(currentPrice * 1.15);

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'special',
    categoryLabel: 'Gift Hampers',
    price: currentPrice,
    originalPrice: origPrice,
    discountPercentage: origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 12,
    rating: p.rating || 4.9,
    reviewsCount: p.reviewCount || 0,
    image: p.mainImagePath || p.images?.[0]?.imagePath || '/image/HerosectionImage1.webp',
    secondaryImage: p.images?.[1]?.imagePath,
    shortDescription: p.shortDescription || 'Curated gift hamper, handcrafted with care.',
    longDescription: p.shortDescription || 'A thoughtfully curated hamper for every occasion.',
    weightOptions: weightOpts.length > 0 ? weightOpts : ['Gift Box'],
    variants: p.variants || [],
    nutritionalInfo: { energy: '', carbs: '', protein: '', fat: '', fiber: '' },
  };
}

export const GiftHampersPage: React.FC<GiftHampersPageProps> = ({
  onNavigateHome,
  onNavigateToDetail,
}) => {
  const [occasions, setOccasions] = useState<GiftHamperOccasion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getCategoryFromUrl = (): string => {
    try {
      const search = window.location.search;
      const hash = window.location.hash;
      const urlStr = search || hash;
      if (urlStr.includes('category=')) {
        return urlStr.split('category=')[1]?.split('&')[0]?.toLowerCase() || 'all';
      }
    } catch {
      // fallback
    }
    return 'all';
  };

  const [activeCategory, setActiveCategory] = useState<string>(getCategoryFromUrl);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    GiftHamperService.getOccasions(true).then((data) => {
      setOccasions(data);
      setIsLoading(false);
    });

    const handlePopState = () => {
      setActiveCategory(getCategoryFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectCategory = (slug: string) => {
    setActiveCategory(slug);
    try {
      const newUrl = slug === 'all' ? '/gift-hampers' : `/gift-hampers?category=${slug}`;
      window.history.replaceState(null, '', newUrl);
    } catch {
      // fallback
    }
  };

  const currentOccasion = useMemo(
    () => occasions.find((o) => o.slug === activeCategory) || null,
    [occasions, activeCategory]
  );

  // Every occasion's products, merged and de-duplicated by product id (a
  // product can belong to more than one occasion).
  const allProducts = useMemo(() => {
    const seen = new Map<number, ApiGiftHamperProduct>();
    occasions.forEach((o) => o.products.forEach((p) => seen.set(p.id, p)));
    return Array.from(seen.values());
  }, [occasions]);

  const filteredGifts = useMemo(() => {
    const source = activeCategory === 'all' ? allProducts : currentOccasion?.products || [];
    return source.map(mapApiToMukhwas);
  }, [activeCategory, allProducts, currentOccasion]);

  const sortedGifts = useMemo(() => {
    const list = [...filteredGifts];
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [filteredGifts, sortBy]);

  const handleAddToCart = (product: MukhwasProduct, weight: string) => {
    CartService.addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    showToast(`🛒 Added ${product.name} to your cart!`);
  };

  const handleBuyNow = (product: MukhwasProduct, weight: string) => {
    CartService.addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    navigateTo('/checkout');
  };

  const featuredOccasion = occasions[0];
  const restOccasions = occasions.slice(1);

  return (
    <div className="hiyaghar-gift-hampers-page-layout">
      {/* Global Header */}
      <Header />

      <main className="hiyaghar-gift-hampers-main">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="hiyaghar-mukhwas-toast" role="status">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. HERO BANNER */}
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          title="Gift Hampers"
          breadcrumbCurrent="Gifting"
          bgImage="/image/gifting_hero_banner.webp"
        />

        {/* 2. CHOOSE YOUR OCCASION HEADER */}
        <section className="hiyaghar-gifting-header-section">
          <div className="hiyaghar-container text-center">
            <div className="hiyaghar-occasion-eyebrow-wrapper" style={{ marginTop: '0' }}>
              <span className="hiyaghar-occasion-eyebrow">Choose Your Occasion</span>
            </div>
          </div>
        </section>

        {/* 2. OCCASION GRID — ASYMMETRIC 5-CARD GALLERY (admin-managed occasions) */}
        {occasions.length > 0 && (
          <section className="hiyaghar-occasion-grid-section" aria-label="Gifting Category Selector">
            <div className="hiyaghar-container">
              <div className="hiyaghar-asymmetric-5card-grid">
                {featuredOccasion && (
                  <div
                    key={featuredOccasion.id}
                    className={`hiyaghar-5card-item is-featured ${activeCategory === featuredOccasion.slug ? 'is-active' : ''}`}
                    onClick={() => handleSelectCategory(activeCategory === featuredOccasion.slug ? 'all' : featuredOccasion.slug)}
                    role="button"
                    tabIndex={0}
                  >
                    {activeCategory === featuredOccasion.slug && (
                      <div className="hiyaghar-card-active-badge"><span>✓ Selected</span></div>
                    )}
                    <img src={featuredOccasion.bannerImagePath || '/uploads/Noimage.png'} alt={featuredOccasion.name} className="card-bg-image" />
                    <div className="card-overlay" />
                    <div className="card-content">
                      <h3 className="card-title">{featuredOccasion.name}</h3>
                    </div>
                  </div>
                )}

                {restOccasions.length > 0 && (
                  <div className="hiyaghar-5card-right-grid">
                    {restOccasions.map((o) => {
                      const isActive = activeCategory === o.slug;
                      return (
                        <div
                          key={o.id}
                          className={`hiyaghar-5card-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleSelectCategory(isActive ? 'all' : o.slug)}
                          role="button"
                          tabIndex={0}
                        >
                          {isActive && <div className="hiyaghar-card-active-badge"><span>✓ Selected</span></div>}
                          <img src={o.bannerImagePath || '/uploads/Noimage.png'} alt={o.name} className="card-bg-image" />
                          <div className="card-overlay" />
                          <div className="card-content">
                            <h3 className="card-title">{o.name}</h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 3. PRODUCT LISTING SECTION */}
        <section className="hiyaghar-gh-products-section" aria-label="Gifting Products">
          <div className="hiyaghar-container">
            {/* Filter Bar with Heading, Count & Sort */}
            <div className="hiyaghar-gh-products-bar">
              <div className="products-heading-group">
                <h2 className="hiyaghar-gh-products-heading">
                  {activeCategory === 'all' ? 'Curated Gifts' : currentOccasion?.name || 'Curated Gifts'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <p className="hiyaghar-gh-products-count">
                    Showing {sortedGifts.length} {sortedGifts.length === 1 ? 'product' : 'products'}
                  </p>
                  {activeCategory !== 'all' && (
                    <button
                      type="button"
                      className="hiyaghar-clear-filter-btn"
                      onClick={() => handleSelectCategory('all')}
                    >
                      ✕ Show All Gifts
                    </button>
                  )}
                </div>
              </div>

              <div className="hiyaghar-gh-sort-wrapper">
                <label htmlFor="sort-select" className="hiyaghar-sort-lbl">Sort by:</label>
                <select
                  id="sort-select"
                  className="hiyaghar-gh-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="hiyaghar-mukhwas-empty-state">
                <p className="hiyaghar-empty-desc">Loading gift hampers…</p>
              </div>
            ) : sortedGifts.length > 0 ? (
              <div className="hiyaghar-mukhwas-products-grid">
                {sortedGifts.map((product, index) => (
                  <MukhwasProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onNavigateToDetail={onNavigateToDetail}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                  />
                ))}
              </div>
            ) : (
              <div className="hiyaghar-mukhwas-empty-state">
                <div className="hiyaghar-empty-icon">🎁</div>
                <h3 className="hiyaghar-empty-title">No gift hampers found in this category</h3>
                <p className="hiyaghar-empty-desc">
                  Try exploring all gifts to discover our complete curated collection.
                </p>
                <button
                  type="button"
                  className="hiyaghar-btn-primary"
                  onClick={() => handleSelectCategory('all')}
                >
                  Explore All Gifts →
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
