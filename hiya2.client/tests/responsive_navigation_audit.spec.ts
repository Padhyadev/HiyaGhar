import { test, expect, Page } from '@playwright/test';

// Viewports list specified in user requirements
const ALL_VIEWPORTS = [
  // Mobile
  { width: 320, height: 800, name: '320x800', type: 'mobile' },
  { width: 375, height: 812, name: '375x812', type: 'mobile' },
  { width: 390, height: 844, name: '390x844', type: 'mobile' },
  { width: 412, height: 915, name: '412x915', type: 'mobile' }, // Crucial mobile width
  { width: 430, height: 932, name: '430x932', type: 'mobile' },
  // Tablet
  { width: 768, height: 1024, name: '768x1024', type: 'tablet' },
  { width: 1024, height: 1366, name: '1024x1366', type: 'tablet' },
  // Desktop
  { width: 1280, height: 720, name: '1280x720', type: 'desktop' },
  { width: 1440, height: 900, name: '1440x900', type: 'desktop' },
  { width: 1920, height: 1080, name: '1920x1080', type: 'desktop' },
];

const MAJOR_PAGES = [
  { hash: '#/', name: 'home' },
  { hash: '#mukhwas', name: 'mukhwas' },
  { hash: '#tea-masala', name: 'tea-masala' },
  { hash: '#handmade-soap', name: 'handmade-soap' },
  { hash: '#hair-oil', name: 'hair-oil' },
  { hash: '#gift-hampers', name: 'gift-hampers' },
  { hash: '#combos', name: 'combos' },
  { hash: '#orders', name: 'orders' },
  { hash: '#profile', name: 'profile' },
  { hash: '#wishlist', name: 'wishlist' },
  { hash: '#addresses', name: 'addresses' },
  { hash: '#cart', name: 'cart' },
];

// Helper: Check horizontal overflow
async function checkHorizontalOverflow(page: Page) {
  return await page.evaluate(() => {
    const docScrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const innerWidth = window.innerWidth;

    const overflowingElements: Array<{ selector: string; right: number; width: number; innerWidth: number }> = [];

    if (docScrollWidth > innerWidth + 1 || bodyScrollWidth > innerWidth + 1) {
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.right > innerWidth + 1.5) {
          const selector = el.className
            ? `.${String(el.className).trim().split(/\s+/).join('.')}`
            : el.tagName.toLowerCase();
          overflowingElements.push({
            selector,
            right: rect.right,
            width: rect.width,
            innerWidth,
          });
        }
      });
    }

    return {
      docScrollWidth,
      bodyScrollWidth,
      innerWidth,
      hasOverflow: docScrollWidth > innerWidth + 1 || bodyScrollWidth > innerWidth + 1,
      overflowingElements: overflowingElements.slice(0, 10),
    };
  });
}

// Helper: Check element boundaries
async function checkElementBoundaries(page: Page) {
  return await page.evaluate(() => {
    const innerWidth = window.innerWidth;
    const selectors = [
      'header',
      '.noka-header-main-bar',
      '.noka-account-hero-card',
      '.noka-tab-card',
      '.noka-orders-filter-bar',
      '.noka-compact-order-card',
      '.noka-gh-hero-content',
      '.noka-gh-occasion-grid',
      '.noka-gh-category-grid',
      '.noka-mukhwas-products-grid',
      '.noka-gh-corporate-box',
      'footer',
    ];

    const violations: Array<{ selector: string; right: number; left: number; width: number }> = [];

    selectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.right > innerWidth + 2 || rect.left < -2 || rect.width > innerWidth + 2) {
          violations.push({
            selector: sel,
            right: rect.right,
            left: rect.left,
            width: rect.width,
          });
        }
      }
    });

    return violations;
  });
}

// Global Console & Page Error Collector
function attachErrorListeners(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('React DevTools') && !text.includes('Download the React DevTools')) {
        errors.push(`Console Error: ${text}`);
      }
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });
  return errors;
}

