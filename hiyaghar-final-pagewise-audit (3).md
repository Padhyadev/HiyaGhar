# HIYAGHAR.com — Page-wise Audit: Laptop, Desktop and Mobile (9 Oct 2026)

## How this was tested (read once)

- **Desktop (about 1534 px):** real live browser tab, clicking and typing.
- **Mobile, tablet, laptop and large screens:** the browser window cannot be resized in this session, and the site blocks being embedded in a frame. So I took a snapshot of each rendered page, copied the site's own CSS into a frame of the exact width, and measured it at 320, 375, 414, 768, 1024, 1366, 1440, 1920 and 2560 px, plus screenshots at 375 px. This shows real layout, overflow, font sizes and tap-target sizes.
- **What this cannot show:** real touch behaviour, opening/closing the hamburger menu, the mobile keyboard that appears, landscape mode, and JavaScript-driven behaviour on mobile. These are marked NOT TESTED.
- **Not done:** Lighthouse (DevTools cannot be opened here), a valid contact-form submission (would email your inbox), account login/sign-up, payment (stopped at the payment screen).
- I left the cart empty after testing.

---

## 1. Problems on every page (mobile / laptop / desktop)

| Area | Finding | Evidence |
|---|---|---|
| Mobile 320 px header | The header icon group is wider than the screen, so the cart icon is pushed off the right edge by about 16 px | Measured on `/`, `/mukhwas`, `/product/5`, `/combos`, `/contact-us`: `header-right` and the cart button end at x 336 in a 305 px content width |
| Mobile 375 px header | Hamburger, logo and four icons (search, account, wishlist, cart) are squeezed together; the logo touches the search icon | Screenshot of `/` at 375 px |
| Mobile tap targets | Many controls under 44 px: breadcrumb links 17 px tall ("Home" 37×17), review dots 9×9 px, Add to Cart 128×32, Sort Products 150×34, Categories 130×34, filter chips about 35 px tall, phone link 210×25, "Chat on WhatsApp" 150×27 | Measured at 320/375/414/768 px |
| Mobile font size | "Add to Cart" and "Buy Now" labels 10.5 px at 320 px | `/mukhwas` at 320 px |
| Laptop 1024 | Header icon buttons 42×42 (slightly under 44) | Measured |
| Floating widgets | WhatsApp button and scroll-to-top button sit in the bottom-right corner and cover card buttons on mobile ("Add to Cart" on the home popular products row is partly covered in the screenshot) | Screenshot at 375 px |
| Horizontal scroll | None found at any tested width (320 to 2560) on the pages measured | Page width equals visible width |
| Large screens 1920 / 2560 | No overflow; some sections stop growing at 1440 px while background bands stay full width | Measured on `/` |
| Console / network | No console errors captured (logging started mid-session) | |
| Missing page data | No FSSAI licence number, GSTIN or full address anywhere I read | |
| Brand name | HIYAGHAR / Hiya Ghar / HIYA GHAR / Hiya used for the same brand; the logo says "HIYA" | Footer, Our Story, policies |

---

## 2. Page by page

### Home `/`
- **Mobile:** layout works at 320–768 px, single column, product grid becomes 2 columns; the whole page is 12,131 px tall at 375 px (very long). Hero has a large empty gap between text and the bottle image. Product card "Add to Cart" wraps onto two lines ("Add to / Cart") at 375 px. Review dots 9×9 px.
- **Laptop / desktop (1024–2560):** OK, no overflow.
- **Errors:** WELCOME10 banner promise fails in the cart (see Cart). Reviews section: "4.2 / 5 Based on 4 verified customer reviews" while the Beet Radiance product page and Rice & Potato Bliss page show reviews only partly; one reviewer is shown as "Akshy j." (lowercase "j"; looks like a test review). Carousel clones repeat headings three times in the page.
- **Grammar / text:** "Squeeze In Some Goodness", "Gifts That Say It Better." fine. "Thoughtful" is repeated four times in the occasion cards ("thoughtful gifts", "Thoughtful Hiya hampers", "Thoughtful gifting"). Reviewer name "Akshy j." → "Akshy J." Reviewer "Review T." looks like a placeholder name.

