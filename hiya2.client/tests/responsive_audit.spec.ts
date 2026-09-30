import { test, expect, Page } from '@playwright/test';

// Target viewports as requested
const VIEWPORTS = {
  mobile: [
    { width: 320, height: 800, name: '320x800' },
    { width: 375, height: 812, name: '375x812' },
    { width: 390, height: 844, name: '390x844' },
    { width: 430, height: 932, name: '430x932' },
  ],
  tablet: [
    { width: 768, height: 1024, name: '768x1024' },
    { width: 1024, height: 1366, name: '1024x1366' },
  ],
  desktop: [
    { width: 1280, height: 720, name: '1280x720' },
    { width: 1440, height: 900, name: '1440x900' },
    { width: 1920, height: 1080, name: '1920x1080' },
  ],
};

const ROUTES = [
  '#/',
  '#mukhwas',
  '#tea-masala',
  '#handmade-soap',
  '#hair-oil',
  '#gift-hampers',
  '#combos',
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
          const selector = el.className ? `.${String(el.className).trim().split(/\s+/).join('.')}` : el.tagName.toLowerCase();
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

// Helper: Check broken images
async function checkImages(page: Page) {
  // Scroll down in steps to trigger lazy images, then back up
  await page.evaluate(async () => {
    const scrollStep = 600;
    for (let y = 0; y < document.body.scrollHeight; y += scrollStep) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);

  return await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken: string[] = [];
    const overflowing: string[] = [];
    const innerWidth = window.innerWidth;

    imgs.forEach((img) => {
      // An image is broken if it finished loading (complete === true) but has 0 natural width
      if (img.src && img.complete && img.naturalWidth === 0) {
        broken.push(img.src || img.alt || 'unknown image');
      }
      const rect = img.getBoundingClientRect();
      if (rect.width > innerWidth + 2) {
        overflowing.push(img.src || img.alt);
      }
    });

    return { broken, overflowing, total: imgs.length };
  });
}

// Global Console & Page Error Tracker
function attachErrorListeners(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out harmless React dev / browser extension warnings
      if (!text.includes('Download the React DevTools')) {
        errors.push(`Console Error: ${text}`);
      }
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });
  return errors;
}

test.describe('Responsive Audit & Overflow Verification', () => {
  // Test Horizontal Overflow across all viewports & routes
  const allViewports = [
    ...VIEWPORTS.mobile,
    ...VIEWPORTS.tablet,
    ...VIEWPORTS.desktop,
  ];

  for (const route of ROUTES) {
    for (const vp of allViewports) {
      test(`Overflow check: ${route} @ ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const errors = attachErrorListeners(page);

        await page.goto(`https://localhost:59978/${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const overflowResult = await checkHorizontalOverflow(page);
        if (overflowResult.hasOverflow) {
          console.error(
            `OVERFLOW FAIL on ${route} @ ${vp.name}: docScroll=${overflowResult.docScrollWidth}, bodyScroll=${overflowResult.bodyScrollWidth}, innerWidth=${overflowResult.innerWidth}`,
            overflowResult.overflowingElements
          );
        }
        expect(
          overflowResult.hasOverflow,
          `Route ${route} has horizontal overflow at viewport ${vp.name} (scrollWidth: ${overflowResult.docScrollWidth} vs innerWidth: ${overflowResult.innerWidth}). Offending elements: ${JSON.stringify(overflowResult.overflowingElements)}`
        ).toBe(false);

        const boundaryViolations = await checkElementBoundaries(page);
        expect(
          boundaryViolations.length,
          `Boundary violations on ${route} @ ${vp.name}: ${JSON.stringify(boundaryViolations)}`
        ).toBe(0);

        const imgCheck = await checkImages(page);
        expect(imgCheck.broken, `Broken images found on ${route} @ ${vp.name}: ${imgCheck.broken.join(', ')}`).toEqual([]);

        expect(errors, `Uncaught errors on ${route} @ ${vp.name}`).toEqual([]);
      });
    }
  }
});

test.describe('Screenshot Generation', () => {
  const screenshotViewports = [
    { width: 375, height: 812, tag: 'mobile' },
    { width: 768, height: 1024, tag: 'tablet' },
    { width: 1440, height: 900, tag: 'desktop' },
  ];

  const pagesToScreenshot = [
    { hash: '#gift-hampers', name: 'gift-hampers' },
    { hash: '#combos', name: 'combos' },
    { hash: '#mukhwas', name: 'mukhwas' },
    { hash: '#tea-masala', name: 'tea-masala' },
    { hash: '#handmade-soap', name: 'handmade-soap' },
    { hash: '#hair-oil', name: 'hair-oil' },
  ];

  for (const pageItem of pagesToScreenshot) {
    for (const vp of screenshotViewports) {
      test(`Screenshot: ${pageItem.name}-${vp.tag}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`https://localhost:59978/${pageItem.hash}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `screenshots/${pageItem.name}-${vp.tag}.png`,
          fullPage: false,
        });
      });
    }
  }
});

