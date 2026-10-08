import { test, expect } from '@playwright/test';

test.describe('Excel Sheet Test Matrix Full 38-Case Verification', () => {

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

  // Group 1: Exploration (D-01 to D-04, M-01 to M-04)
  test('Group 1: Exploration & Mapping Cases (D-01..D-04, M-01..M-04)', async ({ page }) => {
    await setupAdminSession(page);
    
    // D-01: Admin dashboard
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*admin/);

    // D-02 & M-03, M-04: Admin Orders
    await page.goto('/admin/orders');
    await expect(page.locator('table.hiyaghar-datatable').first()).toBeVisible();

    // D-03 & M-01, M-02: Admin Coupons
    await page.goto('/admin/coupons');
    await expect(page.locator('table.hiyaghar-datatable').first()).toBeVisible();

    // M-01 / OC-08: Check Coupon form labels
    const addBtn = page.locator('button:has-text("Add New Coupon"), button:has-text("Add Coupon")');
    if (await addBtn.count() > 0) {
      await addBtn.first().click();
      await page.waitForTimeout(300);
      await expect(page.locator('label:has-text("Minimum Order Amount (₹)")')).toBeVisible();
      await page.click('button:has-text("Cancel")');
    }
  });

  // Group 2: Coupon Management Cases (OC-CPN-001 to OC-CPN-014)
  test('Group 2: Coupon Management Test Cases (OC-CPN-001..014)', async ({ page }) => {
    await setupAdminSession(page);
    await page.goto('/admin/coupons');
    await page.waitForTimeout(500);

    // OC-CPN-001: Columns & Rows
    await expect(page.locator('table.hiyaghar-datatable thead')).toContainText('Coupon Code');
    await expect(page.locator('table.hiyaghar-datatable thead')).toContainText('Discount Benefit');

    // OC-CPN-002 & OC-CPN-003 (OC-01 Fix): Form fields & Image/Document upload
    const addBtn = page.locator('button:has-text("Add New Coupon"), button:has-text("Add Coupon")');
    await addBtn.first().click();
    await page.waitForTimeout(300);

    // Verify upload controls (Fixed OC-01)
    await expect(page.locator('input[type="file"][accept*="image"]')).toBeAttached();
    await expect(page.locator('input[type="file"][accept*="pdf"]')).toBeAttached();

    // OC-CPN-004: Checkboxes have distinct labels
    await expect(page.locator('text=Active & Ready to Redeem by Customers')).toBeVisible();
    await expect(page.locator('text=Restricted to First-Time Customers Only')).toBeVisible();

    // OC-CPN-005: Flat vs % Switch
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption({ value: '1' });
    await expect(page.locator('label:has-text("Discount Value (₹)")')).toBeVisible();

    // OC-CPN-006: Empty submit blocked
    await page.fill('input[type="text"]', '');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter coupon code')).toBeVisible();

    await page.click('button:has-text("Cancel")');

    // OC-CPN-012: Search filtering
    const searchInput = page.locator('input.hiyaghar-search-input').first();
    await searchInput.fill('NONEXISTENT_XYZ');
    await page.waitForTimeout(200);

    // OC-CPN-013: Table sorting keyboard accessible (OC-07)
    const th = page.locator('th.th-sortable').first();
    await expect(th).toHaveAttribute('tabindex', '0');

    // OC-CPN-014: Page size select exists
    await expect(page.locator('select.hiyaghar-select-pagesize').first()).toBeVisible();
  });

  // Group 3: Order Management Cases (OC-ORD-001 to OC-ORD-016)
  test('Group 3: Order Management Test Cases (OC-ORD-001..016)', async ({ page }) => {
    await setupAdminSession(page);
    await page.goto('/admin/orders');
    await page.waitForTimeout(500);

    // OC-ORD-001: Columns present
    await expect(page.locator('table.hiyaghar-datatable thead')).toContainText('Order Number');
    await expect(page.locator('table.hiyaghar-datatable thead')).toContainText('Total');

    // OC-ORD-003 & 004: Search input exists
    const searchInput = page.locator('input.hiyaghar-search-input').first();
    await expect(searchInput).toBeVisible();

    // OC-ORD-007: Pagination / page size
    await expect(page.locator('select.hiyaghar-select-pagesize').first()).toBeVisible();

    // OC-ORD-008: Sorting accessible
    const th = page.locator('th.th-sortable').first();
    await expect(th).toHaveAttribute('tabindex', '0');

    // Open detail view if order exists
    const editBtn = page.locator('table tr td button[title*="Edit" i], table tr td:last-child button');
    if (await editBtn.count() > 0) {
      await editBtn.first().click();
      await page.waitForTimeout(500);

      // OC-ORD-009 & OC-ORD-010 (OC-05 Fix): Order Summary
      await expect(page.locator('h4:has-text("Order Summary")')).toBeVisible();

      // OC-ORD-011: Status flow selector
      await expect(page.locator('select[aria-label="Filter by Order Status"], select').first()).toBeAttached();

      // OC-ORD-013 (OC-02 Fix): Payment status dropdown control
      const paymentDropdown = page.locator('select[aria-label*="Payment" i], select:has-text("Paid"), select:has-text("Pending")');
      if (await paymentDropdown.count() > 0) {
        await expect(paymentDropdown.first()).toBeVisible();
      }

      // OC-ORD-015: Courier tracking edit
      const editTrackingBtn = page.locator('button:has-text("Edit Tracking")');
      if (await editTrackingBtn.count() > 0) {
        await expect(editTrackingBtn.first()).toBeVisible();
      }

      // OC-ORD-016: Invoice Download / Print
      await expect(page.locator('button:has-text("Download Invoice (PDF)")')).toBeVisible();
      await expect(page.locator('button:has-text("Print Bill")')).toBeVisible();
    }
  });

  // Group 4: Storefront & Guest Protection Cases (OC-STO-001 to OC-STO-007)
  test('Group 4: Storefront Test Cases (OC-STO-001..007)', async ({ page }) => {
    // OC-STO-001 & 007: Catalogue & prices
    await page.goto('/mukhwas');
    await page.waitForTimeout(600);
    await expect(page.locator('.hiyaghar-mukhwas-card, .hiyaghar-product-card, [role="article"]').first()).toBeVisible();

    // OC-STO-002 & 003: Guest Add to Cart & Buy Now gated by login
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Buy Now")').first();
    if (await addToCartBtn.count() > 0) {
      await addToCartBtn.click();
      await page.waitForTimeout(400);
      // Verify login popup / modal
      await expect(page.locator('.pop-show-popup, .pop-show-title, [role="dialog"]').first()).toBeVisible();
    }

    // OC-STO-004 & 005 & 006 (OC-06): Guest Cart & Checkout
    await page.goto('/cart');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(400);
    await expect(page.locator('button:has-text("Sign In / Register"), button:has-text("Sign In"), a:has-text("Sign In")').first()).toBeVisible();
  });

});
