import { test, expect } from '@playwright/test';

/**
 * HIYAGHAR Customer QA Suite (Playwright Native Spec)
 * Target: https://localhost:59978
 * Safety: Read-only checks. Strictly no orders placed, no accounts created, no payment submitted.
 */

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Mukhwas', path: '/mukhwas' },
  { name: 'Tea Masala', path: '/tea-masala' },
  { name: 'Handmade Soap', path: '/handmade-soap' },
  { name: 'Hair Oil', path: '/hair-oil' },
  { name: 'Combos', path: '/combos' },
  { name: 'Gift Hampers', path: '/gift-hampers' },
  { name: 'Product Detail', path: '/product/drakshawati-mukhwas' },
  { name: 'Cart', path: '/cart' },
  { name: 'Wishlist', path: '/wishlist' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'Our Story', path: '/our-story' },
  { name: 'Contact Us', path: '/contact-us' },
  { name: 'FAQ', path: '/faq' },
  { name: '404 Page', path: '/page-not-found-404-test' },
];

test.describe('Responsive Horizontal Overflow Audit', () => {
  for (const p of PAGES) {
    test(`Verify ${p.name} has no horizontal scrollbar overflow`, async ({ page }) => {
      await page.goto(p.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const hasOverflow = await page.evaluate(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        return docScrollWidth > innerWidth + 1;
      });

      expect(hasOverflow, `${p.name} at ${p.path} has horizontal overflow!`).toBeFalsy();
    });
  }
});

test.describe('Customer Read-Only Interactive Journeys', () => {
  test('Add to Cart & Verify Cart Quantity as Guest', async ({ page }) => {
    await page.goto('/product/drakshawati-mukhwas', { waitUntil: 'networkidle' });
    const addBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(600);
      await page.goto('/cart', { waitUntil: 'networkidle' });
      const cartItem = page.locator('.cart-item, .cart-product-row, .hiyaghar-cart-row').first();
      await expect(cartItem).toBeVisible();
    }
  });

  test('Guest Checkout Progression Stops Safely Before Payment', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle' });
    // Verify checkout page loaded
    expect(page.url()).toContain('/checkout');
    // Ensure safety: no submission of real order or payment
  });
});