### Mukhwas `/mukhwas`
- **Mobile:** 2-column cards, fine. Sort and Categories buttons 34 px tall. "Add to Cart / Buy Now" 10.5 px at 320 px.
- **Laptop / desktop:** OK.
- **Errors:** Listing quick-add bug: Chocolate Mukhwas shows "₹120 / 200 g • Pouch" but Add to Cart puts it in the cart at ₹60. Cause confirmed: on the product page, choosing 200 g changes the price to ₹120, but the listing's Add to Cart uses the 100 g price. All card descriptions are the same sentence.
- **Grammar / text:** "Digestive" (incomplete product name; should be "Digestive Mukhwas"). "Dil Rajan Mukhwas" vs image file "Dil RAJA". "Drakhsha Wati" spelling: please confirm (commonly "Draksha"). Price digits are separated in the page markup, so a screen reader reads "₹ 1 2 0".

### Tea Masala `/tea-masala`
- **Mobile / desktop:** layouts OK.
- **Errors:** Only 1 product. The strip "Fresh & Quality Ingredients — Hand-picked organic seeds, Gulkand & sun-dried spices … airtight glass jars" and the bottom promo "Discover Your Favourite Mukhwas" are about mukhwas, not tea masala.
- **Text:** Called "Tea Masala" in listings and "Royal Tea Masala" on Our Story.

### Handmade Soap `/handmade-soap`
- **Mobile / desktop:** OK.
- **Errors:** Listing shows Add to Cart (Beet Radiance "10 LEFT"), but the product pages for Beet Radiance (`/product/1`), Glow Craft Detan (`/product/2`) and Rice & Potato Bliss (`/product/5`) all say "Out of Stock". Rice & Potato Bliss: ₹70 with MRP ₹290 = "76% OFF" (other soaps MRP ₹130–190), so the MRP is probably wrong. The ingredient strip and the Mukhwas promo repeat from other pages.
- **Text:** "Detan" → "De-Tan". "Beet Radiance Handmade Beetroot Soap" repeats "Beet" and "Handmade" (suggest "Beet Radiance Beetroot Soap"). Soap packaging in the images shows "Hridhay Connect" instead of HIYA branding.

### Hair Oil `/hair-oil`
- **Mobile / desktop:** OK.
- **Errors:** One product, "ONLY 1 LEFT". No bottle size (ml) on the card. Same mukhwas-specific strip and promo.
- **Text:** Ayurvedic claim "for scalp nourishment" is acceptable but keep claims modest (AYUSH rules).

### Gift Hampers `/gift-hampers`
- **Mobile / desktop:** OK.
- **Errors:** The 8 "hampers" are single items (soaps, 100 g mukhwas, tea masala, hair oil), all described as "Curated gift hamper, handcrafted with care." The occasion chips (Wedding, Birthday, Housewarming, Festival, Corporate) were not tested for filtering. The home page says "2 GIFTS / 4 GIFTS / 5 GIFTS / 1 GIFT" per occasion; the page shows 8 products.
- **Text:** Breadcrumb "Gifting" vs page title "Gift Hampers".

### Combos `/combos`
- **Mobile 375:** box cards stack well; filter chips about 35 px tall.
- **Errors (Critical):** The page promises "Save 10% / 15% / 20%" but its own note says "Items are added to your cart at their regular price — the discount shown here isn't applied at checkout yet." The home page and meta description repeat the savings promise.
- **Text:** Tea Masala weight options read "50 g / 100 g / 150" (missing "g"). Some products show "Weight", others also "Packing: Pouch / Bottle" with no explanation.

