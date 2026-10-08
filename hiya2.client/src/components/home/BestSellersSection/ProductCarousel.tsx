import React, { useRef, useState, useEffect } from 'react';
import { CategoryCard } from './CategoryCard';
import type { CategoryItem } from './CategoryCard';
import { CategoryService, type ApiCategory } from '../../../services/categoryService';
import { ProductService, type Product as ApiProduct } from '../../../services/productService';
import { HomePageService } from '../../../services/homePageService';
import { formatVariantLabel } from '../../../utils/productFormat';

const standardIngredients: { src: string; alt: string; className: string }[] = [];

interface ProductCarouselProps {
  componentKey?: 'Category' | 'Bestsellers' | string;
}

function getCategoryRouteSlug(categoryName: string): string {
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
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);

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
          const mappedItems: CategoryItem[] = [];

          pairs.forEach((pair, idx) => {
            const prod = allProducts.find((p) => p.id === pair.productId);
            if (prod) {
              const matchedVar = pair.variantId
                ? prod.variants?.find((v) => v.id === pair.variantId) || prod.variants?.[0]
                : prod.variants?.[0];
              const variantLabel = matchedVar ? formatVariantLabel(matchedVar.variantName) : '';
              const priceVal = matchedVar?.price ?? prod.basePrice;
              const priceTag = variantLabel ? `₹${priceVal} • ${variantLabel}` : `₹${priceVal}`;

              mappedItems.push({
                id: `product/${prod.id}`,
                productId: prod.id.toString(),
                price: priceVal,
                originalPrice: matchedVar?.originalPrice,
                weight: variantLabel,
                isProduct: true,
                title: prod.productName,
                tagline: priceTag,
                image: prod.images?.find((i) => i.isPrimary)?.imagePath || prod.mainImagePath || '/image/jamunbottole_clean.webp',
                bgColor: idx % 2 === 0 ? '#F7F3E9' : '#F0F7F3',
                accentColor: idx % 2 === 0 ? '#CB992C' : '#2D6A4F',
                floatingIngredients: standardIngredients,
              });
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

        const mappedFallback: CategoryItem[] = bestSellerProducts.map((prod, idx) => {
          const matchedVar = prod.variants?.[0];
          const variantLabel = matchedVar ? formatVariantLabel(matchedVar.variantName) : '';
          const priceVal = matchedVar?.price ?? prod.basePrice;
          const priceTag = variantLabel ? `₹${priceVal} • ${variantLabel}` : `₹${priceVal}`;
          return {
            id: `product/${prod.id}`,
            productId: prod.id.toString(),
            price: priceVal,
            originalPrice: matchedVar?.originalPrice,
            weight: variantLabel,
            isProduct: true,
            title: prod.productName,
            tagline: priceTag,
            image: prod.images?.find((i) => i.isPrimary)?.imagePath || prod.mainImagePath || '/image/jamunbottole_clean.webp',
            bgColor: idx % 2 === 0 ? '#F7F3E9' : '#F0F7F3',
            accentColor: idx % 2 === 0 ? '#CB992C' : '#2D6A4F',
            floatingIngredients: standardIngredients,
          };
        });

        setCategoriesList(mappedFallback);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [componentKey]);

  // Build infinite 3-set list from dynamic categoriesList
  const infiniteCategoriesData: (CategoryItem & { uniqueKey: string })[] = [
    ...categoriesList.map((item, idx) => ({ ...item, uniqueKey: `set1-${item.id}-${idx}` })),
    ...categoriesList.map((item, idx) => ({ ...item, uniqueKey: `set2-${item.id}-${idx}` })),
    ...categoriesList.map((item, idx) => ({ ...item, uniqueKey: `set3-${item.id}-${idx}` })),
  ];

  // Initialize track scroll to middle set (Set 2) and attach seamless bidirectional infinite boundary listener
  useEffect(() => {
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
  }, [categoriesList]);

  // Original Gentle Continuous Autoplay Timer (Every 3.2 seconds smoothly)
  useEffect(() => {
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
  }, [categoriesList]);

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
      className="hiyaghar-carousel-wrapper"
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; setActiveCategoryId(null); }}
      onPointerEnter={() => { isHoveredRef.current = true; }}
      onPointerLeave={() => { isHoveredRef.current = false; setActiveCategoryId(null); }}
    >
      <div
        className="hiyaghar-carousel-track"
        ref={trackRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Product Showcase Carousel"
      >
        {infiniteCategoriesData.map((category) => (
          <div key={category.uniqueKey} className="hiyaghar-carousel-item">
            <CategoryCard
              category={category}
              isActive={activeCategoryId === category.id}
              onActivate={() => setActiveCategoryId(category.id)}
              onDeactivate={() => setActiveCategoryId(null)}
            />
          </div>
        ))}
      </div>

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
          <polyline points="12 5 19 12 12 5" />
        </svg>
      </button>
    </div>
  );
};