test.describe('Mobile Header Navigation Test', () => {
  test('Mobile Menu and Navigation Flow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // 1. Open Homepage
    await page.goto('https://localhost:59978/#/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // 2. Verify Mobile Hamburger Menu Button exists
    const menuBtn = page.locator('.noka-mobile-hamburger-btn');
    await expect(menuBtn).toBeVisible();

    // 3. Click menu
    await menuBtn.click();
    await page.waitForTimeout(200);

    // 4. Verify navigation becomes visible
    const mobileOverlay = page.locator('.noka-mobile-menu-drawer');
    await expect(mobileOverlay).toBeVisible();

    // 5. Click Gift Hampers
    const giftHampersLink = mobileOverlay.locator('a[href="#gift-hampers"]').first();
    await giftHampersLink.click();
    await page.waitForTimeout(300);

    // 6. Verify URL hash
    expect(page.url()).toContain('#gift-hampers');

    // 7. Verify Gift Hampers page loads
    await expect(page.locator('.noka-gh-hero-title')).toHaveText('Gifts That Feel Personal');

    // 8. Open menu again to verify Combos & Category links
    await menuBtn.click();
    await page.waitForTimeout(200);

    // 9. Click Combos
    const combosLink = mobileOverlay.locator('a[href="#combos"]').first();
    await combosLink.click();
    await page.waitForTimeout(300);

    // Verify Combos page loads
    expect(page.url()).toContain('#combos');

    // 10. Open menu and click Mukhwas category
    await menuBtn.click();
    await page.waitForTimeout(200);
    const mukhwasLink = mobileOverlay.locator('a[href="#mukhwas"]').first();
    await mukhwasLink.click();
    await page.waitForTimeout(300);

    expect(page.url()).toContain('#mukhwas');
  });
});

test.describe('Gift Hampers Page Section & Navigation Audit', () => {
  test('All Gift Hampers Sections Render Correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('https://localhost:59978/#gift-hampers', { waitUntil: 'domcontentloaded' });

    // Hero Section
    await expect(page.locator('.noka-gh-hero-title')).toBeVisible();
    await expect(page.locator('.noka-gh-hero-subtitle')).toHaveText('Thoughtfully curated gifts for every occasion, every celebration, and every special moment.');

    // Gift By Occasion Section
    await expect(page.getByRole('heading', { name: 'Gift By Occasion' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Birthday' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Housewarming' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Wedding / Return Gifts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Festive', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Corporate' })).toBeVisible();

    // Choose What You'd Like to Gift Section
    await expect(page.getByRole('heading', { name: "Choose What You'd Like to Gift" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mukhwas', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tea Masala', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Handmade Soap', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hair Oil', exact: true })).toBeVisible();

    // Budget Section & Featured Gifts
    await expect(page.getByRole('heading', { name: 'Gifts For Every Budget' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured Gifts' })).toBeVisible();

    // Corporate Section & Final CTA
    await expect(page.getByRole('heading', { name: 'Corporate Gifting Made Easy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Make Every Occasion Special' })).toBeVisible();
  });

  test('Category Navigation from Gift Hampers', async ({ page }) => {
    await page.goto('https://localhost:59978/#gift-hampers', { waitUntil: 'domcontentloaded' });

    // Click Mukhwas card
    await page.locator('.noka-gh-cat-card', { hasText: 'Mukhwas' }).click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#mukhwas');

    // Go back to Gift Hampers
    await page.goto('https://localhost:59978/#gift-hampers', { waitUntil: 'domcontentloaded' });
    await page.locator('.noka-gh-cat-card', { hasText: 'Tea Masala' }).click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#tea-masala');

    await page.goto('https://localhost:59978/#gift-hampers', { waitUntil: 'domcontentloaded' });
    await page.locator('.noka-gh-cat-card', { hasText: 'Handmade Soap' }).click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#handmade-soap');

    await page.goto('https://localhost:59978/#gift-hampers', { waitUntil: 'domcontentloaded' });
    await page.locator('.noka-gh-cat-card', { hasText: 'Hair Oil' }).click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#hair-oil');
  });
});

test.describe('Combo Page Regression Test', () => {
  test('Combo Page functionality works', async ({ page }) => {
    await page.goto('https://localhost:59978/#combos', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify Combo Page title or header exists
    await expect(page.locator('.noka-combo-hero-title, .noka-combo-header-title, .noka-customize-hero, h1').first()).toBeVisible();

    // Verify product cards are displayed
    const comboCards = page.locator('.noka-page-prod-card');
    await expect(comboCards.first()).toBeVisible();

    // Select products into combo box
    const selectBtn = comboCards.first().locator('.noka-page-add-btn');
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
