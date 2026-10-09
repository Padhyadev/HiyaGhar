# HIYAGHAR Image Inventory Report

## PART 1: PROJECT BASICS
- **Frontend folder:** `hiya2.client` (React + Vite)
- **Backend folder:** `Hiya2.Server` (.NET Core / IIS)
- **Connection:** The React frontend uses Vite's proxy in development (`/api` routed to backend) and is likely served from `wwwroot` in IIS for production.
- **package.json:**
  - **Dependencies:** `framer-motion`, `gsap`, `lottie-react`, `lucide-react`, `react-helmet-async`, `sharp` (dev), `vite`.
  - **Scripts:** `dev`, `build`, `publish:grabweb` (builds to `../publish`), `lint`, `preview`.
- **vite.config:** Sets up proxies for `/api` and `/uploads` to the backend. Configures chunk splitting for `vendor-react` and `vendor-animation`.
- **index.html head:** Preloads `/image/jamunbottole_clean.webp` (LCP hero image). Imports FontAwesome CSS.
- **Router:** Custom router in `hiya2.client/src/App.tsx`. Matches routes directly via `window.location`.
- **Routes:** `/`, `/mukhwas`, `/tea-masala`, `/handmade-soap`, `/hair-oil`, `/gift-hampers`, `/combos`, `/product/:id`, `/cart`, `/checkout`, `/order-confirmation`, `/track-order`, `/profile`, `/wishlist`, `/login`, `/signup`, `/our-story`, and legal/admin pages.
- **Image Libraries:** None (No `react-image`, `lazy-load`, etc).
- **Carousel Library:** None. A custom looping carousel is implemented in `ProductCarousel.tsx`.

## PART 2: WHERE IMAGES LIVE
**Total Image Folders & Sizes (Excluding node_modules/dist/bin/obj):**
- `hiya2.client/public/image` - 41 files (18.78 MB)
- `hiya2.client/public/image/ImageforMukhwash` - 15 files (10.71 MB)
- `hiya2.client/public/image/Banner_image` - 3 files (1.20 MB)
- `hiya2.client/public/image/mukhwas` - 3 files (1.20 MB)
- `hiya2.client/public/image/Soap` - 1 file (0.38 MB)
- `hiya2.client/public/image/Accoutimage` - 1 file (0.14 MB)
- `hiya2.client/public/uploads/product` - 3 files (7.72 MB)
- `Hiya2.Server/wwwroot/uploads/product` - 54 files (34.72 MB)
- `Hiya2.Server/wwwroot/uploads/category` - 15 files (8.17 MB)
- *Note: `Hiya2.Server/wwwroot/image` mirrors `hiya2.client/public/image`.*

**Product Images:** 
Come primarily from (b) the backend database via API which returns paths like `/uploads/product/...` or `/image/ImageforMukhwash/...`. Code: `BestSellerProductsSection.tsx` (Line 29) uses `p.images?.find((img) => img.isPrimary)?.imagePath || p.mainImagePath`.

**Admin Upload Feature:** 
Yes, located in `hiya2.client/src/pages/Admin/ProductManagementPage.tsx` (Lines 358-444). 
- **Limits:** Max file size 2MB.
- **Processing:** Client-side HTML5 Canvas resizing (Max dimension 1200px) and compression (JPEG at 0.85 quality; PNG/WebP keeps transparency). Base64 strings are sent to the API.

## PART 3: IMAGE TABLE
*(Due to strict read-only rules preventing third-party package installation, exact dimensions of WebP images could not be fully extracted via native PowerShell. Sizes are approximated from directory scans.)*

- **Duplicates:** The `image` folder in `hiya2.client/public` is duplicated in `Hiya2.Server/wwwroot` (likely a build artifact or copy).
- **Files > 500 KB:** `TEA MASALA.webp` (~2.8 MB), `Choco Masti.webp` (~1.1 MB), `jamunbottole_clean.webp`.
- **Files with Spaces/Caps:** `TEA MASALA.webp`, `HIYA LOGO (1).png`, `Shahi Pan.webp`, `Amla Madhur.webp`, `Mango Slice 1.webp`, `Choco Masti.webp`.

