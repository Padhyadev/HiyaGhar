import React, { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { MukhwasProductCard } from '../../components/mukhwas/MukhwasProductCard/MukhwasProductCard';
import { CartService } from '../../cart';
import { ComboService } from '../../services/comboService';
import { navigateTo } from '../../utils/navigation';
import { showToast } from '../../utils/alertService';
import { comboToCard, type ComboCard } from './comboCard';
// Shared listing-page styles (grid section spacing, empty state) live with the Mukhwas page.
import '../Mukhwas/MukhwasPage.css';

interface CombosPageProps {
  onNavigateHome: () => void;
  onNavigateToDetail: (productId: string) => void;
}

/** /combos: the ready-made combos the admin created (Catalog > Combos). */
export const CombosPage: React.FC<CombosPageProps> = ({ onNavigateHome, onNavigateToDetail }) => {
  const [combos, setCombos] = useState<ComboCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    ComboService.getActiveCombos().then(({ combos: list }) => {
      if (!isMounted) return;
      setCombos(list.map(comboToCard));
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const toCartItem = (product: ComboCard, weight: string, price?: number, originalPrice?: number) => ({
    productId: product.id,
    name: product.name,
    image: product.image,
    price: typeof price === 'number' ? price : product.price,
    originalPrice: typeof originalPrice === 'number' ? originalPrice : product.originalPrice,
    weight,
    quantity: 1,
  });

  const addToCart = (product: ComboCard, weight: string, price?: number, originalPrice?: number) =>
    CartService.addItem(toCartItem(product, weight, price, originalPrice));

  return (
    <div className="hiyaghar-mukhwas-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-mukhwas-page-main">
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          breadcrumbCurrent="Combo Packs"
          title="Combo Packs"
          bgImage="/image/gifting_hero_banner.webp"
        />

        <section className="hiyaghar-mukhwas-grid-section" aria-label="Combo Packs">
          <div className="hiyaghar-container">
            <p style={{ margin: '0 0 20px', color: '#475569' }}>
              Ready-made combo packs of our handcrafted favourites, priced lower than buying each item separately.
            </p>
            {isLoading ? (
              <div className="hiyaghar-mukhwas-products-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="hiyaghar-mukhwas-card-skeleton" aria-hidden="true" />
                ))}
              </div>
            ) : combos.length > 0 ? (
              <div className="hiyaghar-mukhwas-products-grid">
                {combos.map((combo, index) => (
                  <MukhwasProductCard
                    key={combo.id}
                    product={combo}
                    index={index}
                    onNavigateToDetail={onNavigateToDetail}
                    onAddToCart={(prod, weight, _qty, price, origPrice) => {
                      if (addToCart(prod as ComboCard, weight, price, origPrice)) showToast(`Added ${prod.name} to your cart!`);
                    }}
                    onBuyNow={(prod, weight, price, origPrice) => {
                      CartService.buyNow(toCartItem(prod as ComboCard, weight, price, origPrice));
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="hiyaghar-mukhwas-empty-state">
                <div className="hiyaghar-empty-icon">🎁</div>
                <h2 className="hiyaghar-empty-title">New combo packs are coming soon</h2>
                <p className="hiyaghar-empty-desc">Meanwhile, explore our handcrafted mukhwas.</p>
                <button type="button" className="hiyaghar-btn-primary" onClick={() => navigateTo('/mukhwas')}>
                  Shop Mukhwas →
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
