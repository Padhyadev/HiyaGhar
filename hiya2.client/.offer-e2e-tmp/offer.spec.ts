import { test, expect, Page } from '@playwright/test';

const SHOTS = 'C:/Users/rmgam/AppData/Local/Temp/claude/d--Office-Live-Project-HiyaGhar/2422367f-114d-4fe7-858e-41c99e28668e/scratchpad/offer-e2e/';

async function seedCart(page: Page, quantity: number) {
  await page.goto('/');
  await page.evaluate((qty) => {
    localStorage.setItem('hiya_shopping_cart', JSON.stringify([{
      id: '1-no-variant', productId: '1', name: 'Beet Radiance Handmade Beetroot Soap',
      image: '/uploads/product/9275e310-2612-4c49-b2b2-2d5f55398333.webp',
      price: 85, originalPrice: 160, weight: 'No Variant', quantity: qty,
    }]));
  }, quantity);
}

test('cart ₹85: no discount, shows add ₹215 more', async ({ page }) => {
  await seedCart(page, 1);
  await page.goto('/cart');
  const nudge = page.locator('.hiyaghar-offer-nudge');
  await expect(nudge).toContainText('215', { timeout: 15000 });
  await expect(nudge).toContainText('10% OFF');
  await expect(page.locator('.hiyaghar-summary-row.discount')).toHaveCount(0);
  await page.locator('.hiyaghar-coupon-card').screenshot({ path: SHOTS + 'cart-85-offer.png' });
  await page.locator('.hiyaghar-order-summary-card').screenshot({ path: SHOTS + 'cart-85-summary.png' });
});

test('cart ₹340: 10% applied automatically (₹34)', async ({ page }) => {
  await seedCart(page, 4);
  await page.goto('/cart');
  await expect(page.locator('.hiyaghar-coupon-applied-box')).toContainText('10% OFF on orders above ₹300', { timeout: 15000 });
  await expect(page.locator('.hiyaghar-summary-row.discount')).toContainText('34', { timeout: 10000 });
  await expect(page.locator('.hiyaghar-offer-nudge')).toHaveCount(0);
  await page.locator('.hiyaghar-coupon-card').screenshot({ path: SHOTS + 'cart-340-offer.png' });
  await page.locator('.hiyaghar-order-summary-card').screenshot({ path: SHOTS + 'cart-340-summary.png' });
});

test('cart qty change ₹340 → ₹255: discount removed, nudge returns', async ({ page }) => {
  await seedCart(page, 4);
  await page.goto('/cart');
  await expect(page.locator('.hiyaghar-summary-row.discount')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Decrease quantity' }).click();
  await expect(page.locator('.hiyaghar-offer-nudge')).toContainText('45', { timeout: 15000 });
  await expect(page.locator('.hiyaghar-summary-row.discount')).toHaveCount(0);
});

test('checkout ₹340: offer shown, no coupon box', async ({ page }) => {
  await seedCart(page, 4);
  await page.goto('/checkout');
  await expect(page.getByText('applied automatically').first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByPlaceholder('Have a coupon code?')).toHaveCount(0);
  await expect(page.getByText('Offer Discount')).toBeVisible();
  await page.screenshot({ path: SHOTS + 'checkout-340.png', fullPage: true });
});
