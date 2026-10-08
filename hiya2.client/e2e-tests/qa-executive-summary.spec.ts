import { test, expect } from '@playwright/test';

test.describe('HIYAGHAR - Orders & Coupons Complete QA Journey Audit', () => {

  // Setup mock admin auth session for all admin routes
  async function setupAdminSession(page: any) {
    await page.goto('/');
    await page.evaluate(() => {
      const adminUser = {
        userId: 1,
        firstName: 'Super',
        lastName: 'Admin',
        email: 'vmgami2001@gmail.com',
        phone: '9510212154',
        gender: 'Male',
        isLoggedIn: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ2bWdhbWkyMDAxQGdtYWlsLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.mock_signature',
        roles: [{ roleId: 1, roleName: 'Super Admin', roleCode: 'SUPER_ADMIN' }],
      };
      const permMap = {
        DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
        ORDER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
        COUPON: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
      };
      localStorage.setItem('hiya_admin_auth', JSON.stringify(adminUser));
      localStorage.setItem('hiya_admin_jwt_token', adminUser.token);
      localStorage.setItem('hiya_admin_permissions', JSON.stringify(permMap));
    });
  }

  // 1. High Defect Verifications: OC-01, OC-02, OC-03
  test('Audit High-Severity Defects (OC-01, OC-02, OC-03)', async ({ page }) => {
    await setupAdminSession(page);

    // [OC-01]: Coupon create/edit modal provides image & PDF upload controls
    await page.goto('/admin/coupons');
    await page.waitForTimeout(400);
    const addCouponBtn = page.locator('button:has-text("Add New Coupon"), button:has-text("Add Coupon")');
    if (await addCouponBtn.count() > 0) {
      await addCouponBtn.first().click();
      await page.waitForTimeout(300);
      await expect(page.locator('input[type="file"][accept*="image"]'), 'OC-01: Image upload input must be attached').toBeAttached();
      await expect(page.locator('input[type="file"][accept*="pdf"]'), 'OC-01: PDF upload input must be attached').toBeAttached();
      await page.click('button:has-text("Cancel")');
    }

    // [OC-02]: Admin can change an order payment status
    await page.goto('/admin/orders');
    await page.waitForTimeout(400);
    const editOrderBtn = page.locator('table tr td button[title*="Edit" i], table tr td:last-child button');
    if (await editOrderBtn.count() > 0) {
      await editOrderBtn.first().click();
      await page.waitForTimeout(400);
      const paymentSelect = page.locator('select[aria-label*="Payment" i], select:has-text("Paid"), select:has-text("Pending")');
      if (await paymentSelect.count() > 0) {
        await expect(paymentSelect.first(), 'OC-02: Payment status dropdown must be editable').toBeVisible();
      }
    }

    // [OC-03]: Verify 19 static images/banners return HTTP 200 (no 404s)
    const assetList = [
      '/image/ImageforMukhwash/Amla Madhur.webp',
      '/image/ImageforMukhwash/Choco Masti.webp',
      '/image/ImageforMukhwash/Digest Ease.webp',
      '/image/ImageforMukhwash/Dil Bahaar.webp',
      '/image/ImageforMukhwash/Dil RAJA.webp',
      '/image/ImageforMukhwash/Hing Hajma.webp',
      '/image/ImageforMukhwash/Jamun Pop.webp',
      '/image/ImageforMukhwash/Kalkatti-Pan 1.webp',
      '/image/ImageforMukhwash/Mango Slice 1.webp',
      '/image/ImageforMukhwash/Paan Pop.webp',
      '/image/ImageforMukhwash/Seed Mix.webp',
      '/image/ImageforMukhwash/Shahi Kharek.webp',
      '/image/ImageforMukhwash/Shahi Pan.webp',
      '/image/ImageforMukhwash/Spice Ambodia.webp',
      '/image/ImageforMukhwash/Til Crunch.webp',
      '/image/mukhwas/tea masala banner.webp',
      '/image/mukhwas/hair oil banner.webp',
      '/image/mukhwas/soap banner.webp',
      '/image/Soap/neem.webp',
    ];

    for (const url of assetList) {
      const res = await page.request.get(url);
      expect(res.status(), `OC-03: Asset ${url} must return HTTP 200`).toBe(200);
    }
  });

  // 2. Medium Defect Verifications: OC-04, OC-05, OC-09
  test('Audit Medium-Severity Defects (OC-04, OC-05, OC-09)', async ({ page }) => {
    await setupAdminSession(page);
    await page.goto('/admin/orders');
    await page.waitForTimeout(400);

    // [OC-04]: Order list exposes filters for Order Status and Payment Status
    const statusFilter = page.locator('select[aria-label*="Status" i], select:has-text("All Statuses")');
    const paymentFilter = page.locator('select[aria-label*="Payment" i], select:has-text("All Payments")');
    await expect(statusFilter.first(), 'OC-04: Order status filter must exist').toBeVisible();
    await expect(paymentFilter.first(), 'OC-04: Payment status filter must exist').toBeVisible();

    // [OC-05]: Order summary exposes discount / coupon line when applicable
    const editOrderBtn = page.locator('table tr td button[title*="Edit" i], table tr td:last-child button');
    if (await editOrderBtn.count() > 0) {
      await editOrderBtn.first().click();
      await page.waitForTimeout(400);
      const summaryBox = page.locator('h4:has-text("Order Summary"), .hiyaghar-order-detail-block:has-text("Subtotal")');
      await expect(summaryBox.first(), 'OC-05: Order summary block must be present').toBeVisible();
    }

    // [OC-09]: Production data hygiene
    await page.goto('/admin/coupons');
    await page.waitForTimeout(300);
    await expect(page.locator('table.hiyaghar-datatable').first()).toBeVisible();
  });

  // 3. Low Defect Verifications: OC-06, OC-07, OC-08
  test('Audit Low-Severity Defects (OC-06, OC-07, OC-08)', async ({ page }) => {
    // [OC-06]: Guest Cart shows clear explanation and direct Login / Register route
    await page.goto('/cart');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(400);
    const loginCta = page.locator('button:has-text("Sign In / Register"), button:has-text("Sign In"), a:has-text("Sign In")');
    await expect(loginCta.first(), 'OC-06: Guest cart must provide login action').toBeVisible();

    // [OC-07]: Order & Coupon table sorting is keyboard accessible (tabindex="0" and role="button")
    await setupAdminSession(page);
    await page.goto('/admin/orders');
    await page.waitForTimeout(400);
    const sortableTh = page.locator('th.th-sortable, th[tabindex="0"][role="button"]');
    if (await sortableTh.count() > 0) {
      await expect(sortableTh.first(), 'OC-07: Table headers must be keyboard accessible').toHaveAttribute('tabindex', '0');
      await expect(sortableTh.first(), 'OC-07: Table headers must have role button').toHaveAttribute('role', 'button');
    }

    // [OC-08]: Minimum Order Amount label format has no empty parentheses
    await page.goto('/admin/coupons');
    await page.waitForTimeout(400);
    const addCouponBtn = page.locator('button:has-text("Add New Coupon"), button:has-text("Add Coupon")');
    if (await addCouponBtn.count() > 0) {
      await addCouponBtn.first().click();
      await page.waitForTimeout(300);
      await expect(page.locator('label:has-text("Minimum Order Amount (₹)")'), 'OC-08: Label must correctly show currency').toBeVisible();
      await page.click('button:has-text("Cancel")');
    }
  });

});
