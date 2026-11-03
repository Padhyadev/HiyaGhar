import React, { useRef, useState, useEffect } from 'react';
import { CategoryCard } from './CategoryCard';
import type { CategoryItem } from './CategoryCard';
import { CategoryService, type ApiCategory } from '../../../services/categoryService';
import { ProductService, type Product as ApiProduct } from '../../../services/productService';
import { HomePageService } from '../../../services/homePageService';
import { MukhwasProductCard } from '../../mukhwas/MukhwasProductCard/MukhwasProductCard';
import type { MukhwasProduct } from '../../../types/mukhwas';
import { CartService } from '../../../cart';
import { navigateTo } from '../../../utils/navigation';
import { showToast } from '../../../utils/alertService';
import { formatVariantLabel, getVariantImages, NO_IMAGE, productPath } from '../../../utils/productFormat';

const standardIngredients: { src: string; alt: string; className: string }[] = [];

type CarouselItem = CategoryItem & { card?: MukhwasProduct };

/** A bestseller as the same listing card the combo and category pages use, fixed to the admin-picked variant. */
function toProductItem(prod: ApiProduct, variant: NonNullable<ApiProduct['variants']>[number] | undefined, idx: number): CarouselItem {
  const variantLabel = variant ? formatVariantLabel(variant.variantName) : '';
  const price = variant?.price ?? (prod.discountPrice || prod.basePrice);
  const originalPrice = Math.max(variant?.originalPrice || 0, prod.basePrice || 0, price);
  const images = getVariantImages(prod, variant);

  return {
    id: `product/${prod.id}`,
    title: prod.productName,
    image: images[0] || NO_IMAGE,
    bgColor: idx % 2 === 0 ? '#F7F3E9' : '#F0F7F3',
    accentColor: idx % 2 === 0 ? '#CB992C' : '#2D6A4F',
    floatingIngredients: standardIngredients,
    card: {
      id: prod.id.toString(),
      name: prod.productName,
      category: 'special',
      categoryLabel: '',
      price,
      originalPrice,
      discountPercentage: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
      rating: prod.rating || 0,
      reviewsCount: prod.reviewCount || 0,
      image: images[0] || NO_IMAGE,
      secondaryImage: images[1],
      shortDescription: prod.shortDescription || '',
      longDescription: prod.shortDescription || '',
      weightOptions: variantLabel ? [variantLabel] : [],
      selectedWeight: variantLabel || undefined,
      variants: prod.variants || [],
      isBestSeller: prod.isFeatured,
      nutritionalInfo: { energy: '', carbs: '', protein: '', fat: '', fiber: '' },
    },
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

interface ProductCarouselProps {
  componentKey?: 'Category' | 'Bestsellers' | string;
}

export function getCategoryRouteSlug(categoryName: string): string {
  const catLower = categoryName.toLowerCase().trim();
  if (catLower.includes('mukhwas')) return 'mukhwas';
  if (catLower.includes('tea') || catLower.includes('masala')) return 'tea-masala';
  if (catLower.includes('soap')) return 'handmade-soap';
  if (catLower.includes('hair') || catLower.includes('oil')) return 'hair-oil';
  if (catLower.includes('gift') || catLower.includes('hamper')) return 'gift-hampers';
  if (catLower.includes('combo')) return 'combo';
  return catLower.replace(/\s+/g, '-');
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ componentKey = 'Category' }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef<boolean>(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<CarouselItem[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (componentKey === 'Category') {
        // 1. Fetch Category Section Config from HomePageComponent API
        const comp = await HomePageService.getComponentByKey('Category');
        const item = comp?.items?.[0];
        const allCategories: ApiCategory[] = await CategoryService.getCategories();

        if (!isMounted || !allCategories || allCategories.length === 0) return;

        let filteredCategories = allCategories;
        if (item && item.refId) {
          const catIds = item.refId.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id));
          if (catIds.length > 0) {
            filteredCategories = allCategories.filter((cat) => catIds.includes(cat.id));
          }
        }

        const mapped: CategoryItem[] = filteredCategories.map((cat, idx) => {
          const slug = getCategoryRouteSlug(cat.categoryName);
          return {
            id: slug,
            title: cat.categoryName,
            tagline: cat.description ? cat.description : undefined,
            image: cat.imagePath || '/image/jamunbottole_clean.webp', // Exact Category ImagePath from DB!
            bgColor: idx % 2 === 0 ? '#F7F3E9' : '#F0F7F3',
            accentColor: idx % 2 === 0 ? '#CB992C' : '#2D6A4F',
            floatingIngredients: standardIngredients,
          };
        });

        setCategoriesList(mapped);
      } else {
        // 2. Fetch Bestsellers Section Config (Composite Product-Variant format)
        const comp = await HomePageService.getComponentByKey('Bestsellers');
        const item = comp?.items?.[0];
        const allProducts: ApiProduct[] = await ProductService.getProducts();

        if (!isMounted) return;

        if (item && item.refId) {
          const pairs = HomePageService.parseProductVariantRefIds(item.refId);
          const mappedItems: CarouselItem[] = [];

          pairs.forEach((pair, idx) => {
            const prod = allProducts.find((p) => p.id === pair.productId);
            if (prod) {
              const matchedVar = pair.variantId
                ? prod.variants?.find((v) => v.id === pair.variantId) || prod.variants?.[0]
                : prod.variants?.[0];
              mappedItems.push(toProductItem(prod, matchedVar, idx));
            }
          });

          if (mappedItems.length > 0) {
            setCategoriesList(mappedItems);
            return;
          }
        }

        // Fallback to Products API if no composite Bestsellers refId match
        if (!allProducts || allProducts.length === 0) return;

        const bestSellerProducts = allProducts.filter((p) => p.isFeatured).length > 0
          ? allProducts.filter((p) => p.isFeatured)
          : allProducts.slice(0, 8);

        const mappedFallback: CarouselItem[] = bestSellerProducts.map((prod, idx) =>
          toProductItem(prod, prod.variants?.[0], idx)
        );

        setCategoriesList(mappedFallback);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [componentKey]);

  // Build infinite 3-set list for desktop looping.
  // On mobile, only single set is rendered in a 2-column grid.
  const set1 = categoriesList.map((item, idx) => ({ ...item, uniqueKey: `set1-${item.id}-${idx}`, _clone: true }));
  const set2 = categoriesList.map((item, idx) => ({ ...item, uniqueKey: `set2-${item.id}-${idx}`, _clone: false }));
  const set3 = categoriesList.map((item, idx) => ({ ...item, uniqueKey: `set3-${item.id}-${idx}`, _clone: true }));
  const infiniteCategoriesData = [...set1, ...set2, ...set3];

  const itemsToRender = isMobile
    ? categoriesList.map((item, idx) => ({ ...item, uniqueKey: `mobile-${item.id}-${idx}`, _clone: false }))
    : infiniteCategoriesData;

  // Initialize track scroll to middle set (Set 2) and attach seamless bidirectional infinite boundary listener (Desktop only)
  useEffect(() => {
    if (isMobile) return;
    const track = trackRef.current;
    if (!track || infiniteCategoriesData.length === 0) return;

    const setMiddlePosition = () => {
      const setWidth = track.scrollWidth / 3;
      if (setWidth > 0 && (track.scrollLeft === 0 || track.scrollLeft < 15)) {
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = setWidth;
        track.style.scrollBehavior = 'smooth';
      }
    };

    setMiddlePosition();
    const timer = setTimeout(setMiddlePosition, 60);

    const handleScroll = () => {
      if (!track) return;
      const currentScroll = track.scrollLeft;
      const setWidth = track.scrollWidth / 3;

      if (setWidth <= 0) return;

      if (currentScroll <= 20) {
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = currentScroll + setWidth;
        track.style.scrollBehavior = 'smooth';
      } else if (currentScroll >= setWidth * 2 + (setWidth - 20)) {
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = currentScroll - setWidth;
        track.style.scrollBehavior = 'smooth';
      }
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      track.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, categoriesList]);

  // Gentle Continuous Autoplay Timer (Every 3.2 seconds smoothly) - Disabled on mobile view
  useEffect(() => {
    if (isMobile) return;
    const interval = setInterval(() => {
      if (isHoveredRef.current || !trackRef.current || categoriesList.length === 0) return;

      const track = trackRef.current;
      const setWidth = track.scrollWidth / 3;

      if (setWidth > 0 && track.scrollLeft >= setWidth * 2 - 25) {
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = track.scrollLeft - setWidth;
        track.style.scrollBehavior = 'smooth';
      }

      const cardItem = track.querySelector<HTMLElement>('.hiyaghar-carousel-item');
      const step = cardItem ? cardItem.offsetWidth + 20 : 320;

      track.scrollBy({ left: step, behavior: 'smooth' });
    }, 3200);

    return () => clearInterval(interval);
  }, [isMobile, categoriesList]);

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const track = trackRef.current;
      const setWidth = track.scrollWidth / 3;
      const cardItem = track.querySelector<HTMLElement>('.hiyaghar-carousel-item');
      const step = cardItem ? cardItem.offsetWidth + 20 : 320;

      if (direction === 'left') {
        if (track.scrollLeft <= 25 || setWidth <= 0) {
          const targetSet = setWidth > 0 ? setWidth : 1200;
          track.style.scrollBehavior = 'auto';
          track.scrollLeft = targetSet + track.scrollLeft;
          track.style.scrollBehavior = 'smooth';
        }
        track.scrollBy({ left: -step, behavior: 'smooth' });
      } else {
        if (setWidth > 0 && track.scrollLeft >= setWidth * 2 - 25) {
          track.style.scrollBehavior = 'auto';
          track.scrollLeft = track.scrollLeft - setWidth;
          track.style.scrollBehavior = 'smooth';
        }
        track.scrollBy({ left: step, behavior: 'smooth' });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      scroll('right');
    }
  };

  if (categoriesList.length === 0) {
    return null;
  }

  return (
    <div
      className={`hiyaghar-carousel-wrapper ${isMobile ? 'is-mobile-view' : ''}`}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; setActiveCategoryId(null); }}
      onPointerEnter={() => { isHoveredRef.current = true; }}
      onPointerLeave={() => { isHoveredRef.current = false; setActiveCategoryId(null); }}
    >
      <div
        className={`hiyaghar-carousel-track ${isMobile ? 'is-mobile-grid' : ''}`}
        ref={trackRef}
        tabIndex={isMobile ? -1 : 0}
        onKeyDown={isMobile ? undefined : handleKeyDown}
        role="region"
        aria-label="Product Showcase Carousel"
      >
        {itemsToRender.map((category, i) => (
          <div
            key={category.uniqueKey}
            className="hiyaghar-carousel-item"
            aria-hidden={category._clone ? 'true' : undefined}
            inert={category._clone ? true : undefined}
          >
            {category.card ? (
              <MukhwasProductCard
                product={category.card}
                index={i % categoriesList.length}
                onNavigateToDetail={() => navigateTo(productPath(category.card!.name, category.card!.id))}
                onAddToCart={(prod, weight, _qty, price, origPrice) => {
                  if (CartService.addItem(toCartItem(prod, weight, price, origPrice))) showToast(`Added ${prod.name} to your cart!`);
                }}
                onBuyNow={(prod, weight, price, origPrice) => {
                  CartService.buyNow(toCartItem(prod, weight, price, origPrice));
                }}
              />
            ) : (
              <CategoryCard
                category={category}
                isActive={!category._clone && activeCategoryId === category.id}
                onActivate={() => !category._clone && setActiveCategoryId(category.id)}
                onDeactivate={() => setActiveCategoryId(null)}
              />
            )}
          </div>
        ))}
      </div>

      {!isMobile && (
        <>
          <button
            type="button"
            className="hiyaghar-carousel-btn prev"
            onClick={() => scroll('left')}
            aria-label="Previous cards"
            title="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          <button
            type="button"
            className="hiyaghar-carousel-btn next"
            onClick={() => scroll('right')}
            aria-label="Next cards"
            title="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};
