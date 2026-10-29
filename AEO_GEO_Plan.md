# HIYAGHAR – AEO & GEO Implementation Plan

Source: `HIYAGHAR_Requirements_FOR_AEO&GEO.pdf` (28 Oct 2026). Plan date: 29 Oct 2026.

## Progress (29 Oct 2026, not yet deployed)

| Item | Status |
|---|---|
| W1 Crawlable HTML | ✅ Server content now rendered inside `#root` (real DOM, not `<noscript>`). React replaces it on load. |
| W2 Slug URLs | ✅ `/product/{slug}` from the product name (no DB change). `/product/{id}` and wrong-case slugs return 301. Sitemap, canonical, breadcrumbs and category links use slugs. Fixes Mukhwas card links, which used to get a 404 from the server. ⏳ Occasion pages (`/gift-hampers/wedding`) not started. |
| W3 Head/H1 | ✅ No change needed: every page already has one H1. |
| W4 Schema | ✅ Full address, Store (LocalBusiness) on home and contact, founder Person, AboutPage → founder. |
| W5 DOM content | ✅ FAQ answers and product tabs always in the DOM. Loop copies in the combo strip and ticker are `aria-hidden`. Home category card title is a real link. Empty `alt`s are decorative (correct). |
| W6 Product content (server HTML) | ✅ Server outputs the full description, saved ingredients/benefits and each size with its price. ⏳ Copy and new fields still needed from the client. |
| W9 | ✅ `llms.txt` added. Code-splitting was already in place. |
| W2 Occasion pages | ✅ `/gift-hampers/{slug}` (server pre-render, CollectionPage + breadcrumbs, sitemap). `?category=` returns 301. Occasion cards are real links. |
| W6 Product fields | ✅ Admin: How to Use, Shelf Life, FAQs (stored in HIYA_META, no DB change). Product page shows them. Server outputs FAQPage JSON-LD. Placeholder ingredients, benefits, nutrition and description removed. ⏳ Content still to be filled in. |
| G4 GA4 (code) | ✅ page_view, view_item, add_to_cart, begin_checkout, purchase (once per order). Off until `VITE_GA4_MEASUREMENT_ID` is set in `hiya2.client/.env.production`. CSP allows Google. |
| G3 Merchant feed | ✅ `/feeds/google-products.xml`: one item per variant with its own photo, price/sale price, stock. ⏳ Add the URL in Merchant Center. |

## 0. Where the site stands today

The PDF assumes a plain client-rendered React + Vite site. The real stack is React + Vite **served by ASP.NET**, and much of the SEO groundwork already exists (commit `d891d01 Phase 4 (SEO foundation)`):

