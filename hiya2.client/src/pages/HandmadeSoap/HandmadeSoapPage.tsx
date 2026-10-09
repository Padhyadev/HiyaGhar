import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { MukhwasFilterSort } from '../../components/mukhwas/MukhwasFilterSort/MukhwasFilterSort';
import { MukhwasProductCard } from '../../components/mukhwas/MukhwasProductCard/MukhwasProductCard';
import { MukhwasTrustSection } from '../../components/mukhwas/MukhwasTrustSection/MukhwasTrustSection';
import { MukhwasCTASection } from '../../components/mukhwas/MukhwasCTASection/MukhwasCTASection';
import { ExploreCategoriesSection } from '../../components/common/ExploreCategoriesSection/ExploreCategoriesSection';
import { PremiumSidebar } from '../../components/common/PremiumSidebar/PremiumSidebar';
import { CategoriesMobileTrigger } from '../../components/common/PremiumSidebar/CategoriesMobileTrigger';
import { CartService } from '../../cart';
import { ProductService, type Product as ApiProduct } from '../../services/productService';
import { navigateTo } from '../../utils/navigation';
import { formatVariantLabel } from '../../utils/productFormat';
import { showToast } from '../../utils/alertService';
import './HandmadeSoapPage.css';

interface HandmadeSoapPageProps {
  onNavigateHome: () => void;
  onNavigateToDetail: (productId: string) => void;
}

export interface SoapProduct {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  shortDescription: string;
  tagline: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  discountTag: string;
  rating: number;
  reviewsCount: number;
  image: string;
  secondaryImage?: string;
  badge?: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  weightOptions: string[];
  variants?: any[];
  ingredients: string[];
}

export const fallbackHandmadeSoapProducts: SoapProduct[] = [
  {
    id: 'neem-aloe-soap',
    name: 'Neem & Aloe Vera Purifying Soap',
    category: 'herbal',
    categoryLabel: 'Ayurvedic Skincare',
    shortDescription: 'Purifying neem leaves with cold-pressed aloe vera gel & organic coconut oil for clear, acne-free skin.',
    tagline: 'Deeply purifying, anti-bacterial organic bath soap.',
    price: 120,
    originalPrice: 180,
    discountPercentage: 33,
    discountTag: '33% OFF',
    rating: 4.9,
    reviewsCount: 154,
    image: '/image/Soap/neem.webp',
    secondaryImage: '/image/lifestyle_bath.webp',
    badge: 'Best Seller',
    isBestSeller: true,
    weightOptions: ['100g'],
    variants: [],
    ingredients: ['Organic Neem Leaf Extract', 'Cold-Pressed Aloe Vera', 'Virgin Coconut Oil', 'Tea Tree Essential Oil', 'Natural Glycerin'],
  },
];

function mapApiToSoap(p: ApiProduct): SoapProduct {
  const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
  const weightOpts = p.variants?.map((v) => formatVariantLabel(v.variantName)) || [];
  const currentPrice = defaultVariant ? defaultVariant.price : p.basePrice;
  const origPrice = defaultVariant?.originalPrice || p.discountPrice || currentPrice;
  const discountPercentage = origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0;

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'herbal',
    categoryLabel: 'Ayurvedic Skincare',
    shortDescription: p.shortDescription || 'Organic cold-processed herbal soap bar.',
    tagline: p.shortDescription || 'Gentle nourishing bath bar.',
    price: currentPrice,
    originalPrice: origPrice,
    discountPercentage: discountPercentage,
    discountTag: discountPercentage > 0 ? `${discountPercentage}% OFF` : '',
    rating: p.rating || 4.8,
    reviewsCount: p.reviewCount || 100,
    image: p.mainImagePath || '/image/Soap/neem.webp',
    badge: p.isFeatured ? 'Best Seller' : undefined,
    isBestSeller: p.isFeatured,
    weightOptions: weightOpts.length > 0 ? weightOpts : ['100g'],
    variants: p.variants || [],
    ingredients: ['Organic Herbs', 'Virgin Coconut Oil', 'Essential Oils', 'Natural Glycerin'],
  };
}

