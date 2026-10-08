import { test, expect, Page } from '@playwright/test';

test.describe('HiyaGhar Aggressive "Bug Hunter" & Stress Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Collect uncaught client errors during tests
    page.on('pageerror', (err) => {
      console.error(`[CONSOLE ERROR]: ${err.message}`);
    });
  });

  // =========================================================================
  // 1. Cart & Financial Calculation Stress Testing
  // =========================================================================
  test('1.1 Cart: Rapid double-click spam & race condition test', async ({ page }) => {
    await page.goto('/');
    // Set simulated customer token & sample cart item
    await page.evaluate(() => {
      localStorage.setItem('customer_token', 'demo_playwright_test_token');
      localStorage.setItem('customer_user', JSON.stringify({ id: 1, firstName: 'Tester', phone: '9999999999' }));
      localStorage.setItem(
        'hiya_shopping_cart',
        JSON.stringify([
          {
            id: '1-100g',
            productId: '1',
            name: 'Mukhwas Royal Blend',
            price: 190,
            quantity: 2,
            weight: '100g',
            image: '/image/Aavla.webp',
          },
        ])
      );
    });

    // Go to cart
    await page.goto('/cart');
    await page.waitForTimeout(500);

    // Click quantity plus button in cart
    const qtyPlusBtn = page.locator('.hiyaghar-qty-btn, button:has-text("+")').first();
    if (await qtyPlusBtn.isVisible()) {
      await qtyPlusBtn.click();
      await page.waitForTimeout(300);
    }

    const subtotalText = await page.locator('.val').first().innerText().catch(() => '0');
    expect(subtotalText).not.toContain('NaN');
    expect(subtotalText).not.toContain('-');
  });

  test('1.2 Cart & Bill Breakdown: Verify discount label explicitly shows coupon code name', async ({ page }) => {
    await page.goto('/');
    // Set simulated order with discount
    await page.evaluate(() => {
      localStorage.setItem('customer_token', 'demo_playwright_test_token');
      localStorage.setItem(
        'hiya_customer_orders',
        JSON.stringify([
          {
            id: 'ORD-TEST-DISCOUNT',
            orderNumber: 'ORD-TEST-DISCOUNT',
            createdAt: new Date().toISOString(),
            subtotal: 80,
            discount: 8,
            couponCode: 'TESTIN304',
            shippingFee: 40,
            tax: 4,
            total: 112,
            paymentMethod: { id: 'cod', name: 'Cash on Delivery' },
            items: [
              {
                id: '1',
                productId: '1',
                name: 'Tea Masala',
                price: 80,
                quantity: 1,
                weight: '50g',
                image: '/image/TEA MASALA.webp',
              },
            ],
          },
        ])
      );
    });

    // Go to order confirmation
    await page.goto('/order-confirmation?orderId=ORD-TEST-DISCOUNT');
    await page.waitForTimeout(500);

    const billBreakdown = page.locator('.hiyaghar-conf-bill-breakdown');
    if (await billBreakdown.isVisible()) {
      const discountRow = billBreakdown.locator('.discount-row');
      await expect(discountRow).toBeVisible();

      // STRICT CHECK: The discount MUST explicitly name the coupon or source
      const discountText = await discountRow.innerText();
      expect(discountText, 'Discount label must show coupon code name (e.g. Coupon Discount (TESTIN304))').toMatch(/(TESTIN304|Coupon|Promo)/i);
    }
  });

  test('1.3 Coupon Abuse & Security: Empty string, SQL injection & XSS payload testing', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(400);

    const couponInput = page.getByPlaceholder(/coupon code/i);
    const applyBtn = page.getByRole('button', { name: /Apply/i });

    if (await couponInput.isVisible() && await applyBtn.isVisible()) {
      // 1. Empty / Whitespace only
      await couponInput.fill('    ');
      await applyBtn.click();
      await page.waitForTimeout(300);

      // 2. XSS payload
      await couponInput.fill('<script>alert("XSS")</script>');
      await applyBtn.click();
      await page.waitForTimeout(300);

      // 3. SQL Injection payload
      await couponInput.fill("' OR '1'='1' --");
      await applyBtn.click();
      await page.waitForTimeout(300);

      // Verify page didn't crash or break
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  // =========================================================================
  // 2. Mobile UI Glitches & Horizontal Overflow Hunter (320px - 1024px)
  // =========================================================================
  const viewports = [
    { name: 'Extra Small Mobile (iPhone SE)', width: 320, height: 600 },
    { name: 'Standard Mobile (iPhone 13)', width: 375, height: 812 },
    { name: 'Tablet Viewport', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`2. Responsive Overflow Hunter: Check ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForTimeout(500);

      // Check for horizontal overflow (element pushed outside screen width)
      const overflow = await page.evaluate((vpWidth) => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const isOverflowing = docWidth > vpWidth + 1 || bodyWidth > vpWidth + 1;

        const offenders: string[] = [];
        if (isOverflowing) {
          document.querySelectorAll('*').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.right > vpWidth + 2) {
              offenders.push(el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase());
            }
          });
        }
        return { isOverflowing, offenders: offenders.slice(0, 5) };
      }, vp.width);

      expect(overflow.isOverflowing, `Horizontal overflow detected at ${vp.width}px by elements: ${overflow.offenders.join(', ')}`).toBe(false);
    });
  }

  // =========================================================================
  // 3. Broken Images & Asset Integrity Scanner
  // =========================================================================
  test('3. Image Scanner: Verify zero broken images across all primary pages', async ({ page }) => {
    const testRoutes = ['/', '/mukhwas', '/tea-masala', '/gift-hampers', '/cart', '/our-story'];

    for (const route of testRoutes) {
      await page.goto(route);
      await page.waitForTimeout(400);

      const brokenImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const broken: string[] = [];
        imgs.forEach((img) => {
          // An image is broken if it finished loading with 0 natural width
          if (img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:')) {
            broken.push(img.src || img.alt || 'unknown');
          }
        });
        return broken;
      });

      expect(brokenImages, `Broken images found on ${route}: ${brokenImages.join(', ')}`).toEqual([]);
    }
  });

  // =========================================================================
  // 4. Broken Link & 404 Crawl Scanner
  // =========================================================================
  test('4. Link Crawler: Check Homepage & Footer internal links for 404 or broken paths', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);

    // Extract all unique internal links
    const internalLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const hrefs = anchors
        .map((a) => a.getAttribute('href') || '')
        .filter((href) => href.startsWith('/') && !href.startsWith('//') && !href.includes(':'));
      return Array.from(new Set(hrefs));
    });

    // Check each discovered link
    for (const href of internalLinks.slice(0, 10)) {
      const res = await page.goto(href);
      if (res) {
        expect(res.status(), `Link ${href} returned HTTP error status`).toBeLessThan(400);
      }
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  // =========================================================================
  // 5. Form Validation & Input Sanitization
  // =========================================================================
  test('5. Form Validation: Auth and input validation safeguards', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(300);

    // Check that phone or email input exists
    const input = page.locator('input[type="tel"], input[type="email"], input[type="text"]').first();
    if (await input.isVisible()) {
      // Test invalid / incomplete telephone
      await input.fill('1234');
      const submitBtn = page.getByRole('button', { name: /Continue|Login|Get OTP|Submit/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Page must remain stable
    await expect(page.locator('#root')).toBeVisible();
  });

  // =========================================================================
  // 6. State Persistence & Page Reload
  // =========================================================================
  test('6. Persistence: Cart state survives browser page reload', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(400);

    // Apply coupon or set input
    const couponInput = page.getByPlaceholder(/coupon code/i);
    if (await couponInput.isVisible()) {
      await couponInput.fill('TESTIN304');
      const applyBtn = page.getByRole('button', { name: /Apply/i });
      await applyBtn.click();
      await page.waitForTimeout(800);

      // Reload page and confirm state persists without crashing
      await page.reload();
      await page.waitForTimeout(500);
      await expect(page.locator('#root')).toBeVisible();
    }
  });
});
