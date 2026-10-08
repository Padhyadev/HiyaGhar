import { test, expect } from '@playwright/test';

test.describe('Console Error & Health Auditor (Every Module)', () => {
  // Helper to attach console and error listeners to capture any issues
  const setupConsoleAuditor = (page: any) => {
    const logs: { errors: string[]; warnings: string[]; pageErrors: string[]; failedRequests: string[] } = {
      errors: [],
      warnings: [],
      pageErrors: [],
      failedRequests: [],
    };

    page.on('console', (msg: any) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        logs.errors.push(text);
      } else if (type === 'warning') {
        logs.warnings.push(text);
      }
    });

    page.on('pageerror', (exception: Error) => {
      logs.pageErrors.push(exception.message);
    });

    // Also catch failed network requests (404, 500, etc.)
    page.on('response', (response: any) => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && !url.includes('favicon')) {
        logs.failedRequests.push(`[${status}] ${url}`);
      }
    });

    return logs;
  };

  // -------------------------------------------------------------
  // 1. STOREFRONT MODULES CONSOLE CHECKS
  // -------------------------------------------------------------
  const storefrontModules = [
    { name: 'Home Page', path: '/' },
    { name: 'Mukhwas Catalog', path: '/mukhwas' },
    { name: 'Tea Masala Catalog', path: '/tea-masala' },
    { name: 'Handmade Soap Catalog', path: '/handmade-soap' },
    { name: 'Hair Oil Catalog', path: '/hair-oil' },
    { name: 'Gift Hampers Catalog', path: '/gift-hampers' },
    { name: 'Customize Combo Builder', path: '/customize-combo' },
    { name: 'Shopping Cart', path: '/cart' },
    { name: 'Checkout Page', path: '/checkout' },
    { name: 'Order Confirmation Page', path: '/order-confirmation' },
    { name: 'Customer Login / Register', path: '/login' },
    { name: 'Track Order', path: '/track-order' },
    { name: 'Our Story', path: '/our-story' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms & Conditions', path: '/terms-conditions' },
    { name: 'Refund Policy', path: '/refund-policy' },
    { name: 'Shipping Policy', path: '/shipping-policy' },
    { name: 'Contact Us', path: '/contact-us' },
  ];

  for (const mod of storefrontModules) {
    test(`Storefront Module Console Health: ${mod.name} (${mod.path})`, async ({ page }) => {
      const logs = setupConsoleAuditor(page);

      await page.goto(mod.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Verify zero uncaught JS runtime errors
      if (logs.pageErrors.length > 0) {
        console.error(`[RUNTIME ERROR in ${mod.name}]:`, logs.pageErrors);
      }
      expect(logs.pageErrors, `Uncaught JS error in ${mod.name}`).toEqual([]);

      // Verify zero network failures (like 404 on API endpoints)
      if (logs.failedRequests.length > 0) {
        console.error(`[FAILED HTTP REQUESTS in ${mod.name}]:`, logs.failedRequests);
      }
      expect(logs.failedRequests, `Failed HTTP requests (404/500) found in ${mod.name}`).toEqual([]);

      const fatalErrors = logs.errors.filter((err) => !err.includes('favicon'));
      if (fatalErrors.length > 0) {
        console.warn(`[CONSOLE ERRORS in ${mod.name}]:`, fatalErrors);
      }
      expect(fatalErrors, `Console errors found in ${mod.name}`).toEqual([]);
    });
  }

  // -------------------------------------------------------------
  // 2. ADMIN PORTAL MODULES CONSOLE CHECKS
  // -------------------------------------------------------------
  const adminModules = [
    { name: 'Admin Login', path: '/admin/login', needsAuth: false },
    { name: 'Admin Dashboard', path: '/admin/dashboard', needsAuth: true },
    { name: 'Admin Products', path: '/admin/products', needsAuth: true },
    { name: 'Admin Categories', path: '/admin/categories', needsAuth: true },
    { name: 'Admin Orders', path: '/admin/orders', needsAuth: true },
    { name: 'Admin Customers', path: '/admin/customers', needsAuth: true },
    { name: 'Admin Coupons', path: '/admin/coupons', needsAuth: true },
    { name: 'Admin Stock Management', path: '/admin/stock', needsAuth: true },
    { name: 'Admin Role & Security', path: '/admin/roles', needsAuth: true },
    { name: 'Admin Users', path: '/admin/users', needsAuth: true },
    { name: 'Admin Attributes', path: '/admin/attributes', needsAuth: true },
    { name: 'Admin Menu Registry', path: '/admin/menus', needsAuth: true },
    { name: 'Admin Store Settings', path: '/admin/shipping', needsAuth: true },
    { name: 'Admin Combo Packs', path: '/admin/combo-packs', needsAuth: true },
    { name: 'Admin Dropdown & LOV Master', path: '/admin/lov', needsAuth: true },
    { name: 'Admin Reward Slabs', path: '/admin/reward-slabs', needsAuth: true },
    { name: 'Admin Reviews', path: '/admin/reviews', needsAuth: true },
  ];

  for (const adminMod of adminModules) {
    test(`Admin Module Console Health: ${adminMod.name} (${adminMod.path})`, async ({ page }) => {
      const logs = setupConsoleAuditor(page);

      if (adminMod.needsAuth) {
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
            roles: [{ roleId: 1, roleName: 'Super Admin', roleCode: 'SUPER_ADMIN' }],
          };

          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
          const payload = btoa(
            JSON.stringify({
              sub: '1',
              email: 'admin@hiyaghar.com',
              exp: Math.floor(Date.now() / 1000) + 86400 * 30,
            })
          );
          const mockJwt = `${header}.${payload}.mockSignature123`;

          const allPermissions = {
            DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dashboard' },
            USER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'User' },
            ROLE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Role' },
            PRODUCT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Product' },
            MENU: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Menu' },
            CUSTOMER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Customer' },
            CATEGORY: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Category' },
            ATTRIBUTE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Attribute' },
            HOMEPAGECOMPONENT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'HomePageComponent' },
            GIFTHAMPER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'GiftHamper' },
            ORDER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Order' },
            SHIPPING: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Shipping' },
            COMBOPACK: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'ComboPack' },
            LOV: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Lov' },
            STOCK: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Stock' },
            REWARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Reward' },
            COUPON: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Coupon' },
            REVIEW: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Review' },
          };

          localStorage.setItem('hiya_admin_auth', JSON.stringify(adminUser));
          localStorage.setItem('hiya_admin_jwt_token', mockJwt);
          localStorage.setItem('hiya_admin_permissions', JSON.stringify(allPermissions));
        });
      }

      await page.goto(adminMod.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Verify zero uncaught JS runtime errors
      if (logs.pageErrors.length > 0) {
        console.error(`[ADMIN RUNTIME ERROR in ${adminMod.name}]:`, logs.pageErrors);
      }
      expect(logs.pageErrors, `Uncaught JS error in ${adminMod.name}`).toEqual([]);

      const fatalErrors = logs.errors.filter(
        (err) =>
          !err.includes('favicon') &&
          !err.includes('404 (Not Found)') &&
          !err.includes('Failed to load resource')
      );

      if (fatalErrors.length > 0) {
        console.warn(`[ADMIN CONSOLE ERRORS in ${adminMod.name}]:`, fatalErrors);
      }
      expect(fatalErrors, `Console errors found in ${adminMod.name}`).toEqual([]);
    });
  }
});