export const HandmadeSoapPage: React.FC<HandmadeSoapPageProps> = ({
  onNavigateHome,
  onNavigateToDetail,
}) => {
  const [selectedSort, setSelectedSort] = useState<string>('featured');
  // Starts empty (not the static fallback) so the wrong product/image never
  // flashes on screen before the real catalog loads — see isLoadingProducts below.
  const [productsList, setProductsList] = useState<SoapProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  const productGridRef = useRef<HTMLDivElement>(null);

  // Fetch Handmade Soap products dynamically from API (CategoryId = 3)
  useEffect(() => {
    let isMounted = true;
    ProductService.getProducts(3).then((apiProducts: ApiProduct[]) => {
      if (!isMounted) return;
      // The static fallback is now only used if the live fetch genuinely came back
      // empty (e.g. backend unreachable) — a last resort, not the initial render.
      setProductsList(apiProducts && apiProducts.length > 0 ? apiProducts.map(mapApiToSoap) : fallbackHandmadeSoapProducts);
      setIsLoadingProducts(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...productsList];

    if (selectedSort === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (selectedSort === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (selectedSort === 'newest') {
      result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else if (selectedSort === 'bestselling') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [productsList, selectedSort]);

  const handleAddToCartCard = (product: SoapProduct, weight: string, _qty: number = 1, price?: number, originalPrice?: number) => {
    CartService.addItem({
      productId: product.id,
      name: `${product.name} (${weight})`,
      image: product.image,
      price: typeof price === 'number' ? price : product.price,
      originalPrice: typeof originalPrice === 'number' ? originalPrice : product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    showToast(`Added ${product.name} (${weight}) to your cart!`);
  };

  const handleBuyNowCard = (product: SoapProduct, weight: string, price?: number, originalPrice?: number) => {
    CartService.addItem({
      productId: product.id,
      name: `${product.name} (${weight})`,
      image: product.image,
      price: typeof price === 'number' ? price : product.price,
      originalPrice: typeof originalPrice === 'number' ? originalPrice : product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    navigateTo('/checkout');
  };

  return (
    <div className="hiyaghar-mukhwas-page-layout hiyaghar-handmade-soap-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-mukhwas-page-main">
        <div className="hiyaghar-handmade-soap-listing-view animate-fade-in">
          <MukhwasHero
            onNavigateHome={onNavigateHome}
            breadcrumbCurrent="Handmade Soap"
            title="Handmade Soap"
            bgImage="/image/Banner_image/Soap.webp"
          />

          <MukhwasFilterSort
            selectedCategory="all"
            onSelectCategory={() => { }}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            searchQuery=""
            onSearchChange={() => { }}
            totalResults={filteredProducts.length}
            productTypeName="Handmade Soap"
          >
            <CategoriesMobileTrigger />
          </MukhwasFilterSort>

          <section
            ref={productGridRef}
            className="hiyaghar-mukhwas-grid-section"
            aria-label="Handmade Soap Products Grid"
          >
            <div className="hiyaghar-container">
              <div className="hiyaghar-page-with-sidebar">
                <aside className="hiyaghar-sidebar-column">
                  <PremiumSidebar />
                </aside>
                <div className="hiyaghar-main-column">
                  {isLoadingProducts ? (
                    <div className="hiyaghar-mukhwas-products-grid">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="hiyaghar-mukhwas-card-skeleton" aria-hidden="true" />
                      ))}
                    </div>
                  ) : (
                  <div className="hiyaghar-mukhwas-products-grid">
                    {filteredProducts.map((product, index) => (
                      <MukhwasProductCard
                        key={product.id}
                        product={product as any}
                        index={index}
                        onNavigateToDetail={(id) => {
                          onNavigateToDetail(id);
                        }}
                        onAddToCart={(prod, weight, qty, price, origPrice) => handleAddToCartCard(prod as any, weight, qty, price, origPrice)}
                        onBuyNow={(prod, weight, price, origPrice) => handleBuyNowCard(prod as any, weight, price, origPrice)}
                      />
                    ))}
                  </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <MukhwasTrustSection
            items={[
              {
                id: 'pure-oils',
                title: 'Cold-Pressed Oils',
                description: 'Crafted with virgin coconut oil, neem extracts & pure aloe vera',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
              },
              {
                id: 'chemical-free',
                title: '100% Chemical Free',
                description: 'Free from parabens, SLS, silicones, and artificial foaming agents',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                ),
              },
              {
                id: 'gentle',
                title: 'Moisturizing & Gentle',
                description: 'Retains natural glycerin for soft, nourished and hydrated skin',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
              },
              {
                id: 'delivery',
                title: 'Fast & Secure Delivery',
                description: 'Freshly batched soaps delivered safely to your doorstep',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                ),
              },
            ]}
          />
          <ExploreCategoriesSection />
          <MukhwasCTASection
            badge="Pure Ayurvedic Bathing"
            heading="Explore Natural Handmade Soaps"
            subtext="Handcrafted cold-process bathing bars enriched with natural plant extracts, herbal goodness, and restorative essential oils."
            buttonText="Explore Soaps"
            mainImage="/image/Banner_image/Soap.webp"
            onShopNowClick={() => {
              if (productGridRef.current) {
                productGridRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};
