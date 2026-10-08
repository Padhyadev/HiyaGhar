/**
 * IMAGE PRELOADER SERVICE
 * Pre-fetches and caches all key hero banners, category images, and top product images
 * so that page transitions and menu switches display all images 100% instantly.
 */

const CRITICAL_IMAGE_URLS = [
  '/image/mukhwas/tea%20masala%20banner.webp',
  '/image/mukhwas/hair%20oil%20banner.webp',
  '/image/mukhwas/soap%20banner.webp',
  '/image/gifting_hero_banner.webp',
  '/image/hiya_ghar_story_banner.webp',
  '/image/HerosectionImage1.webp',
  '/image/TEA%20MASALA.webp',
  '/image/Soap/neem.webp',
  '/image/hairoil.webp',
  '/image/gifting_festival.webp',
  '/image/lifestyle_kitchen.webp',
  '/image/jamunbottole_clean.webp',
  '/image/Aavlamukvash.webp',
  '/image/ImageforMukhwash/Amla%20Madhur.webp',
  '/image/ImageforMukhwash/Choco%20Masti.webp',
  '/image/ImageforMukhwash/Digest%20Ease.webp',
  '/image/ImageforMukhwash/Dil%20Bahaar.webp',
  '/image/ImageforMukhwash/Dil%20RAJA.webp',
  '/image/ImageforMukhwash/Hing%20Hajma.webp',
  '/image/ImageforMukhwash/Jamun%20Pop.webp',
  '/image/ImageforMukhwash/Kalkatti-Pan%201.webp',
  '/image/ImageforMukhwash/Mango%20Slice%201.webp',
  '/image/ImageforMukhwash/Paan%20Pop.webp',
  '/image/ImageforMukhwash/Seed%20Mix.webp',
  '/image/ImageforMukhwash/Shahi%20Kharek.webp',
  '/image/ImageforMukhwash/Shahi%20Pan.webp',
  '/image/ImageforMukhwash/Spice%20Ambodia.webp',
  '/image/ImageforMukhwash/Til%20Crunch.webp',
];

export const preloadCriticalImages = (): Promise<void[]> => {
  if (typeof window === 'undefined') return Promise.resolve([]);

  const promises = CRITICAL_IMAGE_URLS.map((url) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve on error so failing one doesn't block
      img.src = url;
    });
  });

  return Promise.all(promises);
};
