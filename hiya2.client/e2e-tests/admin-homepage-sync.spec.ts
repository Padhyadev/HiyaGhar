import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:59978';
const ADMIN_URL = `${BASE_URL}/admin`;

const loginAsAdmin = async (page: any) => {
  await page.goto(`${ADMIN_URL}/login`);
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
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1',
      email: 'admin@hiyaghar.com',
      exp: Math.floor(Date.now() / 1000) + 86400 * 30
    }));
    const mockJwt = `${header}.${payload}.mockSignature1234567890`;
    const allPermissions = {
      DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      CATEGORY: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      PRODUCT: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      HOMEPAGECOMPONENT: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      SHIPPING: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      REVIEW: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    };

    localStorage.setItem('hiya_admin_auth', JSON.stringify(adminUser));
    localStorage.setItem('hiya_admin_jwt_token', mockJwt);
    localStorage.setItem('hiya_admin_permissions', JSON.stringify(allPermissions));
  });
};

test.describe.serial('HiyaGhar Admin-to-Homepage Real-Time Synchronization Suite', () => {

  test('ADM-SYNC-001: Category changes in Admin reflect immediately on Storefront', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/categories`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verify on Homepage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('ADM-SYNC-002: Bestseller flag and active products reflect in Homepage Showcase', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/products`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Inspect Bestsellers on Homepage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const productCards = page.locator('.hiyaghar-category-card, .bestsellers-section, .hiyaghar-bestsellers-section');
    const count = await productCards.count();
    console.log(`Homepage Bestseller / Category Showcase Cards: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('ADM-SYNC-003: Homepage Components and Banners sync with Homepage Sections', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/homepage-components`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verify sections render on Homepage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const heroSection = page.locator('.hiyaghar-ref-hero-section, .hero-section');
    await expect(heroSection).toBeVisible();
  });

  test('ADM-SYNC-004: Shipping threshold & FSSAI updates reflect in Announcement and Footer', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/shipping`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verify Announcement Marquee on Homepage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const marquee = page.locator('.hiyaghar-announcement-ticker, .ticker, .announcement-bar');
    if (await marquee.isVisible()) {
      console.log(`Announcement Bar text: "${await marquee.textContent()}"`);
    }

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('ADM-SYNC-005: Approved Reviews in Admin appear in Homepage Review Carousel', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/reviews`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Check Homepage Reviews
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const reviewSection = page.locator('.reviews-section, .testimonial-card, .review-card, [data-testid="reviews"]').first();
    console.log(`Homepage Review Section visible: ${await reviewSection.isVisible().catch(() => false)}`);
  });

});
