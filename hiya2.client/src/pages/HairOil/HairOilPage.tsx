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
  const origPrice = defaultVariant?.originalPrice || p.discountPrice || Math.round(currentPrice * 1.25);

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'haircare',
    categoryLabel: 'Ayurvedic Hair Care',
    shortDescription: p.shortDescription || 'Ayurvedic herbal hair oil for scalp nourishment.',
    tagline: p.shortDescription || 'Cold-pressed natural hair elixir.',
    price: currentPrice,
    originalPrice: origPrice,
    discountPercentage: origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 20,
    discountTag: `${origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 20}% OFF`,
    rating: p.rating || 4.9,
    reviewsCount: p.reviewCount || 150,
    image: p.mainImagePath || '/image/Hair Oil/hair oil.webp',
    badge: p.isFeatured ? 'Best Seller' : undefined,
    isBestSeller: p.isFeatured,
    weightOptions: weightOpts.length > 0 ? weightOpts : ['100ml', '200ml'],
    ingredients: ['Bhringraj', 'Organic Amla', 'Brahmi', 'Cold-Pressed Sesame Oil', 'Rosemary Oil'],
  };
}

export const HairOilPage: React.FC<HairOilPageProps> = ({
  onNavigateHome,
  onNavigateToDetail,
}) => {
  const [selectedSort, setSelectedSort] = useState<string>('featured');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const handleAddToCartCard = (product: HairOilProduct, weight: string) => {
    CartService.addItem({
      productId: product.id,
      name: `${product.name} (${weight})`,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    showToast(`🛒 Added ${product.name} (${weight}) to your cart!`);
  };

  const handleBuyNowCard = (product: HairOilProduct, weight: string) => {
    CartService.addItem({
      productId: product.id,
      name: `${product.name} (${weight})`,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    navigateTo('/checkout');
  };



  return (
    <div className="hiyaghar-mukhwas-page-layout hiyaghar-hair-oil-page-layout">
      <Header />

      <main className="hiyaghar-mukhwas-page-main">
        {toastMessage && (
          <div className="hiyaghar-mukhwas-toast" role="status">
            <span>{toastMessage}</span>
          </div>
        )}

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
                          onAddToCart={(prod, weight) => handleAddToCartCard(prod as any, weight)}
                          onBuyNow={(prod, weight) => handleBuyNowCard(prod as any, weight)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <MukhwasTrustSection />
          <ExploreCategoriesSection />
          <MukhwasCTASection onShopNowClick={() => navigateTo('/mukhwas')} />
        </div>
      </main>

      <Footer />
    </div>
  );
};
