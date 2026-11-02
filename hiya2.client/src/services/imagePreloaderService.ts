/**
 * IMAGE PRELOADER SERVICE
 * Pre-fetches and caches all key hero banners, category images, and top product images
 * so that page transitions and menu switches display all images 100% instantly.
 */

const CRITICAL_IMAGE_URLS = [
  '/image/gifting_hero_banner.webp',
  '/image/hiya_ghar_story_banner.webp',
  '/image/HerosectionImage1.webp',
  '/image/TEA%20MASALA.webp',
  '/image/Soap/neem.webp',
  '/image/hairoil.webp',
  '/image/gifting_festival.webp',
  '/image/lifestyle_kitchen.webp',
  '/image/jamunbottole_clean.webp',
  '/image/Jamun_Pop.webp',
];

const PARALLEL_DOWNLOADS = 3;

const loadImage = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.fetchPriority = 'low';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve on error so failing one doesn't block
    img.src = url;
  });

// Shoppers on data saver or a slow connection only download the images they actually see.
const isSlowConnection = () => {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!connection && (connection.saveData === true || /(^|-)(2g|3g)$/.test(connection.effectiveType || ''));
};

// Warms the cache for other pages without slowing down the page being opened: starts only once
// that page has fully loaded and the browser is idle, then fetches a few images at a time.
export const preloadCriticalImages = (): void => {
  if (typeof window === 'undefined' || isSlowConnection()) return;

  const run = async () => {
    const queue = [...CRITICAL_IMAGE_URLS];
    const worker = async () => {
      for (let url = queue.shift(); url; url = queue.shift()) await loadImage(url);
    };
    await Promise.all(Array.from({ length: PARALLEL_DOWNLOADS }, worker));
  };
  const whenIdle = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => void run(), { timeout: 4000 });
    else setTimeout(() => void run(), 1500);
  };

  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
};
