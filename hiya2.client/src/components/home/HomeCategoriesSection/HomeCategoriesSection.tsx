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
  // True when the categories don't all fit on screen: the row then loops forever (3 copies,
  // kept on the middle one) and auto-advances. When they all fit, it's a plain still row.
  const [isLooping, setIsLooping] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const trackRef = useRef<HTMLUListElement>(null);
  const isInteractingRef = useRef(false);

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

  const count = categories.length;

  // One "step" is one card plus the gap between cards.
  const getStep = () => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>('.hiyaghar-homecat-card');
    if (!track || !card) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.offsetWidth + gap;
  };

  // Instant (not animated) scroll, used for the invisible jumps between identical copies.
  const jumpTo = (left: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = left;
    track.style.scrollBehavior = '';
  };

  // Loop or not: do all categories fit on screen at this width?
  const measureFit = useCallback(() => {
    const track = trackRef.current;
    const step = getStep();
    if (!track || step <= 0 || count <= 1) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    setIsLooping(count * step - gap > track.clientWidth + 4);
  }, [count]);

  // When looping, keep the scroll position inside the middle copy: a move that ended in the
  // first or last copy is shifted by one copy's width to the identical spot (no visible change).
  const settleLoop = useCallback(() => {
    const track = trackRef.current;
    const step = getStep();
    if (!track || step <= 0) return;
    const index = Math.round(track.scrollLeft / step);
    const normalized = ((index % count) + count) % count;
    activeIndexRef.current = normalized;
    setActiveIndex(normalized);
    if (!isLooping) return;
    if (index < count || index >= 2 * count) jumpTo((count + normalized) * step);
  }, [count, isLooping]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Start on (or stay on) the current category in the middle copy.
    const place = () => {
      measureFit();
      const step = getStep();
      if (step > 0) jumpTo(((isLooping ? count : 0) + activeIndexRef.current) * step);
    };
    place();

    let settleTimer: number | undefined;
    const onScroll = () => {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settleLoop, 120);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(place);
    observer.observe(track);
    return () => {
      if (settleTimer) window.clearTimeout(settleTimer);
      track.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [categories, count, isLooping, measureFit, settleLoop]);

  // Touch and hover pause handling for smooth auto-scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let resumeTimer: number | undefined;

    const pause = () => {
      isInteractingRef.current = true;
      if (resumeTimer) window.clearTimeout(resumeTimer);
    };

    const resume = () => {
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        isInteractingRef.current = false;
      }, 3500);
    };

    track.addEventListener('pointerdown', pause, { passive: true });
    track.addEventListener('pointerup', resume, { passive: true });
    track.addEventListener('pointercancel', resume, { passive: true });
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', resume, { passive: true });
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);

    return () => {
      if (resumeTimer) window.clearTimeout(resumeTimer);
      track.removeEventListener('pointerdown', pause);
      track.removeEventListener('pointerup', resume);
      track.removeEventListener('pointercancel', resume);
      track.removeEventListener('touchstart', pause);
      track.removeEventListener('touchend', resume);
      track.removeEventListener('mouseenter', pause);
      track.removeEventListener('mouseleave', resume);
    };
    // Re-attach once the track exists (it only renders after the categories load).
  }, [categories]);

  // Auto-advance one card every 3.2 s, forever (the loop above makes "after the last" the first
  // again). Paused while touched/hovered, in a hidden tab, and for reduced-motion visitors.
  useEffect(() => {
    if (!isLooping) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const interval = setInterval(() => {
      const track = trackRef.current;
      if (!track || isInteractingRef.current || document.visibilityState !== 'visible') return;
      const step = getStep();
      if (step > 0) track.scrollBy({ left: step });
    }, 3200);

    return () => clearInterval(interval);
  }, [isLooping]);

  const scrollToCategory = (index: number) => {
    trackRef.current?.scrollTo({ left: ((isLooping ? count : 0) + index) * getStep() });
  };

  const scrollByCards = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * getStep() });
  };

  // Three identical copies when looping; only the middle one is announced to screen readers
  // and reachable with Tab (the copies stay clickable, since they can be on screen).
  const loopItems = isLooping
    ? [0, 1, 2].flatMap((copy) => categories.map((cat, idx) => ({ cat, idx, copy })))
    : categories.map((cat, idx) => ({ cat, idx, copy: 1 }));

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
              {loopItems.map(({ cat, idx, copy }) => (
                <li
                  key={`${copy}-${cat.id}`}
                  className={`hiyaghar-homecat-card ${idx % 2 === 0 ? 'is-cream' : 'is-sage'}`}
                  aria-hidden={copy !== 1 ? 'true' : undefined}
                >
                  <a
                    href={cat.href}
                    tabIndex={copy !== 1 ? -1 : undefined}
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

            {isLooping && (
              <div className="hiyaghar-homecat-controls">
                <button
                  type="button"
                  className="hiyaghar-homecat-arrow"
                  onClick={() => scrollByCards(-1)}
                  aria-label="Previous categories"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>

                <div className="hiyaghar-homecat-dots">
                  {categories.map((cat, i) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`hiyaghar-homecat-dot ${i === activeIndex ? 'is-active' : ''}`}
                      onClick={() => scrollToCategory(i)}
                      aria-label={`Go to ${cat.name}`}
                      aria-current={i === activeIndex ? 'true' : undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="hiyaghar-homecat-arrow"
                  onClick={() => scrollByCards(1)}
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
