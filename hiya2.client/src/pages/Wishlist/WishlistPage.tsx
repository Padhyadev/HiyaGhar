import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { WishlistService } from '../../services/wishlistService';
import type { WishlistItem } from '../../services/wishlistService';
import { CartService } from '../../cart';
import { mukhwasProducts } from '../../data/mukhwasData';
import type { MukhwasProduct } from '../../data/mukhwasData';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { MukhwasProductCard } from '../../components/mukhwas/MukhwasProductCard/MukhwasProductCard';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = WishlistService.subscribe(() => setWishlistItems(WishlistService.getItems()));
    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  return (
    <div className="hiyaghar-wishlist-page-layout">
      <Header />

      <main className="hiyaghar-wishlist-main">
        {toastMessage && (
          <div className="hiyaghar-wishlist-toast" role="status" aria-live="polite">
            <span>{toastMessage}</span>
          </div>
        )}

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
                const matchedProduct = mukhwasProducts.find((p: MukhwasProduct) => p.id === item.productId);
                const productObj: MukhwasProduct = matchedProduct || {
                  id: item.productId,
                  name: item.name,
                  category: 'special',
                  categoryLabel: 'Speciality Mukhwas',
                  shortDescription: 'Artisanal mouth freshener packed with natural digestion benefits.',
                  longDescription: 'Handcrafted artisanal mukhwas with natural seeds and herbs for optimal post-meal refreshment.',
                  price: item.price,
                  originalPrice: item.originalPrice || Math.round(item.price * 1.3),
                  discountPercentage: 15,
                  weightOptions: ['100g', item.weight || '250g', '500g'],
                  image: item.image,
                  rating: 4.9,
                  reviewsCount: 96,
                  isBestSeller: true,
                  badge: 'Best Seller',
                  benefits: ['100% Natural', 'Digestive Care'],
                  ingredients: ['Fennel', 'Sesame', 'Spices'],
                  nutritionalInfo: {
                    energy: '410 kcal',
                    carbs: '52g',
                    protein: '12g',
                    fat: '14g',
                    fiber: '8g',
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
                      // CartService.addItem already shows its own "please login"
                      // popup and returns '' when blocked - only toast on real success.
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
