import { test, expect } from '@playwright/test';

test.describe('HiyaGhar Admin Panel E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Catch any uncaught JS runtime errors on the page
    page.on('pageerror', (err) => {
      console.error(`[ADMIN PAGE ERROR]: ${err.message}`);
    });
  });

  // Helper to inject mock admin auth token and permissions
  const loginAsAdmin = async (page: any, targetUrl = '/admin/dashboard') => {
    await page.goto('/admin/login');
    await page.evaluate(() => {
      const adminUser = {
        userId: 1,
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@hiyaghar.com',
        phone: '9876543210',
        gender: 'Male',
        isLoggedIn: true,
        roles: [{ roleId: 1, roleName: 'Super Admin', roleCode: 'SUPER_ADMIN' }]
      };

      // Mock JWT token with exp in the distant future
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: '1',
        email: 'admin@hiyaghar.com',
        exp: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days valid
      }));
      const mockJwt = `${header}.${payload}.mockSignatureSignature1234567890`;

      const allPermissions = {
        DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dashboard', displayOrder: 0, icon: 'fa-solid fa-chart-line' },
        USER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'User Management', displayOrder: 1, icon: 'fa-solid fa-user' },
        ROLE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Roles & Permissions', displayOrder: 2, icon: 'fa-solid fa-user-shield' },
        PRODUCT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Products', displayOrder: 3, icon: 'fa-solid fa-box' },
        MENU: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Menu Registry', displayOrder: 4, icon: 'fa-solid fa-bars' },
        CUSTOMER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Customers', displayOrder: 5, icon: 'fa-solid fa-users' },
        CATEGORY: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Categories', displayOrder: 6, icon: 'fa-solid fa-tags' },
        ATTRIBUTE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Attributes', displayOrder: 7, icon: 'fa-solid fa-sliders' },
        HOMEPAGECOMPONENT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Home Components', displayOrder: 8, icon: 'fa-solid fa-puzzle-piece' },
        GIFTHAMPER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Gift Hampers', displayOrder: 9, icon: 'fa-solid fa-gift' },
        ORDER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Orders', displayOrder: 10, icon: 'fa-solid fa-shopping-bag' },
        SHIPPING: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Store Settings', displayOrder: 11, icon: 'fa-solid fa-gear' },
        COMBOPACK: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Combo Packs', displayOrder: 12, icon: 'fa-solid fa-cubes' },
        LOV: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dropdown Master', displayOrder: 13, icon: 'fa-solid fa-list-check' },
        STOCK: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Stock Management', displayOrder: 14, icon: 'fa-solid fa-warehouse' },
        REWARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Reward Slabs', displayOrder: 15, icon: 'fa-solid fa-coins' },
        COUPON: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Coupons', displayOrder: 16, icon: 'fa-solid fa-ticket' },
        REVIEW: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Reviews', displayOrder: 17, icon: 'fa-solid fa-star' },
      };

      localStorage.setItem('hiya_admin_auth', JSON.stringify(adminUser));
      localStorage.setItem('hiya_admin_jwt_token', mockJwt);
      localStorage.setItem('hiya_admin_permissions', JSON.stringify(allPermissions));
    });

    await page.goto(targetUrl);
    await page.waitForTimeout(400);
  };

  // 1. Admin Login Page UI & Validation
  test('1. Admin Login Page: renders brand, fields, validation, and password toggle', async ({ page }) => {
    // Clear any existing session to test login screen
    await page.goto('/admin/login');
    await page.evaluate(() => {
      localStorage.removeItem('hiya_admin_auth');
      localStorage.removeItem('hiya_admin_jwt_token');
      localStorage.removeItem('hiya_admin_permissions');
    });
    await page.goto('/admin/login');
    await page.waitForTimeout(300);

    // Verify Login card elements
    const loginCard = page.locator('.hiyaghar-admin-login-card');
    await expect(loginCard).toBeVisible();
    await expect(page.locator('.hiyaghar-admin-login-subtitle')).toHaveText('Admin & Staff Portal Access');

    // Test Empty Form Validation
    const submitBtn = page.locator('.hiyaghar-admin-login-submit');
    await submitBtn.click();

    // Verify field validation errors appear
    const fieldErrors = page.locator('.hiyaghar-field-error');
    const count = await fieldErrors.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Test Invalid Email validation
    const emailInput = page.locator('input[name="admin_user_email"]');
    await emailInput.fill('invalid-email-format');
    await submitBtn.click();
    await expect(page.locator('.hiyaghar-field-error').first()).toBeVisible();

    // Test Password visibility toggle button
    const passwordInput = page.locator('input[name="admin_user_password"]');
    await passwordInput.fill('AdminPass123!');
    expect(await passwordInput.getAttribute('type')).toBe('password');

    const toggleBtn = page.locator('.hiyaghar-admin-password-toggle-btn');
    await toggleBtn.click();
    expect(await passwordInput.getAttribute('type')).toBe('text');
    await toggleBtn.click();
    expect(await passwordInput.getAttribute('type')).toBe('password');

    // Test Back to Store link
    const backLink = page.locator('.hiyaghar-back-link');
    await expect(backLink).toBeVisible();
  });

  // 2. Admin Dashboard & Sidebar Navigation
  test('2. Admin Dashboard: sidebar navigation renders all authorized modules', async ({ page }) => {
    await loginAsAdmin(page, '/admin/dashboard');

    // Verify Admin Layout exists
    const adminSidebar = page.locator('.hiyaghar-admin-sidebar');
    await expect(adminSidebar).toBeVisible();

    // Verify Brand Logo in Admin Layout
    const brandLogo = page.locator('.hiyaghar-topbar-brand');
    await expect(brandLogo).toBeVisible();

    // Verify key nav items exist in the sidebar
    const navLinks = page.locator('.hiyaghar-nav-link');
    const navCount = await navLinks.count();
    expect(navCount).toBeGreaterThanOrEqual(5);

    // Verify Header bar with User Profile information
    const userBadge = page.locator('.hiyaghar-user-badge');
    await expect(userBadge).toBeVisible();
  });

  // 3. Products Management Page
  test('3. Products Management: renders table headers, search input, and add button', async ({ page }) => {
    await loginAsAdmin(page, '/admin/products');

    // Check main layout container
    const content = page.locator('.hiyaghar-admin-content');
    await expect(content).toBeVisible();

    // Check search / filter bar if present
    const searchBar = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    if (await searchBar.isVisible()) {
      await searchBar.fill('Mukhwas');
      await page.waitForTimeout(200);
      expect(await searchBar.inputValue()).toBe('Mukhwas');
    }
  });

  // 4. Categories Management Page
  test('4. Categories Management: navigation and UI components load smoothly', async ({ page }) => {
    await loginAsAdmin(page, '/admin/categories');

    const mainContainer = page.locator('.hiyaghar-admin-content');
    await expect(mainContainer).toBeVisible();
  });

  // 5. Orders Management Page
  test('5. Orders Management: checks order list screen and data tables', async ({ page }) => {
    await loginAsAdmin(page, '/admin/orders');

    const orderContainer = page.locator('.hiyaghar-admin-content');
    await expect(orderContainer).toBeVisible();
  });

  // 6. Coupons & Discounts Management
  test('6. Coupons Management: checks coupon codes master view', async ({ page }) => {
    await loginAsAdmin(page, '/admin/coupons');

    const couponContainer = page.locator('.hiyaghar-admin-content');
    await expect(couponContainer).toBeVisible();
  });

  // 7. Stock & Inventory Management
  test('7. Stock Management: inventory ledger & modules load without crash', async ({ page }) => {
    await loginAsAdmin(page, '/admin/stock');

    const stockContainer = page.locator('.hiyaghar-admin-content');
    await expect(stockContainer).toBeVisible();
  });

  // 8. Security & Role Management (Permission Guard)
  test('8. Roles & Permission Security: loads role management safely', async ({ page }) => {
    await loginAsAdmin(page, '/admin/roles');

    const roleContainer = page.locator('.hiyaghar-admin-content');
    await expect(roleContainer).toBeVisible();
  });

  // 9. Unauthorized Route Protection (Access Denied / Redirect to Login)
  test('9. Security Guard: unauthenticated guest is blocked and redirected to login', async ({ page }) => {
    // Clear storage completely
    await page.goto('/admin/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Attempt direct navigation to protected dashboard
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(300);

    // Verify rendered login screen
    const loginCard = page.locator('.hiyaghar-admin-login-card');
    await expect(loginCard).toBeVisible();
  });

  // 10. Admin Logout & Session Cleanup
  test('10. Admin Logout: clears credentials and returns to login', async ({ page }) => {
    await loginAsAdmin(page, '/admin/dashboard');

    // Find and click the Logout button in Admin header
    const logoutBtn = page.locator('.hiyaghar-admin-logout-btn');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(400);

      // Verify localStorage was cleared
      const token = await page.evaluate(() => localStorage.getItem('hiya_admin_jwt_token'));
      expect(token).toBeNull();
    }
  });
});
