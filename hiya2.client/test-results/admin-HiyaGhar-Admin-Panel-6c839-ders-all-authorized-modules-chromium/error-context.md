# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> HiyaGhar Admin Panel E2E Test Suite >> 2. Admin Dashboard: sidebar navigation renders all authorized modules
- Location: e2e-tests\admin.spec.ts:114:3

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 5
Received:    1
```

# Page snapshot

```yaml
- generic [ref=f1e5]:
  - banner [ref=f1e6]:
    - generic [ref=f1e7]:
      - button "☰" [ref=f1e8] [cursor=pointer]
      - img "HIYA" [ref=f1e10] [cursor=pointer]
    - generic [ref=f1e11]:
      - button "View Storefront" [ref=f1e12] [cursor=pointer]
      - button "Admin Profile and Change Password" [ref=f1e17] [cursor=pointer]:
        - generic [ref=f1e18]: S
        - generic [ref=f1e19]:
          - generic [ref=f1e20]: System Admin
          - generic [ref=f1e21]: Super Admin
      - button "Logout" [ref=f1e22] [cursor=pointer]
  - generic [ref=f1e27]:
    - complementary [ref=f1e28]:
      - navigation [ref=f1e29]:
        - link "Dashboard" [ref=f1e30] [cursor=pointer]
        - generic [ref=f1e34]:
          - button "Catalog & Inventory" [ref=f1e35] [cursor=pointer]
          - generic:
            - region "Catalog & Inventory":
              - link "Products" [ref=f1e43] [cursor=pointer]
              - link "Categories" [ref=f1e47] [cursor=pointer]
              - link "Attributes" [ref=f1e51] [cursor=pointer]
              - link "Combos" [ref=f1e55] [cursor=pointer]
              - link "Gift Hampers" [ref=f1e59] [cursor=pointer]
              - link "Stock & Inventory" [ref=f1e63] [cursor=pointer]
        - generic [ref=f1e67]:
          - button "Orders & Logistics" [ref=f1e68] [cursor=pointer]
          - generic:
            - region "Orders & Logistics":
              - link "Order Management" [ref=f1e76] [cursor=pointer]
              - link "Delivery Pincodes" [ref=f1e80] [cursor=pointer]
              - link "Store Settings" [ref=f1e84] [cursor=pointer]
        - generic [ref=f1e88]:
          - button "Customers & Inquiries" [ref=f1e89] [cursor=pointer]
          - generic:
            - region "Customers & Inquiries":
              - link "Customers" [ref=f1e97] [cursor=pointer]
              - link "Customer Reviews" [ref=f1e101] [cursor=pointer]
              - link "Contact Inquiries" [ref=f1e105] [cursor=pointer]
        - generic [ref=f1e109]:
          - button "Marketing & Promotions" [ref=f1e110] [cursor=pointer]
          - generic:
            - region "Marketing & Promotions":
              - link "Coupons & Vouchers" [ref=f1e118] [cursor=pointer]
              - link "Reward Coins" [ref=f1e122] [cursor=pointer]
        - generic [ref=f1e126]:
          - button "Website & Content" [ref=f1e127] [cursor=pointer]
          - generic:
            - region "Website & Content":
              - link "Homepage Banners" [ref=f1e135] [cursor=pointer]
              - link "FAQ Management" [ref=f1e139] [cursor=pointer]
        - generic [ref=f1e143]:
          - button "System & Security" [ref=f1e144] [cursor=pointer]
          - generic:
            - region "System & Security":
              - link "Users" [ref=f1e152] [cursor=pointer]
              - link "Roles & Permissions" [ref=f1e156] [cursor=pointer]
              - link "Menu Registry" [ref=f1e160] [cursor=pointer]
              - link "Dropdown Masters" [ref=f1e164] [cursor=pointer]
      - paragraph [ref=f1e169]: © 2026 HIYAGHAR Security
    - main [ref=f1e170]:
      - generic [ref=f1e171]:
        - generic [ref=f1e172]:
          - generic [ref=f1e173]:
            - heading "Welcome back, System Admin" [level=2] [ref=f1e174]
            - paragraph [ref=f1e175]: Here is what's happening with your store today. Manage orders, inventory, and analytics.
          - generic [ref=f1e176]:
            - button "Add Product" [ref=f1e177] [cursor=pointer]
            - button "Refresh" [ref=f1e179] [cursor=pointer]
        - generic [ref=f1e181]:
          - generic [ref=f1e182]: "Analytics Timeframe:"
          - generic [ref=f1e185]:
            - button "Today" [ref=f1e186] [cursor=pointer]
            - button "This Week" [ref=f1e187] [cursor=pointer]
            - button "This Month" [ref=f1e188] [cursor=pointer]
            - button "All Time" [ref=f1e189] [cursor=pointer]
        - generic [ref=f1e190]:
          - generic [ref=f1e194]:
            - generic [ref=f1e195]: Weekly Revenue
            - generic [ref=f1e196]: ₹0
            - generic [ref=f1e197]: 0 total orders placed
          - generic [ref=f1e201] [cursor=pointer]:
            - generic [ref=f1e202]: Orders (week)
            - generic [ref=f1e203]: "0"
            - generic [ref=f1e204]: View all orders
          - generic [ref=f1e209] [cursor=pointer]:
            - generic [ref=f1e210]: Pending / To Ship
            - generic [ref=f1e211]: "0"
            - generic [ref=f1e212]: Requires action
          - generic [ref=f1e216] [cursor=pointer]:
            - generic [ref=f1e217]: Live Products
            - generic [ref=f1e218]: "35"
            - generic [ref=f1e219]: In 5 categories
        - generic [ref=f1e220]:
          - generic [ref=f1e221]:
            - generic [ref=f1e222]:
              - heading "Sales & Revenue Trend" [level=3] [ref=f1e223]
              - paragraph [ref=f1e225]:
                - text: "Total Revenue:"
                - strong [ref=f1e226]: ₹0
                - text: across
                - strong [ref=f1e227]: "0"
                - text: order(s) in selected range
            - generic [ref=f1e229]:
              - button "7 Days" [ref=f1e230] [cursor=pointer]
              - button "14 Days" [ref=f1e231] [cursor=pointer]
              - button "30 Days" [ref=f1e232] [cursor=pointer]
              - button "Custom" [ref=f1e233] [cursor=pointer]
          - img [ref=f1e237]:
            - generic [ref=f1e238]: ₹1,000
            - generic [ref=f1e239]: ₹500
            - generic [ref=f1e240]: ₹0
            - generic [ref=f1e241]:
              - generic [ref=f1e242] [cursor=pointer]:
                - generic [ref=f1e244]: Fri 30
                - generic:
                  - generic: "Fri 30: ₹0"
                  - generic: 0 order(s) placed
              - generic [ref=f1e245] [cursor=pointer]:
                - generic [ref=f1e247]: Sat 31
                - generic:
                  - generic: "Sat 31: ₹0"
                  - generic: 0 order(s) placed
              - generic [ref=f1e248] [cursor=pointer]:
                - generic [ref=f1e250]: Sun 1
                - generic:
                  - generic: "Sun 1: ₹0"
                  - generic: 0 order(s) placed
              - generic [ref=f1e251] [cursor=pointer]:
                - generic [ref=f1e253]: Mon 2
                - generic:
                  - generic: "Mon 2: ₹0"
                  - generic: 0 order(s) placed
              - generic [ref=f1e254] [cursor=pointer]:
                - generic [ref=f1e256]: Tue 3
                - generic:
                  - generic: "Tue 3: ₹0"
                  - generic: 0 order(s) placed
              - generic [ref=f1e257] [cursor=pointer]:
                - generic [ref=f1e259]: Wed 4
                - generic:
                  - generic: "Wed 4: ₹0"
                  - generic: 0 order(s) placed
              - generic [ref=f1e260] [cursor=pointer]:
                - generic [ref=f1e262]: Thu 5
                - generic:
                  - generic: "Thu 5: ₹0"
                  - generic: 0 order(s) placed
        - generic [ref=f1e263]:
          - generic [ref=f1e264]:
            - heading "Quick Management" [level=3] [ref=f1e266]
            - generic [ref=f1e268]:
              - generic [ref=f1e272] [cursor=pointer]:
                - strong [ref=f1e273]: Products & Stock
                - generic [ref=f1e274]: Manage 35 products
              - generic [ref=f1e278] [cursor=pointer]:
                - strong [ref=f1e279]: Order Fulfillment
                - generic [ref=f1e280]: Process & dispatch orders
              - generic [ref=f1e284] [cursor=pointer]:
                - strong [ref=f1e285]: Categories
                - generic [ref=f1e286]: Manage 5 collections
              - generic [ref=f1e290] [cursor=pointer]:
                - strong [ref=f1e291]: Customers
                - generic [ref=f1e292]: 0 Registered buyers
          - generic [ref=f1e293]:
            - heading "Inventory Alert" [level=3] [ref=f1e295]
            - generic [ref=f1e301]:
              - strong [ref=f1e302]: All Inventory Healthy
              - paragraph [ref=f1e303]: No products currently below minimum stock threshold.
