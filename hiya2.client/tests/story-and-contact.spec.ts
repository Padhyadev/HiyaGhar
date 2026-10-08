import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:59978';

test.describe('Our Story & Contact Us Pages Verification', () => {
  test.beforeEach(async ({ context }) => {
    // Ignore SSL certificate errors for local dev certs
  });

  test('Our Story Page Verification', async ({ page }) => {
    console.log('\n=============================================');
    console.log('Testing: Our Story Page');
    console.log('=============================================');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
    });

    // 1. Navigate to Our Story
    await page.goto(`${BASE_URL}/our-story`, { waitUntil: 'networkidle' });

    // 2. Title & Meta verification
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    expect(title).toContain('Our Story');

    // 3. Hero section checks
    const heroTitle = page.locator('.hiyaghar-story-hero-title');
    await expect(heroTitle).toBeVisible();
    const heroTitleText = await heroTitle.textContent();
    console.log(`Hero Title: "${heroTitleText}"`);
    expect(heroTitleText).toContain('Every Goodness Has A Heartfelt Story');

    const eyebrow = page.locator('.hiyaghar-story-hero-eyebrow');
    await expect(eyebrow).toBeVisible();
    console.log(`Hero Eyebrow: "${await eyebrow.textContent()}"`);

    // 4. Breadcrumb navigation
    const breadcrumb = page.locator('.hiyaghar-story-banner-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('.current')).toHaveText('Our Story');

    // 5. Stats container
    const statsContainer = page.locator('.hiyaghar-story-stats-container');
    await expect(statsContainer).toBeVisible();
    const statItems = page.locator('.hiyaghar-story-stat-item');
    const statCount = await statItems.count();
    console.log(`Stats items count: ${statCount}`);
    expect(statCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < statCount; i++) {
      const num = await statItems.nth(i).locator('.hiyaghar-story-stat-num').textContent();
      const label = await statItems.nth(i).locator('.hiyaghar-story-stat-label').textContent();
      console.log(`  Stat [${i + 1}]: ${num} - ${label}`);
    }

    // 6. Story blocks & content
    const storyBlocks = page.locator('.hiyaghar-story-block');
    const blockCount = await storyBlocks.count();
    console.log(`Story content blocks count: ${blockCount}`);
    expect(blockCount).toBeGreaterThanOrEqual(1);

    // 7. Check images loading
    const images = page.locator('.hiyaghar-story-main img');
    const imgCount = await images.count();
    console.log(`Story images count: ${imgCount}`);
    for (let i = 0; i < imgCount; i++) {
      const src = await images.nth(i).getAttribute('src');
      const isVisible = await images.nth(i).isVisible();
      console.log(`  Image [${i + 1}]: src="${src}", visible=${isVisible}`);
    }

    // 8. Screenshot Our Story desktop
    await page.screenshot({ path: 'screenshots/our-story-desktop.png', fullPage: true });
    console.log('Saved screenshot: screenshots/our-story-desktop.png');

    console.log(`Console Errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
    console.log(`Failed Requests count: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests);
    }
  });

  test('Contact Us Page Verification & Form Interaction', async ({ page }) => {
    console.log('\n=============================================');
    console.log('Testing: Contact Us Page');
    console.log('=============================================');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
    });

    // 1. Navigate to Contact Us
    await page.goto(`${BASE_URL}/contact-us`, { waitUntil: 'networkidle' });

    // 2. Title & Meta verification
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    expect(title).toContain('Contact Us');

    // 3. Hero section checks
    const heroTitle = page.locator('.hiyaghar-contact-hero-title');
    await expect(heroTitle).toBeVisible();
    const heroTitleText = await heroTitle.textContent();
    console.log(`Hero Title: "${heroTitleText}"`);
    expect(heroTitleText).toContain('We’d Love To Hear From You');

    const breadcrumb = page.locator('.hiyaghar-contact-banner-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('.current')).toHaveText('Contact Us');

    // 4. Contact info card verification
    const infoCard = page.locator('.hiyaghar-contact-info-card');
    await expect(infoCard).toBeVisible();
    console.log('Contact info card is visible');

    // 5. Contact Form Elements
    const form = page.locator('.hiyaghar-contact-form');
    await expect(form).toBeVisible();

    const nameInput = page.locator('input[name="fullName"]');
    const emailInput = page.locator('input[name="email"]');
    const phoneInput = page.locator('input[name="phone"]');
    const subjectSelect = page.locator('select[name="subject"]');
    const messageInput = page.locator('textarea[name="message"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(subjectSelect).toBeVisible();
    await expect(messageInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // 6. Test phone number input sanitizer (letters should be filtered out)
    await phoneInput.fill('abc9876543210xyz');
    const sanitizedPhone = await phoneInput.inputValue();
    console.log(`Phone input sanitization test: entered "abc9876543210xyz" -> result "${sanitizedPhone}"`);
    expect(sanitizedPhone).toBe('9876543210');

    // 7. Form submission test
    await nameInput.fill('Playwright Test User');
    await emailInput.fill('playwright.test@example.com');
    await phoneInput.fill('+919876543210');
    await subjectSelect.selectOption('Feedback / Suggestion');
    await messageInput.fill('This is an automated test inquiry submitted through Playwright verification.');

    // Submit form and intercept API response
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/ContactQuery') || res.url().includes('/api/contactquery'), { timeout: 10000 }).catch(() => null),
      submitBtn.click(),
    ]);

    if (response) {
      console.log(`Contact Query API response status: ${response.status()}`);
      try {
        const body = await response.json();
        console.log(`Response body:`, JSON.stringify(body));
      } catch {
        console.log(`Response text:`, await response.text());
      }
    } else {
      console.log('No API response captured within timeout or mock response was used.');
    }

    await page.waitForTimeout(1500);

    // 8. Screenshot Contact Us desktop
    await page.screenshot({ path: 'screenshots/contact-us-desktop.png', fullPage: true });
    console.log('Saved screenshot: screenshots/contact-us-desktop.png');

    console.log(`Console Errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
  });

  test('Responsive Viewport Check: Mobile view (390x844)', async ({ page }) => {
    console.log('\n=============================================');
    console.log('Testing: Mobile Responsiveness for Our Story & Contact Us');
    console.log('=============================================');

    await page.setViewportSize({ width: 390, height: 844 });

    // Our Story Mobile
    await page.goto(`${BASE_URL}/our-story`, { waitUntil: 'networkidle' });
    await expect(page.locator('.hiyaghar-story-hero-title')).toBeVisible();
    await page.screenshot({ path: 'screenshots/our-story-mobile.png', fullPage: true });
    console.log('Saved screenshot: screenshots/our-story-mobile.png');

    // Contact Us Mobile
    await page.goto(`${BASE_URL}/contact-us`, { waitUntil: 'networkidle' });
    await expect(page.locator('.hiyaghar-contact-hero-title')).toBeVisible();
    await page.screenshot({ path: 'screenshots/contact-us-mobile.png', fullPage: true });
    console.log('Saved screenshot: screenshots/contact-us-mobile.png');
  });
});
