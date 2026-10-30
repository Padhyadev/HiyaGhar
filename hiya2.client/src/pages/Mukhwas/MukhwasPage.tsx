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
import type { MukhwasProduct } from '../../types/mukhwas';
import { ProductService, type Product as ApiProduct } from '../../services/productService';
import { formatVariantLabel, getVariantImages, NO_IMAGE } from '../../utils/productFormat';
import { showToast } from '../../utils/alertService';
import './MukhwasPage.css';

interface MukhwasPageProps {
  onNavigateHome: () => void;
  onNavigateToDetail: (productId: string) => void;
}

function mapApiToMukhwas(p: ApiProduct): MukhwasProduct {
  const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
  const weightOpts = p.variants?.map((v) => formatVariantLabel(v.variantName)) || [];
  const currentPrice = defaultVariant ? defaultVariant.price : p.basePrice;
  const origPrice = defaultVariant?.originalPrice || p.discountPrice || currentPrice;
  const discountPercentage = origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0;

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'special',
    categoryLabel: 'Special / Premium',
    price: currentPrice,
    originalPrice: origPrice,
    discountPercentage: discountPercentage,
    rating: p.rating || 4.9,
    reviewsCount: p.reviewCount || 120,
    image: p.mainImagePath ? p.mainImagePath + "?v=2" : NO_IMAGE,
    secondaryImage: getVariantImages(p, defaultVariant)[1],
    shortDescription: p.shortDescription || 'Authentic handcrafted natural mukhwas.',
    longDescription: p.fullDescription || '100% natural, tobacco-free, digestive mouth freshener.',
    weightOptions: weightOpts.length > 0 ? weightOpts : ['100g', '250g'],
    variants: p.variants || [],
    badge: p.isFeatured ? 'Best Seller' : undefined,
    isBestSeller: p.isFeatured,
    isNewArrival: false,
    ingredients: ['Natural Betel Leaves', 'Gulkand', 'Dry Dates', 'Digestive Spices'],
    benefits: ['100% Natural freshness', 'Aids post-meal digestion', 'Tobacco-free'],
    nutritionalInfo: { energy: '380 kcal', carbs: '65 g', protein: '5.5 g', fat: '8 g', fiber: '12 g' },
  };
}

let cachedMukhwasList: MukhwasProduct[] = [];

export const MukhwasPage: React.FC<MukhwasPageProps> = ({
  onNavigateHome,
  onNavigateToDetail,
}) => {
  const [selectedSort, setSelectedSort] = useState<string>('featured');
  const [productsList, setProductsList] = useState<MukhwasProduct[]>(cachedMukhwasList);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(cachedMukhwasList.length === 0);

  const productGridRef = useRef<HTMLDivElement>(null);

  // Fetch Mukhwas products dynamically from backend API (CategoryId = 1 for Mukhwas)
  useEffect(() => {
    let isMounted = true;
    ProductService.getProducts(1).then((apiProducts: ApiProduct[]) => {
      if (!isMounted) return;
      const mapped = (apiProducts || []).map(mapApiToMukhwas);
      cachedMukhwasList = mapped;
      setProductsList(mapped);
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

  const handleAddToCart = (product: MukhwasProduct, weight: string, _qty: number = 1, price?: number, originalPrice?: number) => {
    CartService.addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: typeof price === 'number' ? price : product.price,
      originalPrice: typeof originalPrice === 'number' ? originalPrice : product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    showToast(`Added ${product.name} (${weight}) to your cart!`, 'success');
  };

  const handleBuyNow = (product: MukhwasProduct, weight: string, price?: number, originalPrice?: number) => {
    CartService.buyNow({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: typeof price === 'number' ? price : product.price,
      originalPrice: typeof originalPrice === 'number' ? originalPrice : product.originalPrice,
      weight: weight,
      quantity: 1,
    });
  };

  const scrollToGrid = () => {
    if (productGridRef.current) {
      productGridRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hiyaghar-mukhwas-page-layout">
      {/* Global Brand Header */}
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-mukhwas-page-main">
        {/* 1. Hero / Page Header */}
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          totalProductsCount={productsList.length}
        />

        {/* 2. Filter & Sort Bar */}
        <div ref={productGridRef}>
          <MukhwasFilterSort
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            totalResults={filteredProducts.length}
          >
            <CategoriesMobileTrigger />
          </MukhwasFilterSort>
        </div>

        {/* 3. Product Cards Grid */}
        <section className="hiyaghar-mukhwas-grid-section" aria-label="Mukhwas Products Grid">
          <div className="hiyaghar-container">
            <div className="hiyaghar-page-with-sidebar">
              <aside className="hiyaghar-sidebar-column">
                <PremiumSidebar />
              </aside>
              <div className="hiyaghar-main-column">
                {isLoadingProducts ? (
                  <div className="hiyaghar-mukhwas-products-grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="hiyaghar-mukhwas-card-skeleton" aria-hidden="true" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="hiyaghar-no-products-found">
                    <h3>No products found</h3>
                    <p>We couldn't load products right now. Please refresh the page or try again shortly.</p>
                  </div>
                ) : (
                  <div className="hiyaghar-mukhwas-products-grid">
                    {filteredProducts.map((product, index) => (
                      <MukhwasProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        onNavigateToDetail={onNavigateToDetail}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Trust Banner Section */}
        <MukhwasTrustSection />

        {/* 5. Explore Other Categories */}
        <ExploreCategoriesSection />

        {/* 6. Bottom CTA Section */}
        <MukhwasCTASection onShopNowClick={scrollToGrid} />
      </main>

      {/* Global Brand Footer */}
      <Footer />
    </div>
  );
};
