import { test, expect, chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'https://localhost:59978';
const ADMIN_URL = `${BASE_URL}/admin`;
const ADMIN_EMAIL = process.env.HIYAGHAR_ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.HIYAGHAR_ADMIN_PASSWORD || 'admin';

test.describe.serial('HiyaGhar End-to-End Walkthrough & QA Test Plan Suite', () => {
  test.setTimeout(90000);

  test('TC-HYG-E2E-001: Public Discovery & Navigation Crawl (Phase 1-4)', async () => {
    // Launch visible browser with requested config
    const browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--window-size=1920,1080']
    });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    console.log('--- Phase 1: Visiting Home Page ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Verify Title & Brand Elements
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    expect(title).toContain('HIYAGHAR');

    // Scroll through page to inspect sections
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Verify navigation across catalog routes
    const catalogRoutes = ['/mukhwas', '/tea-masala', '/handmade-soap', '/hair-oil', '/gift-hampers', '/customize-combo'];
    for (const route of catalogRoutes) {
      console.log(`Checking route: ${route}`);
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`H1 on ${route}: ${h1Text}`);
      expect(h1Text).toBeTruthy();
    }

    await browser.close();
  });

  test('TC-HYG-E2E-002: Complete Public Order Journey (Product -> Cart -> Checkout -> Confirmation)', async () => {
    const browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--window-size=1920,1080']
    });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    console.log('--- Order Journey: Logging in as customer ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const emailField = page.locator('input[type="email"]').first();
    const passField = page.locator('input[type="password"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill('customer@test.com');
      await passField.fill('password123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1500);
    }

    console.log('--- Order Journey: Catalog -> Product Detail ---');
    await page.goto(`${BASE_URL}/mukhwas`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Find and click first product card link
    const firstProductLink = page.locator('a[href^="/product/"]').first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    console.log(`Current Product URL: ${page.url()}`);

    // Select weight/variant if available
    const weightOption = page.locator('button:has-text("250"), button:has-text("500"), .weight-btn').first();
    if (await weightOption.isVisible()) {
      await weightOption.click();
      await page.waitForTimeout(500);
    }

    // Add to Cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add To Cart")').first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    await page.waitForTimeout(1500);

    // Navigate to Cart
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toContainText('Shopping Cart');

    // Verify subtotal & line items exist
    const cartRows = page.locator('.hiyaghar-cart-row, .cart-item, [data-testid="cart-item"], tr');
    console.log(`Cart items count: ${await cartRows.count()}`);

    // Proceed to Checkout
    const checkoutBtn = page.locator('button:has-text("Proceed to Checkout"), a:has-text("Proceed to Checkout"), .checkout-btn, button:has-text("Checkout")').first();
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
    }

    console.log(`Checkout URL: ${page.url()}`);
    await page.waitForTimeout(1000);
    console.log('Order checkout journey explored safely.');

    await browser.close();
  });

  test('TC-HYG-E2E-003: Admin Portal Discovery, Login & Orders Management (Phase 8-11)', async () => {
    const browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--window-size=1920,1080']
    });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    console.log('--- Phase 8: Admin Authentication ---');
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Negative login test: empty credentials
    const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginBtn.click();
    await page.waitForTimeout(500);

    // Positive login test
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();
    await emailInput.fill(ADMIN_EMAIL);
    await passInput.fill(ADMIN_PASSWORD);
    await loginBtn.click();
    await page.waitForTimeout(1500);

    console.log(`Logged in admin URL: ${page.url()}`);

    // Map Admin Modules
    const adminModules = [
      { name: 'Dashboard', url: `${BASE_URL}/admin/dashboard` },
      { name: 'Products', url: `${BASE_URL}/admin/products` },
      { name: 'Categories', url: `${BASE_URL}/admin/categories` },
      { name: 'Orders', url: `${BASE_URL}/admin/orders` },
      { name: 'Customers', url: `${BASE_URL}/admin/customers` },
      { name: 'Coupons', url: `${BASE_URL}/admin/coupons` },
      { name: 'Stock', url: `${BASE_URL}/admin/stock` },
      { name: 'Reviews', url: `${BASE_URL}/admin/reviews` }
    ];

    for (const mod of adminModules) {
      console.log(`Exploring Admin Module: ${mod.name} (${mod.url})`);
      await page.goto(mod.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(50);
    }

    // Inspect Orders Module
    await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const tableRows = page.locator('table tbody tr, .order-row, .admin-table-row');
    const rowCount = await tableRows.count();
    console.log(`Admin Orders table row count: ${rowCount}`);

    await browser.close();
  });

  test('TC-HYG-E2E-004: Coupon Journey: Admin Management, Validation & Cart Application', async () => {
    const browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--window-size=1920,1080']
    });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // 1. Admin Coupon Management
    console.log('--- Admin Coupons Discovery ---');
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(ADMIN_EMAIL);
      await passInput.fill(ADMIN_PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1500);
    }

    await page.goto(`${BASE_URL}/admin/coupons`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Check Coupon Listing & Add Coupon Modal/Form
    const addCouponBtn = page.locator('button:has-text("Add Coupon"), button:has-text("New Coupon"), button:has-text("Create Coupon")').first();
    if (await addCouponBtn.isVisible()) {
      console.log('Opening Add Coupon dialog/form...');
      await addCouponBtn.click();
      await page.waitForTimeout(1000);
      
      // Inspect coupon inputs (code, discount, min order, expiry)
      const codeInput = page.locator('input[name="code"], input[placeholder*="code" i]').first();
      if (await codeInput.isVisible()) {
        await codeInput.fill('FESTIVE25');
      }

      // Close modal / cancel safely
      const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"], .modal-close').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 2. Storefront Coupon Application & Validation
    console.log('--- Storefront Coupon Application & Edge Cases ---');
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const couponInput = page.locator('input[placeholder*="coupon" i], input[placeholder*="promo" i], input#coupon').first();
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("APPLY")').first();

    if (await couponInput.isVisible() && await applyBtn.isVisible()) {
      // Test Invalid Coupon
      console.log('Testing invalid coupon code...');
      await couponInput.fill('INVALIDCODE999');
      await applyBtn.click();
      await page.waitForTimeout(1000);

      // Test Valid Coupon (e.g. TESTIN304 / WELCOME10 / FESTIVE20)
      console.log('Testing valid/known coupon code...');
      await couponInput.fill('TESTIN304');
      await applyBtn.click();
      await page.waitForTimeout(1000);
    }

    await browser.close();
  });

  test('TC-HYG-E2E-005: Responsive Viewports Walkthrough (Phase 15)', async () => {
    test.setTimeout(60000);
    const viewports = [
      { name: 'Desktop HD', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1440, height: 900 },
      { name: 'Tablet', width: 1024, height: 768 },
      { name: 'Mobile (iPhone 13)', width: 375, height: 667 }
    ];

    const browser = await chromium.launch({
      headless: false,
      slowMo: 300,
      args: ['--window-size=1920,1080']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    for (const vp of viewports) {
      console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Check for horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      // Check Mobile Hamburger Menu on mobile viewports
      if (vp.width <= 768) {
        const hamburger = page.locator('.hiyaghar-mobile-hamburger-btn').first();
        if (await hamburger.isVisible()) {
          await hamburger.click();
          await page.waitForTimeout(300);
          const drawer = page.locator('.hiyaghar-mobile-menu-drawer').first();
          if (await drawer.isVisible()) {
            const closeDrawer = page.locator('.hiyaghar-mobile-menu-header button').first();
            if (await closeDrawer.isVisible()) {
              await closeDrawer.click();
              await page.waitForTimeout(200);
            }
          }
        }
      }
    }

    await browser.close();
  });

});
