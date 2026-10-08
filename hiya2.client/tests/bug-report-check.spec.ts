import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:59978';

test.describe('Bug Report Verification Suite', () => {

  test('BUG-001 Verification: Out-of-stock product cart addition and checkout error behavior', async ({ page }) => {
    console.log('\n--- Checking BUG-001 ---');
    
    // 1. Navigate to Mukhwas category
    await page.goto(`${BASE_URL}/#mukhwas`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Track API requests & responses
    const apiResponses: { url: string; status: number; body: any }[] = [];
    page.on('response', async (resp) => {
      if (resp.url().includes('/api/cart') || resp.url().includes('/api/order')) {
        try {
          const json = await resp.json();
          apiResponses.push({ url: resp.url(), status: resp.status(), body: json });
        } catch {
          apiResponses.push({ url: resp.url(), status: resp.status(), body: await resp.text() });
        }
      }
    });

    // Check if Chocolate Mukhwas exists on the page
    const chocolateCard = page.locator('.product-card, .card, div').filter({ hasText: /Chocolate Mukhwas/i }).first();
    const exists = await chocolateCard.isVisible().catch(() => false);
    console.log('Chocolate Mukhwas product card found:', exists);

    if (exists) {
      // Find add to cart button on that card
      const addBtn = chocolateCard.locator('button').filter({ hasText: /Add/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        console.log('Clicking Add to Cart for Chocolate Mukhwas...');
        await addBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Inspect localStorage cart
    const localCart = await page.evaluate(() => {
      return localStorage.getItem('hiya_shopping_cart') || localStorage.getItem('cart') || '[]';
    });
    console.log('Local storage cart contents:', localCart);

    // Check API response for cart sync
    const cartSyncResp = apiResponses.find(r => r.url.includes('/api/cart/items') || r.url.includes('/api/cart'));
    console.log('Cart sync API response:', JSON.stringify(cartSyncResp, null, 2));

    // Navigate to Cart page
    await page.goto(`${BASE_URL}/#cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check if item is listed in cart UI
    const cartItemsCount = await page.locator('.cart-item, [class*="cart-item"], [class*="CartItem"]').count();
    console.log(`Cart UI displays ${cartItemsCount} item(s).`);

    // Check checkout button
    const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout|proceed/i }).first();
    const canCheckout = await checkoutBtn.isVisible().catch(() => false);
    console.log('Checkout button visible:', canCheckout);

    if (canCheckout) {
      console.log('Clicking Checkout / Proceed to Checkout...');
      await checkoutBtn.click();
      await page.waitForTimeout(2500);

      // Check if redirected or if error message is shown
      const pageText = await page.locator('body').innerText();
      const hasEmptyCartMsg = /cart is empty/i.test(pageText);
      const hasStockMsg = /stock|out of stock|not enough stock/i.test(pageText);
      
      console.log('Checkout error analysis:');
      console.log('- "Your cart is empty" message shown:', hasEmptyCartMsg);
      console.log('- Out-of-stock message shown:', hasStockMsg);
      console.log('Checkout API responses:', JSON.stringify(apiResponses.filter(r => r.url.includes('checkout') || r.url.includes('order')), null, 2));
    }
  });

  test('BUG-002 Verification: Coupon apply & save network error handling (missing try/catch)', async ({ page }) => {
    console.log('\n--- Checking BUG-002 ---');

    let unhandledRejections: string[] = [];
    page.on('pageerror', (err) => {
      console.log('Page error / unhandled rejection captured:', err.message);
      unhandledRejections.push(err.message);
    });

    // 1. Check Cart Page coupon apply with network failure
    await page.goto(`${BASE_URL}/#cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Mock API abort / network error on coupon apply
    await page.route('**/api/coupon/**', route => route.abort('failed'));
    await page.route('**/api/order/apply-coupon/**', route => route.abort('failed'));
    await page.route('**/api/order/coupon/**', route => route.abort('failed'));

    const couponInput = page.locator('input[placeholder*="coupon" i], input[placeholder*="promo" i], input[name*="coupon" i]').first();
    const applyBtn = page.locator('button').filter({ hasText: /apply/i }).first();

    if (await couponInput.isVisible().catch(() => false) && await applyBtn.isVisible().catch(() => false)) {
      console.log('Testing coupon apply with simulated network failure...');
      await couponInput.fill('TESTDISCOUNT');
      await applyBtn.click();
      await page.waitForTimeout(2000);

      const toast = page.locator('.toast, [role="alert"], .notification, .error-message').first();
      const toastVisible = await toast.isVisible().catch(() => false);
      const toastText = toastVisible ? await toast.innerText() : 'None';
      
      console.log('Coupon Apply Network Error result:');
      console.log('- UI Error Toast visible:', toastVisible, `("${toastText}")`);
      console.log('- Unhandled rejections count:', unhandledRejections.length);
    } else {
      console.log('Coupon input/button not found on empty cart. Adding dummy item first...');
    }

    // 2. Check Admin Coupon Save with network failure
    await page.goto(`${BASE_URL}/#admin/coupons`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const createBtn = page.locator('button').filter({ hasText: /add coupon|create coupon|new coupon/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      const saveBtn = page.locator('button').filter({ hasText: /save|submit/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        console.log('Testing Admin coupon save with simulated network failure...');
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('- Admin save unhandled rejections count:', unhandledRejections.length);
      }
    }
  });

});
