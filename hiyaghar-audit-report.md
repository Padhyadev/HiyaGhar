# HIYAGHAR.com Audit Report (Partial)

**Site:** https://hiyaghar.com/
**Audit date:** 9 October 2026

---

## 0. Scope and limitations (read first)

This audit is **partial**. Only content that I could actually read is reported. Everything else is marked **Not verified**.

| Requested check | Status | Reason |
|---|---|---|
| Raw HTML via curl, headers, redirects | Not done | Sandbox could not resolve `hiyaghar.com` |
| Headless browser rendering and screenshots | Not done | No browser available and no network path to the site |
| Lighthouse (mobile and desktop) | Not done | Same as above |
| Responsive tests (320 / 375 / 768 / 1440 px) | Not done | Cannot render pages |
| robots.txt and sitemap.xml | Not done | Fetch was refused, and a search found nothing |
| Page text and metadata | **Done for 12 pages** | Fetched via a web-fetch tool that returns simplified text and metadata, not raw HTML |

**Pages read:** `/`, `/mukhwas`, `/tea-masala`, `/handmade-soap`, `/hair-oil`, `/gift-hampers`, `/combos`, `/our-story`, `/contact-us`, `/faq`, `/shipping-policy`, `/product/13`.

**Pages not read:** `/privacy-policy`, `/terms-conditions`, `/refund-policy`, and product pages 1–12 and 14 (their names were seen only on category pages).

**Tool caveat:** the fetch tool showed H1s but no H2/H3, images, JSON-LD, `<html lang>`, forms or cart UI. That may mean they are missing, were stripped by the tool, or load via JavaScript. They are **not** counted as defects below.

---

## 1. Executive summary

**Scores:** none available (Lighthouse and accessibility tests were not run).

### Top 10 issues verified from fetched content

1. `&amp;` appears literally in title, og:title and twitter:title on `/`, `/gift-hampers` and `/our-story`.
2. Every non-product page uses the same og:image, the logo file `/image/HIYA%20LOGO%20(1).png`.
3. Brand name is written three ways: HIYAGHAR, HIYA GHAR, Hiya Ghar.
4. Category names differ between nav, title, H1 and breadcrumb (e.g. "Artisanal" vs "Premium Natural" Mukhwas).
5. `/gift-hampers` lists 8 individual products, not hampers or occasions.
6. Product URLs are numeric (`/product/13`), with no keywords.
7. Product page body shows the templated meta description as its only visible copy.
8. Product naming pattern is inconsistent ("Dil Khush", "Digestive", "Masala Kharek" lack "Mukhwas").
9. British and American spelling are mixed ("flavours" vs "flavors/colors").
10. FAQ mentions a "Track Order" page that appears in no link I saw.

---

## 2. Issue table

Severity: High / Medium / Low. "Unverified" means it needs checking on the live site.