## PART 4: HOW IMAGES ARE USED IN CODE
- **Image Elements:** Standard `<img>` tags are used across the app (`ProductCard.tsx`, `Hero.tsx`). No shared `<Image />` component exists.
- **Home Page Empty Alts:** 
  Found 11 instances of `alt=""` in the codebase.
  - `Hero.tsx` (Lines 22, 27, 67, 72, 96, 101): Floating decorative background ingredients (Aavla, Jamun).
  - `FeaturedStorySection.tsx` (Lines 37, 45, 53, 61): Decorative layout images.
  - `CategoryCard.tsx` (Line 101): Floating background ingredients.
- **LCP Hero Image:** 
  The Hero component (`Hero.tsx`, Line 78) uses `/image/MasalaKharek.webp` with `loading="eager"` and `fetchPriority="high"`. *Note: `index.html` incorrectly preloads `/image/jamunbottole_clean.webp` instead of the actual hero image.*
- **Logo:** `HIYA LOGO (1).png`. Used in `Header.tsx` as the main navigation brand logo.

## PART 5: BACKGROUND DOWNLOADING (Why 17MB loads on all pages)
**Root Cause:** A service called `imagePreloaderService.ts` is executed in `App.tsx` (Line 106) via `useEffect` on *every* page load.
- **Line & File:** `hiya2.client/src/services/imagePreloaderService.ts` (Line 38)
- **Behavior:** It instantiates `new Image().src = ...` for 28 hardcoded high-resolution images (including the 2.8MB `TEA MASALA.webp` and 1.1MB `Choco Masti.webp`). This forces the browser to silently download ~17MB of images into the cache regardless of the page the user visits.

## PART 6: CAROUSELS
- **Library:** Custom built (No Swiper or Slick).
- **Component:** `hiya2.client/src/components/home/BestSellersSection/ProductCarousel.tsx`.
- **Looping Logic:** Yes, it implements an infinite loop by cloning slides. It creates **3 sets** (2 clones) of the `categoriesList` and injects them all directly into the DOM (Lines 151-155), causing potential DOM bloat if the product list grows large.

## PART 7: SERVER AND CACHING
- **web.config:** Caches `/assets` for 365 days, and `/image` & `/uploads` for 30 days (`Cache-Control: max-age=...`). Adds security headers (`X-Frame-Options`, `Strict-Transport-Security`).
- **MIME Types:** WebP MIME type (`image/webp`) is **NOT** explicitly defined in the provided `web.config`, which could cause IIS to return 404s or serve them as `application/octet-stream` on older IIS versions.
- **Deployment:** The command `npm run publish:grabweb` compiles Vite and outputs directly to `../publish`. The server likely serves this via IIS pointing to the publish output.

## PART 8: RISKS AND QUESTIONS
**Risks:**
- **Hardcoded Paths:** Renaming or moving files in `/public/image` will break `imagePreloaderService.ts`, `Hero.tsx`, and `ProductCarousel.tsx` (e.g., fallback images).
- **Database Coupling:** Product/Category image paths are saved in the database as absolute relative paths (`/uploads/...`). Changing the folder structure will break all existing database records.
- **File Naming:** Images with spaces (`HIYA LOGO (1).png`) can cause URL encoding issues in CSS or when sharing links (e.g., `og:image`).
- **Preload Mismatch:** `index.html` preloads the wrong LCP image, wasting bandwidth and delaying the actual LCP render.

**Questions you need to answer before Phase 2:**
1. Can we remove the aggressive 17MB `imagePreloaderService` and rely on standard lazy loading / router-based prefetching instead?
2. Should we update IIS `web.config` to explicitly support `.webp` and `.avif` MIME types?
3. Do we need to migrate hardcoded fallback image strings to a centralized constant file to prevent breakages during renaming?
