const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security']
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  const results = [];

  // J1: Mobile drawer open & close
  try {
    await page.goto('https://localhost:59978/', { waitUntil: 'networkidle' });
    const hamburger = page.locator('.hiyaghar-mobile-hamburger-btn').first();
    const hasHam = await hamburger.isVisible().catch(() => false);
    let drawerOpened = false;
    let closedCleanly = false;
    if (hasHam) {
      await hamburger.click();
      await page.waitForTimeout(600);
      const drawer = page.locator('.hiyaghar-mobile-menu-drawer');
      drawerOpened = await drawer.isVisible().catch(() => false);
      
      const closeBtn = page.locator('.hiyaghar-mobile-menu-close-btn').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(400);
        closedCleanly = !(await drawer.isVisible().catch(() => false));
      }
    }
    results.push({ name: 'Mobile Drawer', hasHam, drawerOpened, closedCleanly });
  } catch (e) {
    results.push({ name: 'Mobile Drawer', error: e.message });
  }

  // J2: Mukhwas product listing & sorting
  try {
    await page.goto('https://localhost:59978/mukhwas', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const mukhwasCards = await page.locator('.hiyaghar-mukhwas-card').count();
    const sortSelect = page.locator('select.mukhwas-sort-select, select.hiyaghar-sort-select').first();
    const hasSort = await sortSelect.isVisible().catch(() => false);
    results.push({ name: 'Mukhwas Listing & Sort', count: mukhwasCards, hasSort });
  } catch (e) {
    results.push({ name: 'Mukhwas Listing & Sort', error: e.message });
  }

  // J3: Product detail, variant selection, quantity, add to cart
  try {
    await page.goto('https://localhost:59978/product/drakshawati', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const pills = await page.locator('.hiyaghar-attr-pill').count();
    const qtyBtns = await page.locator('.qty-btn').count();
    const addBtn = page.locator('.hiyaghar-detail-btn-cart').first();
    const hasAdd = await addBtn.isVisible().catch(() => false);
    if (hasAdd) {
      await addBtn.click();
      await page.waitForTimeout(1200);
    }
    const cartPill = page.locator('.hiyaghar-cart-cyan-pill, .hiyaghar-cart-pill-count').first();
    const cartPillText = await cartPill.innerText().catch(() => '');
    results.push({ name: 'Product Detail & Add to Cart', pills, qtyBtns, hasAdd, cartPillText: cartPillText.trim() });
  } catch (e) {
    results.push({ name: 'Product Detail & Add to Cart', error: e.message });
  }

  // J4: Cart Page
  try {
    await page.goto('https://localhost:59978/cart', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const cartItemsCount = await page.locator('.hiyaghar-cart-card').count();
    const checkoutBtn = page.locator('button.hiyaghar-cart-checkout-btn, button:has-text("Checkout"), a:has-text("Checkout")').first();
    const hasCheckoutBtn = await checkoutBtn.isVisible().catch(() => false);
    results.push({ name: 'Cart Page', cartItemsCount, hasCheckoutBtn });

    // J5: Proceed to Checkout Flow (Strictly halting before payment)
    if (hasCheckoutBtn) {
      await checkoutBtn.click();
      await page.waitForTimeout(1200);
      const currentUrl = page.url();
      const nameInput = page.locator('input[name="fullName"], input[placeholder*="Name" i]').first();
      const pincodeInput = page.locator('input[name="pincode"], input[placeholder*="Pincode" i]').first();
      const hasName = await nameInput.isVisible().catch(() => false);
      const hasPin = await pincodeInput.isVisible().catch(() => false);

      results.push({
        name: 'Checkout Flow (Halted at Payment Gate)',
        currentUrl,
        hasName,
        hasPin,
        safetyNote: 'Halted strictly before entering payment or placing order.'
      });
    }
  } catch (e) {
    results.push({ name: 'Cart & Checkout Flow', error: e.message });
  }

  // J6: Wishlist toggle
  try {
    await page.goto('https://localhost:59978/product/tea-masala', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const wishBtn = page.locator('.hiyaghar-detail-image-wishlist-btn').first();
    const hasWish = await wishBtn.isVisible().catch(() => false);
    if (hasWish) {
      await wishBtn.click();
      await page.waitForTimeout(600);
    }
    await page.goto('https://localhost:59978/wishlist', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const wishItems = await page.locator('.wishlist-item, .hiyaghar-mukhwas-card, .wishlist-card').count();
    results.push({ name: 'Wishlist', hasWish, wishItems });
  } catch (e) {
    results.push({ name: 'Wishlist', error: e.message });
  }

  // J7: FAQ accordion
  try {
    await page.goto('https://localhost:59978/faq', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const faqBtn = page.locator('.hiyaghar-faq-question').first();
    const hasFaq = await faqBtn.isVisible().catch(() => false);
    let faqExpanded = false;
    if (hasFaq) {
      await faqBtn.click();
      await page.waitForTimeout(400);
      faqExpanded = (await faqBtn.getAttribute('aria-expanded')) === 'true';
    }
    results.push({ name: 'FAQ Accordion', hasFaq, faqExpanded });
  } catch (e) {
    results.push({ name: 'FAQ Accordion', error: e.message });
  }

  // J8: 404 page
  try {
    await page.goto('https://localhost:59978/non-existent-page-test-404', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const notFoundHeading = await page.locator('h1, h2').first().innerText().catch(() => '');
    results.push({ name: '404 Page', notFoundHeading });
  } catch (e) {
    results.push({ name: '404 Page', error: e.message });
  }

  console.log('RESULTS_JSON_START');
  console.log(JSON.stringify(results, null, 2));
  console.log('RESULTS_JSON_END');

  await browser.close();
})();