test.describe('1. Orders Page & Account Responsiveness Audit (412px Focus)', () => {
  const accountTabs = [
    { hash: '#orders', name: 'orders' },
    { hash: '#profile', name: 'profile' },
    { hash: '#addresses', name: 'addresses' },
    { hash: '#wishlist', name: 'wishlist' },
  ];

  for (const tab of accountTabs) {
    for (const vp of ALL_VIEWPORTS) {
      test(`Account ${tab.name} @ ${vp.name} (${vp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const errors = attachErrorListeners(page);

        await page.goto(`https://localhost:59978/${tab.hash}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        // Check horizontal overflow
        const overflow = await checkHorizontalOverflow(page);
        if (overflow.hasOverflow) {
          console.error(`OVERFLOW FAIL on ${tab.hash} @ ${vp.name}:`, overflow.overflowingElements);
        }
        expect(
          overflow.hasOverflow,
          `Horizontal overflow on ${tab.hash} @ ${vp.name} (scrollWidth: ${overflow.docScrollWidth} vs innerWidth: ${overflow.innerWidth})`
        ).toBe(false);

        // Check element boundary violations
        const violations = await checkElementBoundaries(page);
        expect(violations.length, `Boundary violations on ${tab.hash} @ ${vp.name}: ${JSON.stringify(violations)}`).toBe(0);

        // Check console errors
        expect(errors, `Errors on ${tab.hash} @ ${vp.name}`).toEqual([]);
      });
    }
  }
});

test.describe('2. Comprehensive Page Overflow Audit Across All Viewports', () => {
  for (const p of MAJOR_PAGES) {
    for (const vp of ALL_VIEWPORTS) {
      test(`Overflow check: ${p.name} @ ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`https://localhost:59978/${p.hash}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        const overflow = await checkHorizontalOverflow(page);
        expect(
          overflow.hasOverflow,
          `Horizontal overflow on ${p.name} @ ${vp.name} (scrollWidth: ${overflow.docScrollWidth} vs innerWidth: ${overflow.innerWidth})`
        ).toBe(false);
      });
    }
  }
});

test.describe('3. Required Screenshots (412px, 768px, 1440px)', () => {
  const targetViewports = [
    { width: 412, height: 915, tag: 'mobile' },
    { width: 768, height: 1024, tag: 'tablet' },
    { width: 1440, height: 900, tag: 'desktop' },
  ];

  for (const p of MAJOR_PAGES) {
    for (const vp of targetViewports) {
      test(`Screenshot: ${p.name}-${vp.tag}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`https://localhost:59978/${p.hash}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `screenshots/${p.name}-${vp.tag}.png`,
          fullPage: false,
        });
      });
    }
  }
});

test.describe('4. Complete Navigation & User Journeys', () => {
  test('Header Navigation (Desktop & Mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('https://localhost:59978/#/', { waitUntil: 'domcontentloaded' });

    // Open Mobile Menu
    const hamburger = page.locator('.noka-mobile-hamburger-btn');
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Click Gift Hampers
    await page.locator('.noka-mobile-menu-drawer a[href="#gift-hampers"]').first().click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#gift-hampers');

    // Open menu again & click Combos
    await hamburger.click();
    await page.locator('.noka-mobile-menu-drawer a[href="#combos"]').first().click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#combos');

    // Open menu & click Mukhwas
    await hamburger.click();
    await page.locator('.noka-mobile-menu-drawer a[href="#mukhwas"]').first().click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#mukhwas');

    // Open menu & click Tea Masala
    await hamburger.click();
    await page.locator('.noka-mobile-menu-drawer a[href="#tea-masala"]').first().click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#tea-masala');

    // Open menu & click Handmade Soap
    await hamburger.click();
    await page.locator('.noka-mobile-menu-drawer a[href="#handmade-soap"]').first().click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#handmade-soap');

    // Open menu & click Hair Oil
    await hamburger.click();
    await page.locator('.noka-mobile-menu-drawer a[href="#hair-oil"]').first().click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#hair-oil');
  });

  test('Product -> Detail -> Add to Cart -> Cart Journey', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('https://localhost:59978/#mukhwas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Click first product card
    const firstCard = page.locator('.noka-mukhwas-card').first();
    await firstCard.click();
    await page.waitForTimeout(300);

    // Verify detail page loaded
    expect(page.url()).toContain('#product/');

    // Click Add to Cart button on detail page
    const addToCartBtn = page.locator('.noka-detail-add-cart-btn, .noka-btn-add-cart').first();
    await addToCartBtn.click();
    await page.waitForTimeout(400);

    // Open Cart page
    await page.goto('https://localhost:59978/#cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#cart');
  });

  test('Gift Hampers -> Occasion & Category Navigation Flow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('https://localhost:59978/#gift-hampers', { waitUntil: 'domcontentloaded' });

    // Verify Occasions
    await expect(page.getByRole('heading', { name: 'Gift By Occasion' })).toBeVisible();

    // Click Mukhwas category card
    await page.locator('.noka-gh-cat-card', { hasText: 'Mukhwas' }).click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#mukhwas');
  });

  test('Combo Page User Journey', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('https://localhost:59978/#combos', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Verify Combos page loaded and product cards exist
    expect(page.url()).toContain('#combos');
    const comboCards = page.locator('.noka-page-prod-card');
    await expect(comboCards.first()).toBeVisible();
  });
});