| # | Page(s) | Category | Severity | What is wrong | Exact fix |
|---|---|---|---|---|---|
| 1 | `/`, `/gift-hampers`, `/our-story` | SEO | High | `title`, `og:title`, `twitter:title` show literal `&amp;` (e.g. "Handcrafted Natural Mukhwas &amp; Wellness \| HIYAGHAR"). H1 on the same pages shows a plain `&`. | Escape once only. Confirm with `curl -s URL \| grep -i "<title"`. If the source has `&amp;amp;`, fix the template so it outputs `&amp;` once. |
| 2 | All non-product pages | SEO | Medium | Same logo PNG used as og:image and twitter:image. Filename has spaces and brackets. Size unknown. A square logo in a `summary_large_image` card will likely be cropped. | Create 1200×630 branded images. Rename to e.g. `hiyaghar-og-default.jpg`. |
| 3 | `/product/13` | SEO | Low | og:image is a `.webp` with a UUID filename. Some social scrapers handle webp poorly (unverified). | Serve a 1200×630 JPG/PNG for og:image. |
| 4 | Product pages | SEO | Medium | Numeric URLs (`/product/13`). | Use slugs like `/product/drakhsha-wati-mukhwas`, with 301 redirects from the old URLs. |
| 5 | Product pages | SEO | Medium | Meta description follows one template ("Buy X from the HIYAGHAR Mukhwas collection, handcrafted in small batches. See price…"). Product 13 shows it as body text. | Write unique descriptions (flavour, ingredients, pack sizes). Add real product copy to the page. |
| 6 | Most pages | SEO | Low | Titles are roughly 21–49 characters (approximate counts), under the 50–60 target. No keywords such as "buy", "online", "Gujarati", "Ahmedabad". | Extend, e.g. "Buy Gujarati Mukhwas Online \| Handcrafted in Ahmedabad \| HIYAGHAR". |
| 7 | `/tea-masala`, `/hair-oil` | SEO | Low | Single-product categories. Category and product page compete for the same keywords ("Tea Masala" is both). | Add intro copy to the category, or consolidate. Give the product a more specific name. |
| 8 | Home, categories | SEO | Medium | Only one H1 and nav links seen. No H2s on any page. No links from the homepage to products. | **Unverified.** Compare raw HTML with rendered DOM. Add section headings and featured product links. |
| 9 | `/combos` | SEO | Medium | Only intro text came through. The builder may be JavaScript-only. | **Unverified.** Check raw HTML. Consider prerendering and static text about combo options. |
| 10 | Nav / H1 / title | Other | Medium | Category names differ (see section 4). | Pick one name per category and use it everywhere. |
| 11 | `/our-story`, `/shipping-policy` | Spelling | Medium | "HIYA GHAR" and "Hiya Ghar" vs "HIYAGHAR". | Choose one form (HIYAGHAR if that is the logo). |
| 12 | `/mukhwas` meta, `/faq` | Spelling | Low | "flavours" (British) vs "colors", "flavors" (American). "Customize" is American. | Choose one convention and apply it site-wide. |
| 13 | `/contact-us`, `/shipping-policy` vs `/faq` | Spelling | Low | Curly apostrophes (’) on some pages, straight (') on others. | Use one style. |
| 14 | `/our-story` | Spelling | Low | H1 "Every Goodness Has A Heartfelt Story." is awkward. "Goodness" is uncountable and "A" is capitalised. | "Every Good Thing Has a Heartfelt Story." |
| 15 | `/gift-hampers` | Other | High | Meta promises gifts "by occasion: wedding, birthday, housewarming…". Page lists 8 individual products already sold elsewhere. | Create real hamper products and occasion sections, or retitle the page. |
| 16 | `/faq` | Other | Medium | References a "Track Order" page that is not in any crawled link. | **Unverified** whether it exists. Link it in the footer or remove the mention. |
| 17 | `/faq` | Other | Low | Strong claims ("100% natural", "zero chemical preservatives", soaps suit sensitive skin, "Ayurvedic" hair oil) with no evidence shown. | Add ingredient lists. Review claims against Indian cosmetics/AYUSH rules (I cannot confirm the legal position). |
| 18 | Category pages | Spelling | Low | Count lines differ: "Showing 7 Mukhwas products", "Showing 1 Tea Masala product", "Showing 8 products". | Standardise the phrasing. |
| 19 | Product names | Spelling | Low | "Dil Khush", "Digestive", "Masala Kharek" lack "Mukhwas". Soaps "Kesudo Radiance", "Neem Aloe Fresh", "Rice & Potato Bliss" lack "Soap". "Beet Radiance Handmade Beetroot Soap" is redundant. | Adopt one pattern, e.g. "Name + Type". |
| 20 | `/product/13` | Spelling | Low | "Drakhsha Wati": a more common romanisation is likely "Draksha" ("Drakshavati" is also used). I am not certain which is dominant. | Check Google Trends / Search Console, then use the winner in the H1 and mention others once in the body. |
| 21 | `/handmade-soap` | Spelling | Low | "Glow Craft Detan Soap": "Detan" is usually written "De-Tan". "cold process" / "cold-process" / "cold-processed" are mixed. | "De-Tan"; use "cold-process soap" consistently. |
| 22 | `/shipping-policy` | Other | Low | Only the intro paragraph came through. Meta states free delivery ≥ ₹500, ₹40 below, ₹99 express. I could not compare it with the body or FAQ (24–48 h dispatch, 2–4 / 4–7 days). | **Unverified.** Compare all three sources. |
| 23 | `/contact-us` | Other | Medium | Phone, email and city visible. No form seen. | **Unverified.** Test the contact form in a browser. |
| 24 | Site-wide | Other | Medium | No cart, checkout or login links in crawled links. | **Unverified.** Test add-to-cart, checkout, UPI and COD. |

---

## 3. What looks good (verified)

- Self-referencing canonical on every page read.
- `robots` meta is `index,follow`.
- `og:locale` is `en_IN`.
- Each page has a unique title.
- Meta descriptions appear to be roughly 120–160 characters (not counted exactly).
- Product images are served as webp.

---

## 4. Naming inconsistencies in detail

| Page | Nav label | `<title>` | H1 |
|---|---|---|---|
| `/mukhwas` | Artisanal Mukhwas | Premium Natural Mukhwas Collection | Premium Mukhwas |
| `/tea-masala` | Traditional Tea Masala | Authentic Traditional Tea Masala | Tea Masala |
| `/handmade-soap` | Handmade Soap | Natural Handmade Cold Process Soaps | Handmade Soap |
| `/hair-oil` | Ayurvedic Hair Oil | Ayurvedic Herbal Hair Oil | Hair Oil |
| `/gift-hampers` | Gift Hampers | Festive & Celebration Gift Hampers | Gift Hampers |
| `/combos` | Wellness Combos | Customize Your Combo Pack | Customize Combo |
| `/faq` | FAQs & Help | Frequently Asked Questions (FAQ) | Frequently Asked Questions |

The `/product/13` breadcrumb says "Artisanal Mukhwas".

---

## 5. Performance

**No measured data.** Lighthouse was not run, so LCP, CLS, INP, TBT, FCP, page weight, caching, compression, security headers, unused JS/CSS, render-blocking resources and lazy loading are all **not verified**.

Run:

```bash
npx lighthouse https://hiyaghar.com/ --form-factor=mobile --output=html --output-path=home-mobile.html
npx lighthouse https://hiyaghar.com/mukhwas --form-factor=mobile --output=html --output-path=mukhwas-mobile.html
npx lighthouse https://hiyaghar.com/product/13 --form-factor=mobile --output=html --output-path=product-mobile.html
```

Or use https://pagespeed.web.dev/. Also run:

```bash
curl -sIL https://hiyaghar.com/
curl -s https://hiyaghar.com/robots.txt
curl -s https://hiyaghar.com/sitemap.xml
curl -s https://hiyaghar.com/ | grep -iE "<title|application/ld\+json|<html|hreflang|<h[1-3]"
```

---

## 6. Mobile / responsive check

**Not done.** No screenshots exist and no layout bugs are reported.

Areas to test (these are **risks, not findings**):

- **Mobile menu:** 13 links (6 categories, Our Story, Contact, FAQ, 4 policies). Check open, close and scroll.
- **Product grids:** 7–8 items on `/mukhwas` and `/gift-hampers`. Check reflow at 320–375 px.
- **Product page:** price is a range (₹60 – ₹120), suggesting a size selector. Check tap targets ≥ 44 px.
- **`/combos` builder:** most likely place for overflow or cut-off elements.
- **Contact:** phone as `tel:` link and email as `mailto:`.
- **Checkout:** UPI/COD fields, pincode input, keyboard type.

Test in Chrome DevTools (F12 → device toolbar) at 320×568, 375×812, 768×1024 and 1440×900. Check horizontal scroll, text under 14 px, tap targets under 44 px, image overflow and stretching.

---

## 7. Accessibility and functionality

**Not verified.** Forms (contact, newsletter), add-to-cart, checkout, color contrast, keyboard navigation, ARIA labels and form labels were not tested.

---

## 8. Prioritised action plan

### Quick wins (under 1 hour)
- Fix the `&amp;` titles (issue 1).
- Pick one brand spelling and one name per category (10, 11).
- Rename the OG logo file and add a 1200×630 default image (2).
- Link or remove the "Track Order" mention (16).
- Standardise spelling convention and apostrophes (12, 13, 14).

### Medium effort
- Write unique product meta descriptions and real product body copy (5).
- Standardise product names and decide the "Drakhsha" spelling (19, 20, 21).
- Turn `/gift-hampers` into real hamper products (15).
- Add JSON-LD (Product, BreadcrumbList, FAQPage, Organization) if missing.
- Add intro text and headings to category pages (7, 8).

### Larger projects
- Move to keyword slugs with 301 redirects (4).
- Create SEO content for "buy mukhwas online", "Gujarati mukhwas", "mukhwas Ahmedabad" (search volume not measured).
- Add SSR or prerendering if the site is client-side rendered (8, 9).
- Full accessibility and mobile test pass, then fix by viewport.

---

## 9. Next step

Send any of the following and the report can be completed with scores, screenshots and exact bugs:

- Lighthouse JSON or HTML, or PageSpeed Insights results.
- Raw HTML of the homepage, a category page and a product page.
- Screenshots at 320, 375 and 768 px.