### Our Story `/our-story`
- **Mobile / desktop:** not individually measured for overflow; text page, low risk.
- **Text:** "HIYA GHAR" / "Hiya Ghar" vs "HIYAGHAR" elsewhere. "Born from an Ahmedabad Home Kitchen" → "Born in an Ahmedabad Home Kitchen". Strong claims: "100% Natural & Chemical-Free", "Pure & Safe", "preserves essential nutrients", "FSSAI registered brand" (no licence number given).

### Contact `/contact-us`
- **Mobile 375:** card layout fine. Form fields use correct types (name text, email "email", phone "tel"). Phone link 25 px tall; WhatsApp link 27 px tall.
- **Tested:** empty submit, invalid email, invalid phone: all show clear errors; the phone box removes letters.
- **Errors:** No captcha. No `autocomplete` attributes on the fields. Valid submit NOT TESTED.
- **Text:** "within 24 hours" while support hours are Mon–Sat 10 AM–7 PM.

### FAQ `/faq`
- **Mobile 375:** search box placeholder "Search questions (e.g., mukhwas, shippin…" is cut off; category tabs ("All Questions", "About HIYAGHAR") run off to the right (scrollable).
- **Tested:** 10 accordions open and close.
- **Errors:** Dispatch "24–48 hours", delivery "2–4 / 4–7 business days" contradicts the shipping policy and checkout.
- **Text:** "Yes, absolutely" to 100% natural and preservative-free and "suitable for sensitive skin" are absolute claims. It mentions the "Track Order" page; the contact page calls it "Live Order Tracking".

### Shipping Policy `/shipping-policy`
- Free standard shipping ₹500+, ₹40 below, Express ₹99 (matches checkout). Same-day dispatch before 1 PM, standard "3–5 business days", Express "1–2". Contradicts the FAQ (see above). Page uses "Hiya Ghar" in text and "HIYAGHAR" in the heading.

### Refund Policy `/refund-policy`
- Clear and readable. It is reachable from two footer links with two different names ("Returns & Refunds" and "Cancellation Policy"), and the contact page calls it "Return & Refund Policy". Pick one name.

### Privacy Policy `/privacy-policy` and Terms `/terms-conditions`
- Only the heading and first paragraph were visible to me. Full text NOT REVIEWED.

### Product pages `/product/1`, `/2`, `/5`, `/9`, `/14`
- **Mobile 375 (`/product/5`):** single column, quantity box and buttons fine; tabs wrap to two rows; breadcrumb links 17 px tall.
- **Errors:**
  - Soaps `/product/1`, `/2`, `/5` are Out of Stock but still show "Dispatched in 24 Hrs" and "Airtight Moisture Seal".
  - Soap breadcrumb says "Mukhwas".
  - Soap pages have a "Nutritional Facts" tab: "Energy 385 kcal, Carbohydrates 68.5 g, Protein 6.2 g, Total Fat 9.8 g, Dietary Fiber 14.2 g". The same numbers appear on Dhana Dal Mukhwas (`/product/9`). This is template data and must not stay on a food or soap label.
  - Ingredients appear to be templates too: Dhana Dal Mukhwas lists "Sun-dried Rose Gulkand, Silver Cardamom, Sweet Coconut Flakes, Menthol Crystals"; Rice & Potato Bliss lists "Organic Coconut Oil, Pure Neem Extracts, Cold-Pressed Aloe Vera".
  - Reviews tab: "0.0 Based on 0 reviews" although the home page shows reviews.
  - "Frequently Bought Together" on mukhwas pages adds two out-of-stock soaps and shows "Save ₹175" (₹235 vs ₹410), which is a saving against MRP, not an actual bundle discount.
  - Soap benefit claims: "Deeply cleanses & purifies skin", "100% Chemical & Paraben Free".
- **Text:** "100% natural organic product." is the same description on every product. The mukhwas page for Masala Kharek says "Handcrafted with pure premium natural ingredients for unmatched taste and wellness."

