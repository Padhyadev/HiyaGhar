import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { CategoryService, type ApiCategory } from '../../../services/categoryService';
import { HomePageService } from '../../../services/homePageService';
import { getCategoryRouteSlug } from '../BestSellersSection/ProductCarousel';
import { navigateTo } from '../../../utils/navigation';
import './HomeCategoriesSection.css';

interface HomeCategory {
  id: number;
  name: string;
  href: string;
  image: string;
}

const FALLBACK_IMAGE = '/image/jamunbottole_clean.webp';

/**
 * Home "Explore Categories" section. Same data as before: the categories picked in admin
 * (Home Page Component "Category", refId = comma-separated category ids), or all categories.
 */
export const HomeCategoriesSection: React.FC = () => {
  const [badgeText, setBadgeText] = useState('EXPLORE CATEGORIES');
  const [headingText, setHeadingText] = useState('Squeeze in Some Goodness');
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const comp = await HomePageService.getComponentByKey('Category');
      const item = comp?.items?.[0];
      if (isMounted && item?.title) setBadgeText(item.title);
      if (isMounted && item?.subtitle) setHeadingText(item.subtitle);

      const all: ApiCategory[] = await CategoryService.getCategories();
      if (!isMounted || !all || all.length === 0) return;

      let picked = all;
      if (item?.refId) {
        const ids = item.refId.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id));
        if (ids.length > 0) picked = all.filter((cat) => ids.includes(cat.id));
      }

      setCategories(
        picked.map((cat) => ({
          id: cat.id,
          name: cat.categoryName,
          href: `/${getCategoryRouteSlug(cat.categoryName)}`,
          image: cat.imagePath || FALLBACK_IMAGE,
        }))
      );
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // One "step" is one card plus the gap between cards.
  const getStep = () => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>('.hiyaghar-homecat-card');
    if (!track || !card) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.offsetWidth + gap;
  };

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const step = getStep();
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft < maxScroll - 4);
    if (step > 0) {
      setPageCount(Math.max(1, Math.round(maxScroll / step) + 1));
      setActivePage(Math.round(track.scrollLeft / step));
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateScrollState();
    track.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [categories, updateScrollState]);

  const scrollToPage = (page: number) => {
    trackRef.current?.scrollTo({ left: page * getStep() });
  };

  const scrollByCards = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * getStep() });
  };

  return (
    <section className="hiyaghar-homecat-section" aria-labelledby="hiyaghar-homecat-title">
      <div className="hiyaghar-container">
        <ScrollReveal variant="fade-up">
          <header className="hiyaghar-homecat-header">
            <span className="hiyaghar-homecat-pill">{badgeText}</span>
            <h2 id="hiyaghar-homecat-title" className="hiyaghar-homecat-title">{headingText}</h2>
            <p className="hiyaghar-homecat-subtitle">Handcrafted with love, straight from our ghar to yours</p>
          </header>
        </ScrollReveal>

        {categories.length > 0 && (
          <ScrollReveal variant="fade-up" delay={120}>
            <ul ref={trackRef} className="hiyaghar-homecat-track" aria-label="Product categories">
              {categories.map((cat, idx) => (
                <li key={cat.id} className={`hiyaghar-homecat-card ${idx % 2 === 0 ? 'is-cream' : 'is-sage'}`}>
                  <a
                    href={cat.href}
                    className="hiyaghar-homecat-link"
                    onClick={(e) => {
                      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      navigateTo(cat.href);
                    }}
                  >
                    {/* Section 1: Product Image */}
                    <div className="hiyaghar-homecat-media">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        width={400}
                        height={400}
                        loading="lazy"
                        decoding="async"
                        className="hiyaghar-homecat-img"
                      />
                    </div>

                    {/* Divider 1: between image and category name */}
                    <div className="hiyaghar-homecat-divider" aria-hidden="true" />

                    {/* Section 2: Category Name */}
                    <div className="hiyaghar-homecat-name-section">
                      <h3 className="hiyaghar-homecat-name">{cat.name}</h3>
                    </div>

                    {/* Divider 2: between category name and CTA */}
                    <div className="hiyaghar-homecat-divider" aria-hidden="true" />

                    {/* Section 3: Explore Category CTA Button */}
                    <div className="hiyaghar-homecat-action-section">
                      <span className="hiyaghar-homecat-btn">
                        Explore Category
                        <svg className="hiyaghar-homecat-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>

            {pageCount > 1 && (
              <div className="hiyaghar-homecat-controls">
                <button
                  type="button"
                  className="hiyaghar-homecat-arrow"
                  onClick={() => scrollByCards(-1)}
                  disabled={!canPrev}
                  aria-label="Previous categories"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>

                <div className="hiyaghar-homecat-dots">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`hiyaghar-homecat-dot ${i === activePage ? 'is-active' : ''}`}
                      onClick={() => scrollToPage(i)}
                      aria-label={`Go to slide ${i + 1} of ${pageCount}`}
                      aria-current={i === activePage ? 'true' : undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="hiyaghar-homecat-arrow"
                  onClick={() => scrollByCards(1)}
                  disabled={!canNext}
                  aria-label="Next categories"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};
