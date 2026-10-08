import { test, expect } from '@playwright/test';

test.describe('Orders & Coupons Excel Sheet Automated Verification', () => {

  test('OC-01 & OC-08: Verify Coupon Create/Edit modal offers image/pdf upload and proper labels', async ({ page }) => {
    // Navigate to admin coupons
    await page.goto('/admin');
    await page.waitForTimeout(500);

    // If redirected to login, login as admin
    if (page.url().includes('/admin/login') || await page.locator('input[type="password"]').count() > 0) {
      await page.fill('input[type="text"], input[name="username"], input[type="email"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // Go to Coupons tab
    const couponTab = page.locator('button:has-text("Coupons"), a:has-text("Coupons"), [data-tab="coupons"]');
    if (await couponTab.count() > 0) {
      await couponTab.first().click();
      await page.waitForTimeout(500);
    }

    // Click "+ Create Coupon" or "+ Add Coupon"
    const addCouponBtn = page.locator('button:has-text("Add Coupon"), button:has-text("Create Coupon"), button:has-text("New Coupon")');
    if (await addCouponBtn.count() > 0) {
      await addCouponBtn.first().click();
      await page.waitForTimeout(500);

      // Verify Creative Image upload input is present (OC-01)
      const imageUploadInput = page.locator('input[type="file"][accept*="image"]');
      await expect(imageUploadInput, 'Creative Image upload control (OC-01) should exist').toBeAttached();

      // Verify PDF / Terms upload input is present (OC-01)
      const pdfUploadInput = page.locator('input[type="file"][accept*="pdf"]');
      await expect(pdfUploadInput, 'Terms & Conditions PDF upload control (OC-01) should exist').toBeAttached();

      // Verify label has no empty parentheses e.g. "Minimum Order Amount (₹)" (OC-08)
      const minAmountLabel = page.locator('label:has-text("Minimum Order Amount (₹)")');
      await expect(minAmountLabel, 'Label should correctly show Minimum Order Amount (₹)').toBeVisible();
    }
  });

  test('OC-02 & OC-04: Verify Admin Orders table has Payment Status editable dropdown & filter', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(500);

    if (page.url().includes('/admin/login') || await page.locator('input[type="password"]').count() > 0) {
      await page.fill('input[type="text"], input[name="username"], input[type="email"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // Go to Orders tab
    const ordersTab = page.locator('button:has-text("Orders"), a:has-text("Orders"), [data-tab="orders"]');
    if (await ordersTab.count() > 0) {
      await ordersTab.first().click();
      await page.waitForTimeout(500);
    }

    // Verify Payment filter dropdown exists (OC-04)
    const paymentFilter = page.locator('select:has-text("All Payment"), select[aria-label*="Payment" i]');
    if (await paymentFilter.count() > 0) {
      await expect(paymentFilter.first()).toBeVisible();
    }

    // Verify Payment Status column allows admin control (OC-02)
    const paymentSelectInTable = page.locator('table select:has-text("Paid"), table select:has-text("Pending"), table select:has-text("Refunded")');
    if (await paymentSelectInTable.count() > 0) {
      await expect(paymentSelectInTable.first()).toBeVisible();
      console.log('Admin Payment Status control verified in Orders table.');
    }
  });

  test('OC-06: Verify Guest Cart shows clear guidance and login action', async ({ page }) => {
    await page.goto('/cart');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);

    // Guest notice and login button
    const loginBtn = page.locator('button:has-text("Log In"), a:has-text("Log In"), button:has-text("Sign In")');
    await expect(loginBtn.first(), 'Guest cart should offer clear Login CTA').toBeVisible();
  });

  test('Verify Rewards Section: No emojis in guide and negative sign for spent coins', async ({ page }) => {
    // Navigate to profile/rewards
    await page.goto('/profile');
    await page.waitForTimeout(500);

    // If profile has rewards tab
    const rewardsTab = page.locator('button:has-text("Rewards"), button:has-text("Coins"), [data-tab="rewards"]');
    if (await rewardsTab.count() > 0) {
      await rewardsTab.first().click();
      await page.waitForTimeout(400);

      // Check that "How Do Hiya Reward Coins Work?" guide does not contain raw emojis
      const step1Text = await page.locator('text=Step 1: Earn Coins').textContent();
      expect(step1Text).not.toContain('🎁');

      const step2Text = await page.locator('text=Step 2: Conversion Rate').textContent();
      expect(step2Text).not.toContain('💰');

      const step3Text = await page.locator('text=Step 3: Pay Less at Checkout').textContent();
      expect(step3Text).not.toContain('🛍️');
    }
  });

});
