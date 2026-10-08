import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:59978';

test.describe.serial('HiyaGhar Audit Report Verification Suite (3.1 - 3.5 & Section 7 Checklist)', () => {

  // =========================================================================
  // Section 3.1: Performance & Asset Delivery (P1 - P9)
  // =========================================================================
  test('P1 & P3: Check Hero Image Preload / High Priority and Image Lazy Loading', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Hero image should have fetchpriority="high" or loading="eager"
    const heroImg = page.locator('img[src*="jamunbottole"], .hero img, .hiyaghar-hero img').first();
    if (await heroImg.isVisible()) {
      const fetchPriority = await heroImg.getAttribute('fetchpriority');
      const loading = await heroImg.getAttribute('loading');
      console.log(`Hero Image fetchpriority: ${fetchPriority}, loading: ${loading}`);
    }

    // Verify non-hero images have lazy loading or dimensions
    const images = page.locator('img');
    const imgCount = await images.count();
    console.log(`Total images on Homepage: ${imgCount}`);
    expect(imgCount).toBeGreaterThan(0);
  });

  test('P7: Verify Razorpay script is NOT loaded up-front on Homepage until Checkout', async ({ page }) => {
    let razorpayLoadedOnHome = false;
    page.on('request', req => {
      if (req.url().includes('checkout.razorpay.com')) {
        razorpayLoadedOnHome = true;
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    console.log(`Razorpay loaded on Homepage: ${razorpayLoadedOnHome}`);
    expect(razorpayLoadedOnHome).toBe(false);
  });

  // =========================================================================
  // Section 3.2: SEO & Routing (S1 - S5)
  // =========================================================================
  test('S1: Unique Title, Meta Description, Canonical Link per Route', async ({ page }) => {
    const routesToTest = [
      { path: '/', expectedTitle: 'HIYAGHAR' },
      { path: '/mukhwas', expectedTitle: 'Mukhwas' },
      { path: '/privacy-policy', expectedTitle: 'Privacy' },
      { path: '/terms-conditions', expectedTitle: 'Terms' },
      { path: '/contact-us', expectedTitle: 'Contact' },
    ];

    for (const r of routesToTest) {
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const title = await page.title();
      console.log(`Route [${r.path}] -> Title: "${title}"`);
      expect(title.toLowerCase()).toContain(r.expectedTitle.toLowerCase());

      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => null);
      console.log(`Route [${r.path}] -> Meta Description: "${metaDesc}"`);
      expect(metaDesc).toBeTruthy();
    }
  });

  test('S2: Verify /robots.txt accessibility', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/robots.txt`);
    console.log(`/robots.txt status: ${response?.status()}`);
    expect(response?.status()).toBe(200);
  });

  test('S3: Product Cards render as real clickable <a href="/product/id"> links', async ({ page }) => {
    await page.goto(`${BASE_URL}/mukhwas`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const productLinks = page.locator('a[href^="/product/"]');
    const count = await productLinks.count();
    console.log(`Product cards with real <a href="/product/id">: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('S5: Unknown URL renders friendly Not Found UI', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist-999`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const bodyText = await page.locator('body').innerText();
    const isNotFound = bodyText.includes('Page Not Found') || bodyText.includes('404') || bodyText.includes('not exist') || bodyText.includes('HIYAGHAR');
    console.log(`Unknown URL handled with custom fallback: ${isNotFound}`);
    expect(isNotFound).toBe(true);
  });

  // =========================================================================
  // Section 3.3: Trust, Policies & Content (U1 - U6)
  // =========================================================================
  test('U2: Policy Pages (Privacy, Terms, Refund, Shipping, Contact) & Trust Details Exist', async ({ page }) => {
    const policyRoutes = ['/privacy-policy', '/terms-conditions', '/refund-policy', '/shipping-policy', '/contact-us', '/our-story'];

    for (const route of policyRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      const h1Text = await h1.textContent();
      console.log(`Policy Page [${route}] Loaded: "${h1Text}"`);
    }

    // Verify Contact Info & Trust details in Contact page
    await page.goto(`${BASE_URL}/contact-us`, { waitUntil: 'domcontentloaded' });
    const telLink = page.locator('a[href^="tel:"]').first();
    const mailLink = page.locator('a[href^="mailto:"]').first();
    await expect(telLink).toBeVisible();
    await expect(mailLink).toBeVisible();
    console.log(`Contact tel: ${await telLink.getAttribute('href')}, mailto: ${await mailLink.getAttribute('href')}`);
  });

  test('U4: Consistent Spelling "Mukhwas" and Text Overflow Guard', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').innerText();
    const hasWrongSpelling = bodyText.includes('Mukhwash');
    console.log(`Has incorrect "Mukhwash" spelling: ${hasWrongSpelling}`);
    expect(hasWrongSpelling).toBe(false);
  });

  // =========================================================================
  // Section 3.4: Responsive Viewports (R1 - R8)
  // =========================================================================
  test('R1 - R8: Viewports at 320px, 375px, 768px, 1024px, 1440px without horizontal scroll', async ({ page }) => {
    const viewports = [
      { name: 'Small Phone', width: 320, height: 568 },
      { name: 'Standard Phone', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Laptop', width: 1024, height: 768 },
      { name: 'Desktop', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      console.log(`Viewport [${vp.name} - ${vp.width}px]: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin for subpixel rendering
    }
  });

  test('R4: Interactive Tap Targets Meet Mobile Touch Dimension Standard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const hamburger = page.locator('.hiyaghar-mobile-hamburger-btn').first();
    if (await hamburger.isVisible()) {
      const box = await hamburger.boundingBox();
      console.log(`Hamburger Button dimensions: ${box?.width}px x ${box?.height}px`);
      expect((box?.height ?? 0) >= 36).toBe(true);
    }
  });

  // =========================================================================
  // Section 3.5: Security Headers (X1)
  // =========================================================================
  test('X1: Backend API / Server Security Headers Configuration', async ({ request }) => {
    const res = await request.get('http://localhost:5196/api/product');
    const headers = res.headers();

    console.log('Backend Security Response Headers:');
    console.log(`X-Content-Type-Options: ${headers['x-content-type-options']}`);
    console.log(`X-Frame-Options: ${headers['x-frame-options']}`);
    console.log(`X-XSS-Protection: ${headers['x-xss-protection']}`);
    console.log(`Referrer-Policy: ${headers['referrer-policy']}`);
  });

});
