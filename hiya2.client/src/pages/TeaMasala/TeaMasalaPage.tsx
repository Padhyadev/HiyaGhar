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
import './TeaMasalaPage.css';

interface TeaMasalaPageProps {
  onNavigateHome: () => void;
  onNavigateToDetail: (productId: string) => void;
}

export interface TeaMasalaProduct {
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

export const fallbackTeaMasalaProductsData: TeaMasalaProduct[] = [
  {
    id: 'tea-masala',
    name: 'Tea Masala',
    category: 'special',
    categoryLabel: 'Royal Chai Spice',
    shortDescription: 'Hand-roasted green cardamom, Kashmiri saffron threads, sun-dried ginger & cloves for authentic golden Chai.',
    tagline: 'Wood-roasted cardamom, Kashmiri saffron, ginger & cloves for authentic golden Chai.',
    price: 180,
    originalPrice: 300,
    discountPercentage: 40,
    discountTag: '40% OFF',
    rating: 4.9,
    reviewsCount: 198,
    image: '/image/Tea Masala/TEA MASALA.webp',
    secondaryImage: '/image/lifestyle_chai.webp',
    badge: 'Best Seller',
    isBestSeller: true,
    weightOptions: ['50g', '100g', '200g'],
    variants: [],
    ingredients: ['Kashmiri Saffron', 'Green Cardamom', 'Sun-Dried Ginger', 'Cinnamon', 'Cloves', 'Nutmeg'],
  },
];

function mapApiToTeaMasala(p: ApiProduct): TeaMasalaProduct {
  const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
  const weightOpts = p.variants?.map((v) => formatVariantLabel(v.variantName)) || [];
  const currentPrice = defaultVariant ? defaultVariant.price : p.basePrice;
  const origPrice = defaultVariant?.originalPrice || p.discountPrice || currentPrice;
  const discountPercentage = origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0;

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'special',
    categoryLabel: 'Royal Chai Spice',
    shortDescription: p.shortDescription || 'Aromatic authentic tea masala spice blend.',
    tagline: p.shortDescription || 'Hand-crafted royal chai spice.',
    price: currentPrice,
    originalPrice: origPrice,
    discountPercentage: discountPercentage,
    discountTag: discountPercentage > 0 ? `${discountPercentage}% OFF` : '',
    rating: p.rating || 4.9,
    reviewsCount: p.reviewCount || 90,
    image: p.mainImagePath || '/image/Tea Masala/TEA MASALA.webp',
    badge: p.isFeatured ? 'Best Seller' : undefined,
    isBestSeller: p.isFeatured,
    weightOptions: weightOpts.length > 0 ? weightOpts : ['50g', '100g'],
    variants: p.variants || [],
    ingredients: ['Green Cardamom', 'Sun-Dried Ginger', 'Cloves', 'Cinnamon', 'Saffron'],
  };
}

export const TeaMasalaPage: React.FC<TeaMasalaPageProps> = ({
  onNavigateHome,
  onNavigateToDetail,
}) => {
  const [selectedSort, setSelectedSort] = useState<string>('featured');
  // Starts empty (not the static fallback) so the wrong product/image never
  // flashes on screen before the real catalog loads — see isLoadingProducts below.
  const [productsList, setProductsList] = useState<TeaMasalaProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  const productGridRef = useRef<HTMLDivElement>(null);

  // Fetch Tea Masala products dynamically from API (CategoryId = 2)
  useEffect(() => {
    let isMounted = true;
    ProductService.getProducts(2).then((apiProducts: ApiProduct[]) => {
      if (!isMounted) return;
      // The static fallback is now only used if the live fetch genuinely came back
      // empty (e.g. backend unreachable) — a last resort, not the initial render.
      setProductsList(apiProducts && apiProducts.length > 0 ? apiProducts.map(mapApiToTeaMasala) : fallbackTeaMasalaProductsData);
      setIsLoadingProducts(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sorting Logic
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

  const handleAddToCartCard = (product: TeaMasalaProduct, weight: string, _qty: number = 1, price?: number, originalPrice?: number) => {
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

  const handleBuyNowCard = (product: TeaMasalaProduct, weight: string, price?: number, originalPrice?: number) => {
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
    <div className="hiyaghar-mukhwas-page-layout hiyaghar-tea-masala-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-mukhwas-page-main">
        <div className="hiyaghar-tea-masala-listing-view animate-fade-in">
          <MukhwasHero
            onNavigateHome={onNavigateHome}
            breadcrumbCurrent="Tea Masala"
            title="Tea Masala"
            bgImage="/image/Banner_image/Tea-Masala.webp"
          />

          <MukhwasFilterSort
            selectedCategory="all"
            onSelectCategory={() => { }}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            searchQuery=""
            onSearchChange={() => { }}
            totalResults={filteredProducts.length}
            productTypeName="Tea Masala"
          >
            <CategoriesMobileTrigger />
          </MukhwasFilterSort>

          <section
            ref={productGridRef}
            className="hiyaghar-mukhwas-grid-section"
            aria-label="Tea Masala Products Grid"
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
                id: 'whole-spices',
                title: 'Hand-Picked Whole Spices',
                description: 'Sun-dried green cardamom, cloves, cinnamon, dry ginger & nutmeg',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
              },
              {
                id: 'pure-blend',
                title: '100% Pure & Preservative Free',
                description: 'Ground in small batches without artificial flavors or fillers',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                ),
              },
              {
                id: 'aroma',
                title: 'Rich Heritage Aroma',
                description: 'Handcrafted royal spice ratio for an invigorating cup of chai',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
              },
              {
                id: 'delivery',
                title: 'Aroma-Locked Packaging',
                description: 'Sealed in moisture-proof packaging to preserve essential oils',
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
            badge="Royal Chai Experience"
            heading="Discover Authentic Tea Masala"
            subtext="Handcrafted with premium warming spices to bring an unforgettable aroma and comforting warmth to your daily chai."
            buttonText="Explore Tea Masala"
            mainImage="/image/TEA MASALA.webp"
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
