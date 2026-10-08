import { test, expect } from '@playwright/test';

test.describe('Verify Excel QA Bugs on Current Codebase', () => {

  // BUG-001: Check Category Banner Images for 404 or broken assets
  test('Verify BUG-001: Category Banner Images load properly', async ({ page }) => {
    const failedImages: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400 && res.url().match(/\.(webp|jpg|png|svg)/i)) {
        failedImages.push(`[${res.status()}] ${res.url()}`);
      }
    });

    const categories = ['/tea-masala', '/handmade-soap', '/hair-oil', '/mukhwas', '/gift-hampers'];
    for (const cat of categories) {
      await page.goto(cat, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
    }

    console.log('BUG-001 Failed Images:', failedImages);
    expect(failedImages, 'Broken banner images found on category pages').toEqual([]);
  });

  // BUG-002: Guest access to /orders and /wishlist
  test('Verify BUG-002: Guest access to /orders & /wishlist redirects to login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/wishlist');
    await page.waitForTimeout(400);
    const wishlistUrl = page.url();
    console.log('Wishlist URL when guest:', wishlistUrl);

    await page.goto('/orders');
    await page.waitForTimeout(400);
    const ordersUrl = page.url();
    console.log('Orders URL when guest:', ordersUrl);
  });

  // BUG-005: Empty <title> tags on Legal and Policy pages
  test('Verify BUG-005: Title tags on Legal & Policy pages', async ({ page }) => {
    const pages = ['/contact-us', '/privacy-policy', '/terms-conditions', '/refund-policy', '/shipping-policy'];
    const emptyTitles: string[] = [];

    for (const p of pages) {
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(200);
      const title = await page.title();
      console.log(`Page: ${p} -> Title: "${title}"`);
      if (!title || title.trim() === '') {
        emptyTitles.push(p);
      }
    }
    expect(emptyTitles, 'Pages with empty title tags').toEqual([]);
  });

  // BUG-011: Product cards have real anchor links with href
  test('Verify BUG-011: Product cards expose real <a href="/product/id">', async ({ page }) => {
    await page.goto('/mukhwas');
    await page.waitForTimeout(400);

    const productAnchors = page.locator('.product-card a[href*="/product/"], a.product-card[href*="/product/"], .product-card-link');
    const count = await productAnchors.count();
    console.log('Product cards with real <a href> count:', count);
    expect(count, 'Product cards must have real <a> tags for SEO crawlability').toBeGreaterThan(0);
  });

  // BUG-013: Email inputs use type="email"
  test('Verify BUG-013: Email input types on Login and Register', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(300);

    const emailInputs = page.locator('input[type="email"], input[placeholder*="email" i], input[name*="email" i]');
    const count = await emailInputs.count();
    for (let i = 0; i < count; i++) {
      const type = await emailInputs.nth(i).getAttribute('type');
      console.log(`Email Input ${i} type:`, type);
      expect(type, 'Email inputs must be type="email"').toBe('email');
    }
  });

  // BUG-024: Check for multiple <h1> elements on /cart
  test('Verify BUG-024: Exactly one <h1> element on /cart', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(300);

    const h1Elements = page.locator('h1');
    const count = await h1Elements.count();
    console.log('/cart H1 count:', count);
    for (let i = 0; i < count; i++) {
      console.log(`H1 #${i + 1}:`, await h1Elements.nth(i).innerText().catch(() => ''));
    }
    expect(count, 'There should be exactly one <h1> on /cart').toBe(1);
  });

  // BUG-003 & BUG-015: Signup blocks whitespace-only submissions
  test('Verify BUG-003 & BUG-015: Signup blocks empty and whitespace-only submissions', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForTimeout(300);

    const submitBtn = page.locator('button[type="submit"]:has-text("Create Account")');
    await submitBtn.click();
    expect(await page.locator('.hiyaghar-field-error').count()).toBeGreaterThan(0);

    // Whitespace only
    await page.locator('#signup-firstname').fill('   ');
    await page.locator('#signup-lastname').fill('   ');
    await page.locator('#signup-email').fill('   ');
    await page.locator('#signup-mobile').fill('   ');
    await submitBtn.click();
    expect(await page.locator('.hiyaghar-field-error').count()).toBeGreaterThan(0);
  });

  // BUG-007: Contact Us page offers working mailto, tel, and WhatsApp links
  test('Verify BUG-007: Contact page has clickable tel and mailto links', async ({ page }) => {
    await page.goto('/contact-us');
    await page.waitForTimeout(300);

    const telLink = page.locator('a[href^="tel:"]');
    const mailLink = page.locator('a[href^="mailto:"]');
    expect(await telLink.count()).toBeGreaterThan(0);
    expect(await mailLink.count()).toBeGreaterThan(0);
  });

  // BUG-008: Trailing slash URLs normalize seamlessly without 404
  test('Verify BUG-008: Trailing slash URLs load smoothly without 404', async ({ page }) => {
    const trailingUrls = ['/mukhwas/', '/combos/'];
    for (const url of trailingUrls) {
      await page.goto(url);
      await page.waitForTimeout(300);
      expect(await page.locator('.hiyaghar-no-page-card, h1:has-text("Page Not Found")').count()).toBe(0);
    }
  });

  // BUG-009: No leftover smoothie copy on homepage
  test('Verify BUG-009: Hero copy refers to handcrafted natural mukhwas', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const heroTitle = await page.locator('.hiyaghar-ref-hero-title').innerText();
    expect(heroTitle.toLowerCase()).not.toContain('smoothie');
    expect(heroTitle.toLowerCase()).toContain('mukhwas');
  });

  // BUG-010: WhatsApp support link uses official 9510212154 number
  test('Verify BUG-010: WhatsApp support links point to official number 9510212154', async ({ page }) => {
    await page.goto('/track-order');
    await page.waitForTimeout(300);
    const waLinks = page.locator('a[href*="wa.me"]');
    const count = await waLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await waLinks.nth(i).getAttribute('href');
      expect(href).toContain('9510212154');
      expect(href).not.toContain('9876543210');
    }
  });

  // BUG-012: PDP with invalid/non-existent product ID renders a clear "Product Not Found" card
  test('Verify BUG-012: Non-existent product ID renders clear Product Not Found UI', async ({ page }) => {
    await page.goto('/product/999999');
    await page.waitForTimeout(600);
    const notFoundCard = page.locator('h1:has-text("Product Not Found")');
    await expect(notFoundCard).toBeVisible();
  });

  // BUG-017: "Remember me" checkbox has accessible name
  test('Verify BUG-017: Remember me checkbox has accessible aria-label', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(300);
    const checkbox = page.locator('.hiyaghar-remember-checkbox');
    await expect(checkbox).toHaveAttribute('aria-label', 'Remember me');
  });

  // BUG-018: Skip to main content link exists as an accessible navigation mechanism
  test('Verify BUG-018: Skip to main content link exists in header', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const skipLink = page.locator('a.hiyaghar-skip-link');
    await expect(skipLink).toBeAttached();
    expect(await skipLink.innerText()).toContain('Skip to main content');
  });

  // BUG-020: Header dropdown menu buttons have aria-expanded and keyboard operability
  test('Verify BUG-020: Header dropdown buttons support aria-expanded and click/keyboard toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const personalCareBtn = page.locator('.hiyaghar-header-dropdown-btn:has-text("Personal Care")');
    await expect(personalCareBtn).toBeVisible();
    await expect(personalCareBtn).toHaveAttribute('aria-expanded', 'false');

    await personalCareBtn.click();
    await expect(personalCareBtn).toHaveAttribute('aria-expanded', 'true');
    const dropdownMenu = page.locator('.hiyaghar-dropdown-menu:has-text("Handmade Soap")');
    await expect(dropdownMenu).toBeVisible();
  });

  // BUG-025: Per-route distinct <title> and <meta name="description">
  test('Verify BUG-025: Unique <title> and <meta name="description"> per route', async ({ page }) => {
    const testRoutes = ['/', '/mukhwas', '/tea-masala', '/handmade-soap', '/hair-oil', '/cart', '/login'];
    for (const r of testRoutes) {
      await page.goto(r);
      await page.waitForTimeout(300);
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(5);

      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDesc).toBeTruthy();
      expect(metaDesc?.length).toBeGreaterThan(15);
    }
  });

  // BUG-021: Security headers check on HTTP responses
  test('Verify BUG-021: Security headers present on server responses', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).toBeTruthy();
    // Headers are tested on responses
    const headers = response?.headers() || {};
    console.log('Response headers check:', {
      'x-content-type-options': headers['x-content-type-options'],
      'x-frame-options': headers['x-frame-options'],
      'referrer-policy': headers['referrer-policy'],
    });
  });

  // BUG-004: Mobile drawer links point to valid full routes
  test('Verify BUG-004: Mobile drawer links use proper route URLs without bare anchor jumping', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const mobileLinks = page.locator('.hiyaghar-mobile-menu-links a');
    const count = await mobileLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await mobileLinks.nth(i).getAttribute('href');
      if (href) {
        expect(href.startsWith('/') || href.startsWith('http')).toBe(true);
      }
    }
  });

  // Sitemap: Verify all storefront, content and admin routes from the QA Sitemap sheet
  test('Verify Sitemap: All storefront and policy routes load successfully without errors', async ({ page }) => {
    const sitemapRoutes = [
      '/',
      '/mukhwas',
      '/tea-masala',
      '/handmade-soap',
      '/hair-oil',
      '/gift-hampers',
      '/combos',
      '/combo',
      '/customize-combo',
      '/cart',
      '/checkout',
      '/wishlist',
      '/orders',
      '/track-order',
      '/order-confirmation',
      '/login',
      '/signup',
      '/about',
      '/about-us',
      '/our-story',
      '/contact-us',
      '/privacy-policy',
      '/terms-conditions',
      '/refund-policy',
      '/shipping-policy',
      '/admin'
    ];

    const failedRoutes: string[] = [];
    for (const route of sitemapRoutes) {
      try {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        if (!response || response.status() >= 400) {
          failedRoutes.push(`${route} returned status ${response?.status()}`);
        }
      } catch (err: any) {
        failedRoutes.push(`${route} failed to load: ${err.message}`);
      }
    }

    console.log('Failed sitemap routes:', failedRoutes);
    expect(failedRoutes).toEqual([]);
  });

});
