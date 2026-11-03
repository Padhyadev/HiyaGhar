import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { WishlistService } from '../../services/wishlistService';
import type { WishlistItem } from '../../services/wishlistService';
import { CartService } from '../../cart';
import type { MukhwasProduct } from '../../types/mukhwas';
import { ProductService, type Product as ApiProduct } from '../../services/productService';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { MukhwasProductCard } from '../../components/mukhwas/MukhwasProductCard/MukhwasProductCard';
import { showToast } from '../../utils/alertService';
import { navigateTo } from '../../utils/navigation';
import { findVariantByLabel } from '../../services/cartApiService';
import { formatVariantLabel, getVariantImages, NO_IMAGE } from '../../utils/productFormat';
import './WishlistPage.css';

interface WishlistPageProps {
  onNavigateHome: () => void;
  onNavigateMukhwas: () => void;
  onNavigateToDetail?: (productId: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onNavigateHome,
  onNavigateMukhwas,
  onNavigateToDetail,
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
                const cleanWeight = formatVariantLabel(item.weight);
                const liveVariant = liveApiMatch?.variants?.length
                  ? (findVariantByLabel(liveApiMatch.variants, cleanWeight) || findVariantByLabel(liveApiMatch.variants, item.weight || ''))
                  : undefined;
                const defaultVariant = liveApiMatch?.variants?.find((v) => v.isDefault) || liveApiMatch?.variants?.[0];
                const activeVar = liveVariant || defaultVariant;

                const livePrice = activeVar
                  ? activeVar.price
                  : (liveApiMatch?.discountPrice ?? liveApiMatch?.basePrice ?? item.price);
                const liveOriginalPrice = activeVar
                  ? (activeVar.originalPrice || activeVar.price)
                  : (liveApiMatch?.discountPrice != null && liveApiMatch.basePrice > livePrice ? liveApiMatch.basePrice : (item.originalPrice || Math.round(livePrice * 1.25)));
                const discountPercentage = liveOriginalPrice > livePrice
                  ? Math.round(((liveOriginalPrice - livePrice) / liveOriginalPrice) * 100)
                  : 0;

                const weightOpts = liveApiMatch?.variants?.length
                  ? liveApiMatch.variants.map((v) => formatVariantLabel(v.variantName))
                  : [cleanWeight || '100g'];

                const mainImg = liveApiMatch ? (getVariantImages(liveApiMatch, activeVar)[0] || liveApiMatch.mainImagePath) : item.image;
                const secImg = liveApiMatch ? getVariantImages(liveApiMatch, activeVar)[1] : undefined;

                const productObj: MukhwasProduct = {
                  id: item.productId,
                  name: liveApiMatch?.productName || item.name || 'Product',
                  category: 'special',
                  categoryLabel: liveApiMatch?.category?.categoryName || 'Speciality Product',
                  shortDescription: liveApiMatch?.shortDescription || '',
                  longDescription: liveApiMatch?.fullDescription || '',
                  price: livePrice,
                  originalPrice: liveOriginalPrice,
                  discountPercentage: discountPercentage,
                  weightOptions: weightOpts.length > 0 ? weightOpts : [cleanWeight || '100g'],
                  variants: liveApiMatch?.variants || [],
                  selectedWeight: cleanWeight || undefined,
                  image: mainImg || NO_IMAGE,
                  secondaryImage: secImg,
                  rating: liveApiMatch?.rating || 4.9,
                  reviewsCount: liveApiMatch?.reviewCount || 50,
                  isBestSeller: liveApiMatch?.isFeatured || false,
                  badge: liveApiMatch?.isFeatured ? 'Best Seller' : undefined,
                  benefits: [],
                  ingredients: [],
                  nutritionalInfo: {
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
                      if (onNavigateToDetail) {
                        onNavigateToDetail(productId);
                      } else {
                        navigateTo('/product/' + productId);
                      }
                    }}
                    onAddToCart={(prod, weight, qty, price, originalPrice) => {
                      const itemId = CartService.addItem({
                        productId: prod.id,
                        name: prod.name,
                        image: prod.image,
                        price: typeof price === 'number' ? price : prod.price,
                        originalPrice: typeof originalPrice === 'number' ? originalPrice : prod.originalPrice,
                        weight: weight,
                        quantity: qty,
                      });
                      if (itemId) {
                        showToast(`Added ${prod.name} (${weight}) to cart!`);
                      }
                    }}
                    onBuyNow={(prod, weight, price, originalPrice) => {
                      CartService.buyNow({
                        productId: prod.id,
                        name: prod.name,
                        image: prod.image,
                        price: typeof price === 'number' ? price : prod.price,
                        originalPrice: typeof originalPrice === 'number' ? originalPrice : prod.originalPrice,
                        weight: weight,
                        quantity: 1,
                      });
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
