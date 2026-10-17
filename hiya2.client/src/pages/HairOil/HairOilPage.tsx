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
import './HairOilPage.css';

interface HairOilPageProps {
  onNavigateHome: () => void;
  onNavigateToDetail: (productId: string) => void;
}

export interface HairOilProduct {
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

export const fallbackHairOilProductsData: HairOilProduct[] = [
  {
    id: 'keshvedaam-hair-oil',
    name: 'Keshvedaam Herbal Hair Oil',
    category: 'haircare',
    categoryLabel: 'Ayurvedic Hair Care',
    shortDescription: 'Pure cold-pressed sesame & coconut oil infused with Bhringraj, Amla, Brahmi & 14 rare Ayurvedic herbs to control hair fall and boost growth.',
    tagline: 'Royal 14-herb infusion for thick, strong & shiny hair.',
    price: 249,
    originalPrice: 399,
    discountPercentage: 38,
    discountTag: '38% OFF',
    rating: 4.9,
    reviewsCount: 210,
    image: '/image/Hair Oil/hair oil.webp',
    secondaryImage: '/image/lifestyle_hair.webp',
    badge: 'Best Seller',
    isBestSeller: true,
    weightOptions: ['200ml'],
    variants: [],
    ingredients: [
      'Bhringraj (King of Hair)',
      'Organic Amla',
      'Brahmi Extract',
      'Cold-Pressed Sesame Oil',
      'Virgin Coconut Oil',
      'Rosemary Essential Oil',
      'Neem Leaves',
      'Hibiscus Petals',
    ],
  },
];

function mapApiToHairOil(p: ApiProduct): HairOilProduct {
  const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
  const weightOpts = p.variants?.map((v) => formatVariantLabel(v.variantName)) || [];
  const currentPrice = defaultVariant ? defaultVariant.price : p.basePrice;
  const origPrice = defaultVariant?.originalPrice || p.discountPrice || currentPrice;
  const discountPercentage = origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0;

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'haircare',
    categoryLabel: 'Ayurvedic Hair Care',
    shortDescription: p.shortDescription || 'Ayurvedic herbal hair oil for scalp nourishment.',
    tagline: p.shortDescription || 'Cold-pressed natural hair elixir.',
    price: currentPrice,
    originalPrice: origPrice,
    discountPercentage: discountPercentage,
    discountTag: discountPercentage > 0 ? `${discountPercentage}% OFF` : '',
    rating: p.rating || 4.9,
    reviewsCount: p.reviewCount || 150,
    image: p.mainImagePath || '/image/Hair Oil/hair oil.webp',
    badge: p.isFeatured ? 'Best Seller' : undefined,
    isBestSeller: p.isFeatured,
    weightOptions: weightOpts.length > 0 ? weightOpts : ['100ml', '200ml'],
    variants: p.variants || [],
    ingredients: ['Bhringraj', 'Organic Amla', 'Brahmi', 'Cold-Pressed Sesame Oil', 'Rosemary Oil'],
  };
}

export const HairOilPage: React.FC<HairOilPageProps> = ({
  onNavigateHome,
  onNavigateToDetail,
}) => {
  const [selectedSort, setSelectedSort] = useState<string>('featured');
  // Starts empty (not the static fallback) so the wrong product/image never
  // flashes on screen before the real catalog loads — see isLoadingProducts below.
  const [productsList, setProductsList] = useState<HairOilProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  const productGridRef = useRef<HTMLDivElement>(null);

  // Fetch Hair Oil products dynamically from API (CategoryId = 4)
  useEffect(() => {
    let isMounted = true;
    ProductService.getProducts(4).then((apiProducts: ApiProduct[]) => {
      if (!isMounted) return;
      // The static fallback is now only used if the live fetch genuinely came back
      // empty (e.g. backend unreachable) — a last resort, not the initial render.
      setProductsList(apiProducts && apiProducts.length > 0 ? apiProducts.map(mapApiToHairOil) : fallbackHairOilProductsData);
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

  const handleAddToCartCard = (product: HairOilProduct, weight: string, _qty: number = 1, price?: number, originalPrice?: number) => {
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

  const handleBuyNowCard = (product: HairOilProduct, weight: string, price?: number, originalPrice?: number) => {
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
    <div className="hiyaghar-mukhwas-page-layout hiyaghar-hair-oil-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-mukhwas-page-main">
        <div className="hiyaghar-hair-oil-listing-view animate-fade-in">
          <MukhwasHero
            onNavigateHome={onNavigateHome}
            breadcrumbCurrent="Hair Oil"
            title="Hair Oil"
            bgImage="/image/Banner_image/Hair_Oil.webp"
          />

          <MukhwasFilterSort
            selectedCategory="all"
            onSelectCategory={() => { }}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            searchQuery=""
            onSearchChange={() => { }}
            totalResults={filteredProducts.length}
            productTypeName="Hair Oil"
          >
            <CategoriesMobileTrigger />
          </MukhwasFilterSort>

          <section
            ref={productGridRef}
            className="hiyaghar-mukhwas-grid-section"
            aria-label="Hair Oil Products Grid"
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
                id: 'ayurvedic-herbs',
                title: '14+ Ayurvedic Herbs',
                description: 'Infused with Bhringraj, Amla, Brahmi, Hibiscus & Methi',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
              },
              {
                id: 'cold-pressed',
                title: 'Cold-Pressed Base Oils',
                description: 'Pure cold-pressed sesame and coconut oils for deep scalp absorption',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                ),
              },
              {
                id: 'chemical-free',
                title: 'Zero Mineral Oil & Silicones',
                description: '100% natural nourishing formula without heavy artificial additives',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
              },
              {
                id: 'delivery',
                title: 'Safe Leak-Proof Packaging',
                description: 'Secure flip/dropper cap bottles for convenient, mess-free usage',
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
            badge="Ayurvedic Scalp & Hair Therapy"
            heading="Discover Pure Herbal Hair Oil"
            subtext="Handcrafted with time-honored Ayurvedic botanical infusions to nourish your scalp, strengthen hair roots, and promote natural shine."
            buttonText="Explore Hair Oil"
            mainImage="/image/Banner_image/Hair_Oil.webp"
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