### Cart `/cart` (desktop; mobile NOT TESTED because the cart was empty at the time)
- Works: add, quantity (1→4), persistence after reload, remove, empty state, "Invalid coupon code.", free-shipping progress.
- Errors: Chocolate Mukhwas 200 g at ₹60 (see Mukhwas); WELCOME10 rejected with "Minimum order amount for this coupon is ₹500."; breadcrumb shown twice; "1 Items"; GST shown as "6% Included".

### Checkout `/checkout` (desktop only)
- Steps Address → Delivery → Payment → Review. Payment page shows Razorpay and COD. I stopped there.
- Error: selected address says "Gandhinagar", the "Selected delivery destination" line says "Ahmedabad".
- Saved addresses with other people's names and phone numbers were listed; I assumed this is your logged-in account and did not touch it.

### 404 page
- "404 - Page Not Found", `noindex,follow`, buttons to Home and Explore Mukhwas. PASS.

---

## 3. Device summary

| Page | 320 | 375 | 414 | 768 | 1024 | 1366 | 1440 | 1920 | 2560 |
|---|---|---|---|---|---|---|---|---|---|
| Home | Header overflow; small tap targets | OK, squeezed header | OK | OK | OK | OK | OK | OK | OK |
| Mukhwas | Header overflow; 10.5 px buttons | OK | OK | OK | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| Product (`/5`) | Header overflow | OK | OK | OK | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| Combos | Header overflow | OK | OK | OK | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| Contact | Header overflow | OK | OK | OK | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| FAQ | NOT MEASURED | Placeholder cut off | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| Other pages | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED |

"OK" means no horizontal scroll and no cut-off found in measurements and screenshots; tap-target and font notes from section 1 still apply.

---

## 4. Spelling and grammar list

| Page | Original | Suggested |
|---|---|---|
| Cart | 1 Items | 1 item |
| Home (reviews) | Akshy j. | Akshy J. |
| Soap pages | Glow Craft Detan Soap | Glow Craft De-Tan Soap |
| Soap pages | Beet Radiance Handmade Beetroot Soap | Beet Radiance Beetroot Soap |
| Mukhwas | Digestive | Digestive Mukhwas |
| Mukhwas | Drakhsha Wati Mukhwas | Confirm spelling (Draksha?) |
| Combos | Weight: 50 g / 100 g / 150 | 50 g / 100 g / 150 g |
| Our Story | Born from an Ahmedabad Home Kitchen | Born in an Ahmedabad Home Kitchen |
| Site-wide | HIYAGHAR / Hiya Ghar / HIYA GHAR / Hiya | Choose one |
| Site-wide | Returns & Refunds / Cancellation Policy / Refund & Cancellation / Return & Refund Policy | One name |
| Site-wide | Track Order / Live Order Tracking | One name |
| Gift Hampers | Curated gift hamper, handcrafted with care. (on single items) | Describe each item properly |
| Tea Masala | Tea Masala / Royal Tea Masala | One name |

Units are consistent (g) and currency is consistently ₹ on every page I read. I did not find lorem ipsum.

---

## 5. Fix order

1. Listing quick-add must use the selected pack's price (₹120 vs ₹60).
2. Combos: apply the 10/15/20% discount at checkout or remove the promise everywhere.
3. Fix stock mismatch between listing and product pages (soaps).
4. Remove the template "Nutritional Facts" and generic ingredients from soaps and mukhwas, and replace with real FSSAI-compliant data.
5. WELCOME10: state the ₹500 minimum or remove it.
6. Gift Hampers: show real hampers, not single items.
7. Checkout address summary city mismatch.
8. Header at 320 px: reduce icon spacing so the cart icon is not cut off; give the logo room at 375 px.
9. Raise tap targets to 44 px (breadcrumbs, review dots, filter chips, Add to Cart).
10. Make one set of delivery/dispatch times.
11. Add FSSAI licence number, GSTIN and address.
12. Compress images and add width/height (see the first report).
13. Fix brand name, product name and policy name inconsistencies.
14. Add contact-form captcha.
15. Re-test cart and checkout on mobile once the above is fixed.