```

# Test source

```ts
  28  |       const payload = btoa(JSON.stringify({
  29  |         sub: '1',
  30  |         email: 'admin@hiyaghar.com',
  31  |         exp: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days valid
  32  |       }));
  33  |       const mockJwt = `${header}.${payload}.mockSignatureSignature1234567890`;
  34  | 
  35  |       const allPermissions = {
  36  |         DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dashboard', displayOrder: 0, icon: 'fa-solid fa-chart-line' },
  37  |         USER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'User Management', displayOrder: 1, icon: 'fa-solid fa-user' },
  38  |         ROLE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Roles & Permissions', displayOrder: 2, icon: 'fa-solid fa-user-shield' },
  39  |         PRODUCT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Products', displayOrder: 3, icon: 'fa-solid fa-box' },
  40  |         MENU: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Menu Registry', displayOrder: 4, icon: 'fa-solid fa-bars' },
  41  |         CUSTOMER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Customers', displayOrder: 5, icon: 'fa-solid fa-users' },
  42  |         CATEGORY: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Categories', displayOrder: 6, icon: 'fa-solid fa-tags' },
  43  |         ATTRIBUTE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Attributes', displayOrder: 7, icon: 'fa-solid fa-sliders' },
  44  |         HOMEPAGECOMPONENT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Home Components', displayOrder: 8, icon: 'fa-solid fa-puzzle-piece' },
  45  |         GIFTHAMPER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Gift Hampers', displayOrder: 9, icon: 'fa-solid fa-gift' },
  46  |         ORDER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Orders', displayOrder: 10, icon: 'fa-solid fa-shopping-bag' },
  47  |         SHIPPING: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Store Settings', displayOrder: 11, icon: 'fa-solid fa-gear' },
  48  |         COMBOPACK: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Combo Packs', displayOrder: 12, icon: 'fa-solid fa-cubes' },
  49  |         LOV: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dropdown Master', displayOrder: 13, icon: 'fa-solid fa-list-check' },
  50  |         STOCK: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Stock Management', displayOrder: 14, icon: 'fa-solid fa-warehouse' },
  51  |         REWARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Reward Slabs', displayOrder: 15, icon: 'fa-solid fa-coins' },
  52  |         COUPON: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Coupons', displayOrder: 16, icon: 'fa-solid fa-ticket' },
  53  |         REVIEW: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Reviews', displayOrder: 17, icon: 'fa-solid fa-star' },
  54  |       };
  55  | 
  56  |       localStorage.setItem('hiya_admin_auth', JSON.stringify(adminUser));
  57  |       localStorage.setItem('hiya_admin_jwt_token', mockJwt);
  58  |       localStorage.setItem('hiya_admin_permissions', JSON.stringify(allPermissions));
  59  |     });
  60  | 
  61  |     await page.goto(targetUrl);
  62  |     await page.waitForTimeout(400);
  63  |   };
  64  | 
  65  |   // 1. Admin Login Page UI & Validation
  66  |   test('1. Admin Login Page: renders brand, fields, validation, and password toggle', async ({ page }) => {
  67  |     // Clear any existing session to test login screen
  68  |     await page.goto('/admin/login');
  69  |     await page.evaluate(() => {
  70  |       localStorage.removeItem('hiya_admin_auth');
  71  |       localStorage.removeItem('hiya_admin_jwt_token');
  72  |       localStorage.removeItem('hiya_admin_permissions');
  73  |     });
  74  |     await page.goto('/admin/login');
  75  |     await page.waitForTimeout(300);
  76  | 
  77  |     // Verify Login card elements
  78  |     const loginCard = page.locator('.hiyaghar-admin-login-card');
  79  |     await expect(loginCard).toBeVisible();
  80  |     await expect(page.locator('.hiyaghar-admin-login-subtitle')).toHaveText('Admin & Staff Portal Access');
  81  | 
  82  |     // Test Empty Form Validation
  83  |     const submitBtn = page.locator('.hiyaghar-admin-login-submit');
  84  |     await submitBtn.click();
  85  | 
  86  |     // Verify field validation errors appear
  87  |     const fieldErrors = page.locator('.hiyaghar-field-error');
  88  |     const count = await fieldErrors.count();
  89  |     expect(count).toBeGreaterThanOrEqual(1);
  90  | 
  91  |     // Test Invalid Email validation
  92  |     const emailInput = page.locator('input[name="admin_user_email"]');
  93  |     await emailInput.fill('invalid-email-format');
  94  |     await submitBtn.click();
  95  |     await expect(page.locator('.hiyaghar-field-error').first()).toBeVisible();
  96  | 
  97  |     // Test Password visibility toggle button
  98  |     const passwordInput = page.locator('input[name="admin_user_password"]');
  99  |     await passwordInput.fill('AdminPass123!');
  100 |     expect(await passwordInput.getAttribute('type')).toBe('password');
  101 | 
  102 |     const toggleBtn = page.locator('.hiyaghar-admin-password-toggle-btn');
  103 |     await toggleBtn.click();
  104 |     expect(await passwordInput.getAttribute('type')).toBe('text');
  105 |     await toggleBtn.click();
  106 |     expect(await passwordInput.getAttribute('type')).toBe('password');
  107 | 
  108 |     // Test Back to Store link
  109 |     const backLink = page.locator('.hiyaghar-back-link');
  110 |     await expect(backLink).toBeVisible();
  111 |   });
  112 | 
  113 |   // 2. Admin Dashboard & Sidebar Navigation
  114 |   test('2. Admin Dashboard: sidebar navigation renders all authorized modules', async ({ page }) => {
  115 |     await loginAsAdmin(page, '/admin/dashboard');
  116 | 
  117 |     // Verify Admin Layout exists
  118 |     const adminSidebar = page.locator('.hiyaghar-admin-sidebar');
  119 |     await expect(adminSidebar).toBeVisible();
  120 | 
  121 |     // Verify Brand Logo in Admin Layout
  122 |     const brandLogo = page.locator('.hiyaghar-topbar-brand');
  123 |     await expect(brandLogo).toBeVisible();
  124 | 
  125 |     // Verify key nav items exist in the sidebar
  126 |     const navLinks = page.locator('.hiyaghar-nav-link');
  127 |     const navCount = await navLinks.count();
> 128 |     expect(navCount).toBeGreaterThanOrEqual(5);
      |                      ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  129 | 
  130 |     // Verify Header bar with User Profile information
  131 |     const userBadge = page.locator('.hiyaghar-user-badge');
  132 |     await expect(userBadge).toBeVisible();
  133 |   });
  134 | 
  135 |   // 3. Products Management Page
  136 |   test('3. Products Management: renders table headers, search input, and add button', async ({ page }) => {
  137 |     await loginAsAdmin(page, '/admin/products');
  138 | 
  139 |     // Check main layout container
  140 |     const content = page.locator('.hiyaghar-admin-content');
  141 |     await expect(content).toBeVisible();
  142 | 
  143 |     // Check search / filter bar if present
  144 |     const searchBar = page.locator('input[placeholder*="Search"], input[type="text"]').first();
  145 |     if (await searchBar.isVisible()) {
  146 |       await searchBar.fill('Mukhwas');
  147 |       await page.waitForTimeout(200);
  148 |       expect(await searchBar.inputValue()).toBe('Mukhwas');
  149 |     }
  150 |   });
  151 | 
  152 |   // 4. Categories Management Page
  153 |   test('4. Categories Management: navigation and UI components load smoothly', async ({ page }) => {
  154 |     await loginAsAdmin(page, '/admin/categories');
  155 | 
  156 |     const mainContainer = page.locator('.hiyaghar-admin-content');
  157 |     await expect(mainContainer).toBeVisible();
  158 |   });
  159 | 
  160 |   // 5. Orders Management Page
  161 |   test('5. Orders Management: checks order list screen and data tables', async ({ page }) => {
  162 |     await loginAsAdmin(page, '/admin/orders');
  163 | 
  164 |     const orderContainer = page.locator('.hiyaghar-admin-content');
  165 |     await expect(orderContainer).toBeVisible();
  166 |   });
  167 | 
  168 |   // 6. Coupons & Discounts Management
  169 |   test('6. Coupons Management: checks coupon codes master view', async ({ page }) => {
  170 |     await loginAsAdmin(page, '/admin/coupons');
  171 | 
  172 |     const couponContainer = page.locator('.hiyaghar-admin-content');
  173 |     await expect(couponContainer).toBeVisible();
  174 |   });
  175 | 
  176 |   // 7. Stock & Inventory Management
  177 |   test('7. Stock Management: inventory ledger & modules load without crash', async ({ page }) => {
  178 |     await loginAsAdmin(page, '/admin/stock');
  179 | 
  180 |     const stockContainer = page.locator('.hiyaghar-admin-content');
  181 |     await expect(stockContainer).toBeVisible();
  182 |   });
  183 | 
  184 |   // 8. Security & Role Management (Permission Guard)
  185 |   test('8. Roles & Permission Security: loads role management safely', async ({ page }) => {
  186 |     await loginAsAdmin(page, '/admin/roles');
  187 | 
  188 |     const roleContainer = page.locator('.hiyaghar-admin-content');
  189 |     await expect(roleContainer).toBeVisible();
  190 |   });
  191 | 
  192 |   // 9. Unauthorized Route Protection (Access Denied / Redirect to Login)
  193 |   test('9. Security Guard: unauthenticated guest is blocked and redirected to login', async ({ page }) => {
  194 |     // Clear storage completely
  195 |     await page.goto('/admin/login');
  196 |     await page.evaluate(() => {
  197 |       localStorage.clear();
  198 |     });
  199 | 
  200 |     // Attempt direct navigation to protected dashboard
  201 |     await page.goto('/admin/dashboard');
  202 |     await page.waitForTimeout(300);
  203 | 
  204 |     // Verify rendered login screen
  205 |     const loginCard = page.locator('.hiyaghar-admin-login-card');
  206 |     await expect(loginCard).toBeVisible();
  207 |   });
  208 | 
  209 |   // 10. Admin Logout & Session Cleanup
  210 |   test('10. Admin Logout: clears credentials and returns to login', async ({ page }) => {
  211 |     await loginAsAdmin(page, '/admin/dashboard');
  212 | 
  213 |     // Find and click the Logout button in Admin header
  214 |     const logoutBtn = page.locator('.hiyaghar-admin-logout-btn');
  215 |     if (await logoutBtn.isVisible()) {
  216 |       await logoutBtn.click();
  217 |       await page.waitForTimeout(400);
  218 | 
  219 |       // Verify localStorage was cleared
  220 |       const token = await page.evaluate(() => localStorage.getItem('hiya_admin_jwt_token'));
  221 |       expect(token).toBeNull();
  222 |     }
  223 |   });
  224 | });
  225 | 
```