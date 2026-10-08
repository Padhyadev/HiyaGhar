import { test, expect } from '@playwright/test';

test.describe('Step 10: Admin Authentication & Security (admin-auth.spec.ts)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => console.log('[ADMIN AUTH ERROR]:', err.message));
  });

  // 1. Empty Form Validation
  test('10.A.1 Admin Login: Empty form validation error prompts', async ({ page }) => {
    await page.goto('/admin/login');
    await page.evaluate(() => {
      localStorage.removeItem('hiya_admin_auth');
      localStorage.removeItem('hiya_admin_jwt_token');
      localStorage.removeItem('hiya_admin_permissions');
    });
    await page.goto('/admin/login');
    await page.waitForTimeout(300);

    const submitBtn = page.locator('.hiyaghar-admin-login-submit');
    await submitBtn.click();

    const errors = page.locator('.hiyaghar-field-error');
    expect(await errors.count()).toBeGreaterThanOrEqual(1);
  });

  // 2. Invalid Email & Wrong Password Handling
  test('10.A.2 Admin Login: Invalid email and wrong password error prompts', async ({ page }) => {
    await page.goto('/admin/login');

    const emailInput = page.locator('input[name="admin_user_email"]');
    const passInput = page.locator('input[name="admin_user_password"]');
    const submitBtn = page.locator('.hiyaghar-admin-login-submit');

    // Invalid email syntax
    await emailInput.fill('admin-invalid-syntax');
    await passInput.fill('anyPass123');
    await submitBtn.click();
    await expect(page.locator('.hiyaghar-field-error').first()).toBeVisible();

    // Invalid credentials submission
    await emailInput.fill('unauthorized@test.com');
    await passInput.fill('WrongPassword123!');
    await submitBtn.click();
    await page.waitForTimeout(400);

    const loginError = page.locator('.hiyaghar-admin-login-error, .hiyaghar-field-error');
    await expect(loginError.first()).toBeVisible();
  });

  // 3. RBAC / Protected Route Guard
  test('10.A.3 RBAC / Route Guard: Unauthenticated guest redirected to login', async ({ page }) => {
    await page.goto('/admin/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    const protectedUrls = ['/admin/dashboard', '/admin/products', '/admin/orders', '/admin/coupons'];

    for (const url of protectedUrls) {
      await page.goto(url);
      await page.waitForTimeout(200);

      // Verify unauthenticated user sees login card
      const loginCard = page.locator('.hiyaghar-admin-login-card');
      await expect(loginCard).toBeVisible();
    }
  });
});
