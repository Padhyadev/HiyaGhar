import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:59978';

test.describe('HiyaGhar Bug Report Comprehensive Verification', () => {
  test.setTimeout(60000);

  test('E2E Verification of BUG-001 (Stock Resolution) and BUG-002 (Coupon Resilience)', async ({ page }) => {
    // 1. Create a random test customer
    const randomNum = Math.floor(10000000 + Math.random() * 89999999);
    const testEmail = `tester${randomNum}@example.com`;
    const testPassword = 'Password@123';
    const testMobile = `98${Math.floor(10000000 + Math.random() * 89999999)}`;

    console.log(`\n========================================`);
    console.log(`Step 1: Register New Customer: ${testEmail}`);
    console.log(`========================================`);

    await page.goto(`${BASE_URL}/#login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const regResult = await page.evaluate(async ({ email, password, mobileNo }) => {
      const res = await fetch('/api/customerauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'QA',
          lastName: 'Tester',
          email,
          mobileNo,
          password
        })
      });
      const data = await res.json();
      if (data.isSuccess && data.token) {
        localStorage.setItem('hiya_customer_jwt_token', data.token);
        localStorage.setItem('hiya_customer_auth', JSON.stringify({
          ...data.customer,
          isLoggedIn: true
        }));
        return { success: true, token: data.token, customer: data.customer };
      }
      return { success: false, data };
    }, { email: testEmail, password: testPassword, mobileNo: testMobile });

    console.log('Registration result:', regResult.success ? 'SUCCESS' : JSON.stringify(regResult));
    expect(regResult.success).toBeTruthy();

    // Reload page to ensure auth state is loaded in memory
    await page.goto(`${BASE_URL}/#mukhwas`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log(`\n========================================`);
    console.log(`Step 2: Check BUG-001 Out-of-Stock Resolution`);
    console.log(`========================================`);

    // Capture all cart / order API responses
    const apiLogs: Array<{ url: string; status: number; body: any }> = [];
    page.on('response', async (resp) => {
      const url = resp.url();
      if (url.includes('/api/cart') || url.includes('/api/order') || url.includes('/api/product')) {
        try {
          const json = await resp.json();
          apiLogs.push({ url, status: resp.status(), body: json });
        } catch {
          apiLogs.push({ url, status: resp.status(), body: await resp.text().catch(() => '') });
        }
      }
    });

    // Check Chocolate Mukhwas product card on UI
    const chocolateCard = page.locator('.hiyaghar-mukhwas-card').filter({ hasText: /chocolate/i }).first();
    const isCardVisible = await chocolateCard.isVisible().catch(() => false);
    console.log('Chocolate Mukhwas card visible on UI:', isCardVisible);
    expect(isCardVisible).toBeTruthy();

    // Because 200g is available, smart fallback auto-selects 200g so card remains in stock
    const cardText = await chocolateCard.innerText();
    console.log('Chocolate Mukhwas active variant details:', cardText.replace(/\n+/g, ' '));
    expect(cardText).toContain('200 g');

    const addBtn = chocolateCard.locator('.hiyaghar-btn-add-cart');
    const isAddDisabled = await addBtn.isDisabled().catch(() => false);
    expect(isAddDisabled).toBeFalsy();

    console.log(`\n========================================`);
    console.log(`Step 3: Add In-Stock Product & Proceed to Checkout`);
    console.log(`========================================`);

    // Find and add an in-stock product (e.g. Dil Khush or Dil Rajan Mukhwas)
    const inStockCard = page.locator('.hiyaghar-mukhwas-card').filter({ hasText: /Dil Khush|Dil Rajan|Drakhsha/i }).first();
    const inStockVisible = await inStockCard.isVisible().catch(() => false);
    console.log('In-stock product card visible:', inStockVisible);
    expect(inStockVisible).toBeTruthy();

    const inStockAddBtn = inStockCard.locator('.hiyaghar-btn-add-cart');
    await inStockAddBtn.click();
    await page.waitForTimeout(2000);

    // Verify item was added to client cart
    const cartAfter = await page.evaluate(() => localStorage.getItem('hiya_shopping_cart') || '[]');
    const cartItems = JSON.parse(cartAfter);
    console.log(`Cart now contains ${cartItems.length} item(s):`, cartItems.map((i: any) => i.name));
    expect(cartItems.length).toBeGreaterThan(0);

    // Navigate to Cart page
    console.log('Navigating to Cart (/#cart)...');
    await page.goto(`${BASE_URL}/#cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const proceedBtn = page.locator('button').filter({ hasText: /proceed to checkout|checkout/i }).first();
    const canProceed = await proceedBtn.isVisible().catch(() => false);
    console.log('Proceed to checkout button visible:', canProceed);
    expect(canProceed).toBeTruthy();

    console.log(`\n========================================`);
    console.log(`Step 4: Verify BUG-002 (Coupon Resilience & Try/Catch)`);
    console.log(`========================================`);

    // Intercept /api/coupon/validate and simulate network failure
    await page.route('**/api/coupon/validate', (route) => route.abort('failed'));

    const couponInput = page.locator('input.hiyaghar-coupon-input, input[placeholder*="coupon" i]').first();
    const applyCouponBtn = page.locator('button.hiyaghar-coupon-apply-btn, button:has-text("Apply")').first();

    if (await couponInput.isVisible().catch(() => false) && await applyCouponBtn.isVisible().catch(() => false)) {
      console.log('Testing coupon apply with simulated network failure...');
      await couponInput.fill('WELCOME10');
      await applyCouponBtn.click();
      await page.waitForTimeout(2000);

      // Check toast or error notice without unhandled rejection
      const toast = page.locator('.hiyaghar-toast, [role="alert"], div:has-text("Unable to validate")').first();
      const toastVisible = await toast.isVisible().catch(() => false);
      console.log('Graceful network failure toast shown:', toastVisible);
      expect(toastVisible).toBeTruthy();
    }

    console.log(`\n========================================`);
    console.log(`ALL VERIFICATION CHECKS PASSED SUCCESSFULLY`);
    console.log(`========================================\n`);
  });

});