| Already in place | Where |
|---|---|
| Per-route title, meta description, canonical, Open Graph, robots noindex | `Hiya2.Server/Seo/SeoMarkup.cs` `BuildHead` |
| Server-injected crawlable HTML (H1, intro, product price/stock, category product links, FAQ Q&A) | `Hiya2.Server/Seo/SeoPageRenderer.cs` |
| JSON-LD: Organization, WebSite, Product + Offer per variant, BreadcrumbList, ItemList, FAQPage | `SeoMarkup.cs` / `SeoPageRenderer.cs` |
| Real 404 status for unknown URLs, 301s for alias URLs and trailing slashes | `Hiya2.Server/Program.cs` (routeAliases + `MapFallback`) |
| Generated `sitemap.xml`, `robots.txt` with `Allow: /` | `Controllers/SitemapController.cs`, `hiya2.client/public/robots.txt` |
| One shared route/SEO config for client and server | `hiya2.client/src/seo/routes.json` → `wwwroot/seo/routes.json` |
| No AggregateRating emitted (correct; ratings aren't from real reviews yet) | `SeoMarkup.ProductNode` |

**Gaps found in the code:**
- The server-rendered content sits inside `<noscript>`. Some parsers skip `<noscript>`, and it carries less weight than normal DOM content.
- Product URLs are numeric (`/product/1`). There are no slugs and no occasion pages such as `/gift-hampers/wedding`.
- The FAQ page only renders an answer after it is clicked (`{isOpen && ...}` in `pages/Faq/FaqPage.tsx`). Product tab panels also render only the active tab (`ProductDetailPage.tsx:56`, `:1108`).
- `CustomizeComboSection.tsx:75` renders items three times (`[...items, ...items, ...items]`). The header marquee duplicates items too.
- Header navigation uses about 56 `onClick` handlers and only 3 `<a>` tags. Crawlers can't follow `onClick` buttons.
- `ProductDetailPage.tsx` and `AuthPage.tsx` each have 2 `<h1>`. There are 7 images with `alt=""`.
- No LocalBusiness schema. The organization config has no street address or PIN code (it should be 303, APM Mall Complex, Ghatlodiya, 380061). No AboutPage or Person schema.
- No GA4 or analytics at all.
- No `llms.txt`, no blog or content hub, and no product-level FAQs, ingredients, shelf-life or how-to-use fields in the server HTML.
- Heavy client dependencies (`@xenova/transformers`, gsap, framer-motion, jspdf, html2pdf, lottie) need checking to make sure they are lazy-loaded.

**Decision on W1 (SSR):** don't migrate to vite-react-ssg or Next.js. The app uses custom pushState routing, and the server already renders SEO HTML per URL. Improving that existing renderer gives the same crawler result for a fraction of the work.

> ⚠️ The server migrates the **remote hosted DB** on startup (see `appsettings.json`). Any step that adds columns (slugs, product content fields, articles) must have its migration reviewed and applied deliberately, not by just running the app locally.

---

## Phase 1: Weeks 1–2 (W1–W3 + G1, G2, G5)

### Step 0: Baseline check (30 min)
- `curl -s https://hiyaghar.com/product/1 | grep -E "<title>|<h1>|ld\+json|Price"`. Do the same for `/`, `/mukhwas`, `/faq` and `/nonexistent` (expect 404).
- Run the Rich Results Test and PageSpeed Insights on home, a category page, a product page and the FAQ page. Save the results as the "before" numbers.

### W1: Crawlable HTML outside `<noscript>`
- In `SeoMarkup.Inject`, render the crawlable body **inside `<div id="root">`** instead of `<noscript>`. React's `createRoot().render()` replaces it on load, so users see no change, and crawlers get real DOM content.
- Give it minimal CSS so the brief pre-hydration flash looks acceptable (logo, H1, text).
- Check that the Playwright tests in `hiya2.client/tests` still pass.

### W2: Slug URLs and occasion pages
1. Add a `Slug` column (unique, nullable at first) to `Product`. Backfill it from `ProductName` (`beet-radiance-beetroot-soap`). Generate it on create, and edit it in the admin product form.
2. Server: add the route `/product/{slug}`. `/product/{id}` returns **301** to the slug URL. Update the sitemap, canonical, breadcrumbs and `ItemList` links.
3. Client: build product links from the slug. `ProductDetailPage` loads by slug (new API `GET /api/product/slug/{slug}`, with the id kept as a fallback).
4. Gift hamper occasions: add a slug to the occasion, plus a route `/gift-hampers/{occasion}`. Give each occasion its own H1, intro and product list in the server renderer and the React page, and add them to the sitemap.
5. Unknown slugs return 404. This already works through the fallback once the slug lookup is wired in.

### W3: Head tags and H1s
- Head tags are already unique per route. Audit `routes.json` titles and descriptions for length (title ≤ 60 characters, description 140–160 characters).
- Fix the double `<h1>` in `ProductDetailPage.tsx` and `AuthPage.tsx`. Make sure every category hero has exactly one H1 that matches `routes.json`.

### Google side (no code)
- **G1** Search Console: add a Domain property (DNS TXT record), submit `https://hiyaghar.com/sitemap.xml`, and request indexing for the key URLs after Phase 1 is deployed.
- **G2** Business Profile: use the exact name, address, phone and hours from `routes.json` `organization`. Category: Gift shop, plus a secondary food category.
- **G5** Bing Webmaster Tools: import from Search Console and submit the sitemap.

---

## Phase 2: Weeks 2–4 (W4–W6 + G3, G4)

### W4: Structured data
- Add `streetAddress` and `postalCode` to `routes.json` `organization`. Use them in Organization.
- Add a **LocalBusiness** node (type `Store`) on `/` and `/contact-us`: address, geo, opening hours, phone and `sameAs`.
- `/our-story`: add an **AboutPage** node with `mainEntity` → **Person** (Priti Shah, founder) and a link to the Organization.
- Keep AggregateRating off until there are real approved reviews. When there are, compute it from the `Review` table, never from `Product.Rating` (which defaults to 5.0).
- Validate every page type in the Rich Results Test and the Schema Markup Validator.

### W5: Content in the DOM
- `FaqPage.tsx`: always render the answers and toggle with CSS (`hidden` class or `max-height`). Keep `aria-expanded`.
- `ProductDetailPage.tsx`: render all tab panels and hide the inactive ones with CSS.
- `CustomizeComboSection.tsx`: render the list once and do the infinite scroll with a CSS animation. Alternatively, mark the duplicate copies `aria-hidden="true"` and skip them in the server HTML. Do the same for the header marquee.
- Header, footer, category cards and product cards: replace `onClick={() => navigate(...)}` with `<a href="/path" onClick={spaNavigate}>`. Add one small `Link` component that calls `preventDefault` and then pushState.
- Replace the 7 `alt=""` with descriptive text, unless the image is purely decorative. Use the product name as the default alt for product images.

### W6: Product and category copy (content plus small schema work)
- DB/admin: add product fields `Ingredients`, `NetWeight`, `ShelfLife`, `HowToUse` (some may already feed the Ingredients/Nutrition tabs, so check first). Add a `ProductFaq` table (4–6 per product).
- Server renderer: output those fields, plus a 2-sentence direct-answer summary at the top. Product FAQs also go into an FAQPage node on the product.
- Categories: a 150–250 word guide and 3–5 FAQs per category. Store them in `routes.json` (or the DB if the client wants to edit them). Render them in both React and the server HTML.
- Copy task for the client: plain-English descriptors for regional names, e.g. "Drakshawati (raisin-based digestive mukhwas)" and "Hing Hajma (asafoetida digestive tablets)".

### Google side
- **G3** Merchant Center: either generate a product feed from the API (`/feeds/google-products.xml`: id, title, description, link, image, price INR, availability, brand, `identifier_exists=no`) or rely on the Product schema. Then set up shipping (free over ₹500) and the return policy.
- **G4** GA4 (needs code): add gtag with the CSP nonce, allow `googletagmanager.com` and `google-analytics.com` in the CSP, and fire `view_item`, `add_to_cart`, `begin_checkout` and `purchase`. Build the AI-referrer report in GA4 for chatgpt.com, perplexity.ai, gemini.google.com and copilot.microsoft.com.

---

## Phase 3: Week 4 onward (W7–W9 + G6–G9)

### W7: Content hub (`/journal`)
- `Article` model: slug, title, summary, body (HTML/Markdown), author, published/updated dates, hero image, related product IDs. Add admin CRUD for it.
- Routes `/journal` and `/journal/{slug}`, server-rendered with **Article** JSON-LD (author Person, dates). Add them to the sitemap.
- First 10–15 articles (the client writes or approves the copy): what mukhwas is, tea masala chai recipe, cold-process soap explained, hair oil guide, Diwali/wedding gift ideas, and so on. Link each one to the relevant products.

### W8: Trust pages
- Our Story: founder (Priti Shah), sourcing, process, photos. Add the AboutPage/Person schema from W4.
- FSSAI number: it already shows in the footer from store settings. Confirm it is filled in, and add it to the server HTML and the Organization schema.
- Review the shipping, refund, privacy and terms pages for accuracy. Check health claims on hair oil and soap against FSSAI/AYUSH advertising rules (client and legal).

### W9: Files and speed
- Add `public/llms.txt` with a short brand summary and links to the categories, FAQ, Our Story and the journal.
- Performance: make sure `@xenova/transformers`, jspdf, html2pdf, lottie and gsap load only on the pages that use them (`import()`). Convert the remaining PNG/JPG images to WebP. Set `width`/`height` on images to avoid CLS. Add `fetchpriority="high"` to the hero image.
- Targets: LCP < 2.5 s, CLS < 0.1 on mobile PageSpeed.
- Optional: IndexNow ping on product create/update, for Bing.

### Google side
- **G6** Make the name, address, phone, logo and description identical on Instagram, Facebook, WhatsApp Business and Justdial. Add every profile URL to `sameAs`.
- **G7** Ask for reviews (link in the order confirmation email), and reach out to blogs for mentions.
- **G8** After each release, run Rich Results, Schema Validator and PageSpeed, and check the Search Console Enhancements reports.
- **G9** Each month, test 30 buyer prompts and log the results in a sheet (prompt, engine, cited Y/N, URL cited).

---

## Who does what

| Owner | Items |
|---|---|
| Developer | W1–W5, W6 schema/fields, W7 platform, W9, G4 code, G3 feed |
| Client / content | W6 copy, W7 articles, W8 Our Story text, FSSAI/AYUSH claim review |
| Client / marketing | G1–G3 accounts, G5–G7, G9 monthly check |

## Definition of done (per release)
- `curl` of each page type shows the H1, description, price/FAQ text and JSON-LD outside `<noscript>`.
- Rich Results Test shows no errors for Product, Breadcrumb, FAQ, Organization and LocalBusiness.
- `/product/1` → 301 → slug URL. An unknown slug returns 404.
- The sitemap lists only canonical slug URLs.
- Playwright suite passes. Mobile PageSpeed LCP < 2.5 s, CLS < 0.1.
