import React, { useRef, useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import type { ProductItem } from './ProductCard';

const standardIngredients = [
  { src: '/image/Aavla.webp', alt: 'Aavla', className: 'pos-top-center' },
  { src: '/image/Jamun.webp', alt: 'Jamun', className: 'pos-bottom-left' },
  { src: '/image/Mango.webp', alt: 'Mango', className: 'pos-bottom-right' },
];

export const productsData: ProductItem[] = [
  {
    id: 'jamun-mukhwas',
    title: 'Organic Jamun Mukhwas',
    category: 'Mukhwas',
    price: '$14.99',
    rating: '4.9',
    reviewsCount: '1,240',
    image: '/image/jamunbottole_clean.webp',
    bgColor: '#4ba860',
    accentColor: '#a3e635',
    floatingIngredients: standardIngredients,
  },
  {
    id: 'tea-masala-blend',
    title: 'Royal Spice Tea Masala',
    category: 'Tea Masala',
    price: '$12.99',
    rating: '4.8',
    reviewsCount: '890',
    image: '/image/jamunbottole_clean.webp',
    bgColor: '#f26522',
    accentColor: '#ff8a65',
    floatingIngredients: standardIngredients,
  },
  {
    id: 'herbal-soap',
    title: 'Herbal Healing Soap',
    category: 'Handmade Soap',
    price: '$9.99',
    rating: '4.9',
    reviewsCount: '650',
    image: '/image/jamunbottole_clean.webp',
    bgColor: '#8b5cf6',
    accentColor: '#c084fc',
    floatingIngredients: standardIngredients,
  },
  {
    id: 'hair-elixir',
    title: 'Botanical Hair Elixir',
    category: 'Hair Oil',
    price: '$18.99',
    rating: '5.0',
    reviewsCount: '1,420',
    image: '/image/jamunbottole_clean.webp',
    bgColor: '#2d6a4f',
    accentColor: '#74c69d',
    floatingIngredients: standardIngredients,
  },
  {
    id: 'festive-hamper',
    title: 'Luxury Festive Hamper',
    category: 'Gift Hampers',
    price: '$34.99',
    rating: '5.0',
    reviewsCount: '510',
    image: '/image/jamunbottole_clean.webp',
    bgColor: '#f59e0b',
    accentColor: '#fde047',
    floatingIngredients: standardIngredients,
  },
];

export const ProductsCarousel: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef<boolean>(false);
  const [activeProductId, setActiveProductId] = useState<string>('jamun-mukhwas');

  // Autoplay Timer (Every 3.5s unless mouse is hovering wrapper)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHoveredRef.current) return;
      if (!trackRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft >= maxScroll - 25) {
        trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const itemStep = clientWidth / 4 + 5;
        trackRef.current.scrollBy({ left: itemStep, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    const itemStep = clientWidth * 0.75;
    const maxScroll = scrollWidth - clientWidth;

    if (direction === 'left') {
      if (scrollLeft <= 15) {
        trackRef.current.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        trackRef.current.scrollBy({ left: -itemStep, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft >= maxScroll - 25) {
        trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        trackRef.current.scrollBy({ left: itemStep, behavior: 'smooth' });
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

  return (
    <div
      className="hiyaghar-carousel-wrapper"
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      onPointerEnter={() => { isHoveredRef.current = true; }}
      onPointerLeave={() => { isHoveredRef.current = false; }}
    >
      {/* Scrollable Track */}
      <div
        className="hiyaghar-carousel-track"
        ref={trackRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Best Sellers Products Carousel"
      >
        {productsData.map((product) => (
          <div key={product.id} className="hiyaghar-carousel-item">
            <ProductCard
              product={product}
              isActive={activeProductId === product.id}
              onActivate={() => setActiveProductId(product.id)}
            />
          </div>
        ))}
      </div>

      {/* Prev Button - Always Visible & Looping */}
      <button
        type="button"
        className="hiyaghar-carousel-btn prev"
        onClick={() => scroll('left')}
        aria-label="Previous best seller products"
        title="Previous"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Next Button - Always Visible & Looping */}
      <button
        type="button"
        className="hiyaghar-carousel-btn next"
        onClick={() => scroll('right')}
        aria-label="Next best seller products"
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
