import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { WishlistService } from '../../services/wishlistService';
import type { WishlistItem } from '../../services/wishlistService';
import { CartService } from '../../cart';
import { mukhwasProducts } from '../../data/mukhwasData';
import type { MukhwasProduct } from '../../data/mukhwasData';
import { ProductService, type Product as ApiProduct } from '../../services/productService';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { MukhwasProductCard } from '../../components/mukhwas/MukhwasProductCard/MukhwasProductCard';
import { showToast } from '../../utils/alertService';
import { formatVariantLabel } from '../../utils/productFormat';
import './WishlistPage.css';

interface WishlistPageProps {
  onNavigateHome: () => void;
  onNavigateMukhwas: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onNavigateHome,
  onNavigateMukhwas,
}) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(WishlistService.getItems());
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    const unsubscribe = WishlistService.subscribe(() => setWishlistItems(WishlistService.getItems()));
    window.scrollTo(0, 0);

    ProductService.getProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setApiProducts(prods);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="hiyaghar-wishlist-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-wishlist-main">

        <MukhwasHero
          onNavigateHome={onNavigateHome}
          breadcrumbCurrent="Wishlist"
          title="Your Wishlist"
          description={wishlistItems.length > 0 ? `${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved for later` : undefined}
        />

        <div className="hiyaghar-container hiyaghar-wishlist-content">
          {wishlistItems.length === 0 ? (
            <div className="hiyaghar-wishlist-empty-state">
              <h3 className="empty-title">Your wishlist is empty</h3>
              <p className="empty-desc">Save your favourite products and come back anytime.</p>
              <button
                type="button"
                className="hiyaghar-panel-btn primary"
                onClick={onNavigateMukhwas}
              >
                Explore Products →
              </button>
            </div>
          ) : (
            <div className="hiyaghar-wishlist-grid">
              {wishlistItems.map((item, index) => {
                const liveApiMatch = apiProducts.find((p) => p.id.toString() === item.productId.toString());
                const staticMatch = mukhwasProducts.find((p: MukhwasProduct) => p.id === item.productId);

                const weightOpts = liveApiMatch?.variants
                  ? liveApiMatch.variants.map((v) => formatVariantLabel(v.variantName))
                  : (staticMatch?.weightOptions || [item.weight || '100g']);

                const productObj: MukhwasProduct = {
                  id: item.productId,
                  name: liveApiMatch?.productName || item.name || staticMatch?.name || 'Product',
                  category: (staticMatch?.category as any) || 'special',
                  categoryLabel: liveApiMatch?.category?.categoryName || staticMatch?.categoryLabel || 'Speciality Product',
                  shortDescription: liveApiMatch?.shortDescription || staticMatch?.shortDescription || '',
                  longDescription: liveApiMatch?.fullDescription || staticMatch?.longDescription || '',
                  price: item.price,
                  originalPrice: item.originalPrice || liveApiMatch?.discountPrice || staticMatch?.originalPrice || item.price,
                  discountPercentage: 0,
                  weightOptions: weightOpts.length > 0 ? weightOpts : [item.weight || '100g'],
                  variants: liveApiMatch?.variants || staticMatch?.variants || [],
                  selectedWeight: item.weight || undefined,
                  image: item.image || liveApiMatch?.mainImagePath || staticMatch?.image || '/uploads/Noimage.png',
                  rating: liveApiMatch?.rating || staticMatch?.rating || 4.9,
                  reviewsCount: liveApiMatch?.reviewCount || staticMatch?.reviewsCount || 50,
                  isBestSeller: liveApiMatch?.isFeatured || staticMatch?.isBestSeller || false,
                  badge: undefined,
                  benefits: staticMatch?.benefits || [],
                  ingredients: staticMatch?.ingredients || [],
                  nutritionalInfo: staticMatch?.nutritionalInfo || {
                    energy: '',
                    carbs: '',
                    protein: '',
                    fat: '',
                    fiber: '',
                  },
                };

                return (
                  <MukhwasProductCard
                    key={item.id}
                    product={productObj}
                    index={index}
                    onNavigateToDetail={(productId) => {
                      window.location.hash = `#product/${productId}`;
                    }}
                    onAddToCart={(prod, weight, qty) => {
                      const itemId = CartService.addItem({
                        productId: prod.id,
                        name: prod.name,
                        image: prod.image,
                        price: prod.price,
                        originalPrice: prod.originalPrice,
                        weight: weight,
                        quantity: qty,
                      });
                      if (itemId) {
                        showToast(`Added ${prod.name} (${weight}) to cart!`);
                      }
                    }}
                    onBuyNow={(prod, weight) => {
                      const itemId = CartService.addItem({
                        productId: prod.id,
                        name: prod.name,
                        image: prod.image,
                        price: prod.price,
                        originalPrice: prod.originalPrice,
                        weight: weight,
                        quantity: 1,
                      });
                      if (itemId) {
                        window.location.hash = '#checkout';
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
