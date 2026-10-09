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

  const handleAddToCartCard = (product: TeaMasalaProduct, weight: string) => {
    CartService.addItem({
      productId: product.id,
      name: `${product.name} (${weight})`,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: weight,
      quantity: 1,
    });

    showToast(`Added ${product.name} (${weight}) to your cart!`);
  };

  const handleBuyNowCard = (product: TeaMasalaProduct, weight: string) => {
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
