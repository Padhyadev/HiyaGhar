import React, { useEffect, useState } from 'react';
import { MukhwasProductCard } from '../../mukhwas/MukhwasProductCard/MukhwasProductCard';
import { CartService } from '../../../cart';
import { ComboService } from '../../../services/comboService';
import { comboToCard, type ComboCard } from '../../../pages/Combos/comboCard';
import { navigateTo } from '../../../utils/navigation';
import { productPath } from '../../../utils/productFormat';
import { showToast } from '../../../utils/alertService';
import '../../../pages/Mukhwas/MukhwasPage.css';
import './CombosSection.css';

const MAX_ON_HOME = 4;

/** Home: up to 4 admin-made combos with a link to /combos. Renders nothing while there are none. */
export const CombosSection: React.FC = () => {
  const [combos, setCombos] = useState<ComboCard[]>([]);

  useEffect(() => {
    let isMounted = true;
    ComboService.getActiveCombos().then(({ combos: list }) => {
      if (isMounted) setCombos(list.map(comboToCard));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (combos.length === 0) return null;

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
    <section className="hiyaghar-combos-section" aria-labelledby="home-combos-title">
      <div className="hiyaghar-combos-inner">
        <header className="hiyaghar-combos-header">
          <h2 id="home-combos-title" className="hiyaghar-combos-title">Combo Packs</h2>
          <p className="hiyaghar-combos-subtitle">Ready-made combos of our favourites, priced lower than buying each item separately.</p>
        </header>

        <div className="hiyaghar-mukhwas-products-grid">
          {combos.slice(0, MAX_ON_HOME).map((combo, index) => (
            <MukhwasProductCard
              key={combo.id}
              product={combo}
              index={index}
              onNavigateToDetail={() => navigateTo(productPath(combo.name, combo.id))}
              onAddToCart={(prod, weight, _qty, price, origPrice) => {
                if (addToCart(prod as ComboCard, weight, price, origPrice)) showToast(`Added ${prod.name} to your cart!`);
              }}
              onBuyNow={(prod, weight, price, origPrice) => {
                CartService.buyNow(toCartItem(prod as ComboCard, weight, price, origPrice));
              }}
            />
          ))}
        </div>

        <div className="hiyaghar-combos-more">
          <a
            href="/combos"
            className="hiyaghar-btn-primary"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/combos');
            }}
          >
            View All Combo Packs →
          </a>
        </div>
      </div>
    </section>
  );
};
