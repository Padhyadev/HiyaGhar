import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MukhwasProductCard } from '../../mukhwas/MukhwasProductCard/MukhwasProductCard';
import type { MukhwasProduct } from '../../../types/mukhwas';
import { ProductService, type Product as ApiProduct } from '../../../services/productService';
import { getComboItems } from '../../../services/comboService';
import { CartService } from '../../../cart';
import { navigateTo } from '../../../utils/navigation';
import { showToast } from '../../../utils/alertService';
import { getDefaultVariant, getVariantImages, NO_IMAGE, productPath } from '../../../utils/productFormat';
import './YouMayAlsoLike.css';

const MAX_ITEMS = 8;
// Below this many same-category matches, the row is filled up with bestsellers from other categories.
const MIN_SAME_CATEGORY = 4;

interface YouMayAlsoLikeProps {
  /** Id of the product being viewed. */
  productId: string;
}

const isInStock = (p: ApiProduct) => {
  const variants = p.variants || [];
  if (variants.length === 0) return true;
  return variants.some((v) =>
    typeof v.sellableStock === 'number' ? v.sellableStock > 0 : typeof v.stockQuantity === 'number' ? v.stockQuantity > 0 : true
  );
};

const priceOf = (p: ApiProduct) => {
  const v = getDefaultVariant(p.variants);
  return v ? v.price : p.discountPrice || p.basePrice || 0;
};

// Bestsellers first, then highest rated.
const byPopularity = (a: ApiProduct, b: ApiProduct) =>
  Number(!!b.isFeatured) - Number(!!a.isFeatured) || (b.rating || 0) - (a.rating || 0);

/**
 * Picks up to 8 products for the "You May Also Like" row:
 * 1. other products in the same category (bestsellers, then rating, then closest price);
 * 2. combos that include this product;
 * 3. if that gives fewer than 4, bestsellers from other categories fill the row.
 * Never the current product, an inactive product or one that is out of stock.
 */
function pickRelatedProducts(all: ApiProduct[], currentId: number): ApiProduct[] {
  const current = all.find((p) => p.id === currentId);
  if (!current) return [];

  const candidates = all.filter((p) => p.id !== currentId && p.isActive !== false && isInStock(p));
  const currentPrice = priceOf(current);

  const sameCategory = candidates
    .filter((p) => p.categoryId === current.categoryId)
    .sort((a, b) => byPopularity(a, b) || Math.abs(priceOf(a) - currentPrice) - Math.abs(priceOf(b) - currentPrice));

  const combosWithThis = candidates
    .filter((p) => p.categoryId !== current.categoryId && getComboItems(p).some((item) => item.productId === currentId))
    .sort(byPopularity);

  const picked = [...sameCategory, ...combosWithThis];
  if (picked.length < MIN_SAME_CATEGORY) {
    const pickedIds = new Set(picked.map((p) => p.id));
    picked.push(...candidates.filter((p) => !pickedIds.has(p.id)).sort(byPopularity));
  }
  return picked.slice(0, MAX_ITEMS);
}

function toCard(p: ApiProduct): MukhwasProduct {
  const variant = getDefaultVariant(p.variants);
  const price = priceOf(p);
  const originalPrice = Math.max(variant?.originalPrice || 0, p.basePrice || 0, price);
  const images = getVariantImages(p, variant);
  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'special',
    categoryLabel: p.category?.categoryName || '',
    price,
    originalPrice,
    discountPercentage: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
    rating: p.rating || 0,
    reviewsCount: p.reviewCount || 0,
    image: images[0] || p.mainImagePath || NO_IMAGE,
    secondaryImage: images[1],
    shortDescription: p.shortDescription || '',
    longDescription: p.shortDescription || '',
    weightOptions: [],
    variants: p.variants || [],
    isBestSeller: p.isFeatured,
    nutritionalInfo: { energy: '', carbs: '', protein: '', fat: '', fiber: '' },
  };
}

const toCartItem = (product: MukhwasProduct, weight: string, price?: number, originalPrice?: number) => ({
  productId: product.id,
  name: product.name,
  image: product.image,
  price: typeof price === 'number' ? price : product.price,
  originalPrice: typeof originalPrice === 'number' ? originalPrice : product.originalPrice,
  weight,
  quantity: 1,
});

export const YouMayAlsoLike: React.FC<YouMayAlsoLikeProps> = ({ productId }) => {
  const [cards, setCards] = useState<MukhwasProduct[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let isMounted = true;
    const id = Number(productId);
    if (!id) {
      setCards([]);
      return;
    }
    ProductService.getProducts().then((all) => {
      if (isMounted) setCards(pickRelatedProducts(all || [], id).map(toCard));
    });
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = 0;
    updateArrows();
    track.addEventListener('scroll', updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', updateArrows);
      observer.disconnect();
    };
  }, [cards, updateArrows]);

  const scrollByCards = (direction: -1 | 1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>('.hiyaghar-ymal-item');
    if (!track || !card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap) });
  };

  if (cards.length === 0) return null;

  return (
    <section className="hiyaghar-ymal-section" aria-labelledby="hiyaghar-ymal-title">
      <div className="hiyaghar-ymal-header">
        <h2 id="hiyaghar-ymal-title" className="hiyaghar-ymal-title">You May Also Like</h2>
        <div className="hiyaghar-ymal-arrows">
          <button
            type="button"
            className="hiyaghar-ymal-arrow"
            onClick={() => scrollByCards(-1)}
            disabled={!canPrev}
            aria-label="Previous products"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <button
            type="button"
            className="hiyaghar-ymal-arrow"
            onClick={() => scrollByCards(1)}
            disabled={!canNext}
            aria-label="Next products"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      <ul ref={trackRef} className="hiyaghar-ymal-track">
        {cards.map((card, index) => (
          <li key={card.id} className="hiyaghar-ymal-item">
            <MukhwasProductCard
              product={card}
              index={index}
              onNavigateToDetail={() => navigateTo(productPath(card.name, card.id))}
              onAddToCart={(prod, weight, _qty, price, origPrice) => {
                if (CartService.addItem(toCartItem(prod, weight, price, origPrice))) showToast(`Added ${prod.name} to your cart!`);
              }}
              onBuyNow={(prod, weight, price, origPrice) => {
                CartService.buyNow(toCartItem(prod, weight, price, origPrice));
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};
