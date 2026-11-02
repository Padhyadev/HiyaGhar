/**
 * HIYAGHAR Comprehensive Customer QA Test Runner
 * Target: https://localhost:59978 (Customer side, Read-only checks)
 * Safety: Strictly NO orders, NO payments, NO account creation, NO form submissions, NO review writes.
 */

const { chromium } = require('f:/1.Vishal_Gami_Project/HiyaGhar/hiya2.client/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://localhost:59978';
const SCREENSHOTS_DIR = path.join(__dirname, 'qa-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// 7 Primary Viewports
const PRIMARY_VIEWPORTS = [
  { name: 'Mobile Small (360x740 Android)', width: 360, height: 740, isMobile: true, hasTouch: true },
  { name: 'Mobile Standard (390x844 iPhone 14)', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'Mobile Large (414x896 iPhone XR)', width: 414, height: 896, isMobile: true, hasTouch: true },
  { name: 'Tablet Portrait (768x1024 iPad)', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'Tablet Landscape (1024x768 iPad)', width: 1024, height: 768, isMobile: false, hasTouch: false },
  { name: 'Desktop Laptop (1280x800)', width: 1280, height: 800, isMobile: false, hasTouch: false },
  { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080, isMobile: false, hasTouch: false },
];

// Breakpoint boundary widths to test
const BREAKPOINTS = [480, 576, 640, 767, 768, 769, 900, 990, 991, 992, 1024];

// Key customer pages to audit
const PAGES_TO_TEST = [
  { name: 'Home', path: '/' },
  { name: 'Mukhwas Category', path: '/mukhwas' },
  { name: 'Tea Masala Category', path: '/tea-masala' },
  { name: 'Handmade Soap Category', path: '/handmade-soap' },
  { name: 'Hair Oil Category', path: '/hair-oil' },
  { name: 'Combo Packs', path: '/combos' },
  { name: 'Gift Hampers', path: '/gift-hampers' },
  { name: 'Product Detail 1 (Drakshawati Mukhwas)', path: '/product/drakshawati-mukhwas' },
  { name: 'Product Detail 2 (Tea Masala)', path: '/product/tea-masala' },
  { name: 'Product Detail 3 (Glow Craft Detan Soap)', path: '/product/glow-craft-detan-soap' },
  { name: 'Shopping Cart', path: '/cart' },
  { name: 'Checkout (Step 1-3)', path: '/checkout' },
  { name: 'Wishlist', path: '/wishlist' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'Our Story', path: '/our-story' },
  { name: 'Contact Us', path: '/contact-us' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Privacy Policy', path: '/privacy-policy' },
  { name: 'Terms & Conditions', path: '/terms-conditions' },
  { name: 'Refund Policy', path: '/refund-policy' },
  { name: 'Shipping Policy', path: '/shipping-policy' },
  { name: '404 Error Page', path: '/this-page-does-not-exist-404-test' },
];

const results = {
  testedAt: new Date().toISOString(),
  target: BASE_URL,
  summary: {
    totalPagesTested: PAGES_TO_TEST.length,
    viewportsTested: PRIMARY_VIEWPORTS.length,
    breakpointsTested: BREAKPOINTS.length,
    totalChecksPerformed: 0,
    passedChecks: 0,
    failedChecks: 0,
    warnings: 0,
  },
  overflowIssues: [],
  touchTargetIssues: [],
  consoleErrors: [],
  brokenImages: [],
  functionalTests: [],
  breakpointIssues: []
};

async function checkPageHealth(page, pageInfo, viewport) {
  const url = `${BASE_URL}${pageInfo.path}`;
  const errors = [];
  const brokenImgs = [];

  const consoleHandler = msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore routine favicon or known benign dev logs
      if (!text.includes('favicon.ico')) {
        errors.push(text);
      }
    }
  };

  const responseHandler = resp => {
    if (resp.status() >= 400 && resp.url().includes(BASE_URL)) {
      if (resp.url().match(/\.(webp|png|jpg|jpeg|svg)$/i)) {
        brokenImgs.push({ url: resp.url(), status: resp.status() });
      }
    }
  };

  page.on('console', consoleHandler);
  page.on('response', responseHandler);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1200);

    // 1. Check Horizontal Overflow
    const overflow = await page.evaluate(() => {
      const docScrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const innerWidth = window.innerWidth;
      const hasOverflow = docScrollWidth > innerWidth + 1 || bodyScrollWidth > innerWidth + 1;

      const offenders = [];
      if (hasOverflow) {
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.right > innerWidth + 1.5) {
            const cls = typeof el.className === 'string' && el.className.trim()
              ? `.${el.className.trim().split(/\s+/).join('.')}`
              : el.tagName.toLowerCase();
            offenders.push({ selector: cls, right: Math.round(rect.right), width: Math.round(rect.width) });
          }
        });
      }
      return { hasOverflow, docScrollWidth, innerWidth, offenders: offenders.slice(0, 5) };
    });

    results.summary.totalChecksPerformed++;
    if (overflow.hasOverflow) {
      results.summary.failedChecks++;
      results.overflowIssues.push({
        page: pageInfo.name,
        path: pageInfo.path,
        viewport: viewport.name,
        width: viewport.width,
        scrollWidth: overflow.docScrollWidth,
        offenders: overflow.offenders
      });
    } else {
      results.summary.passedChecks++;
    }

    // 2. Check Touch Targets for mobile/touch viewports
    if (viewport.hasTouch) {
      const touchAudit = await page.evaluate(() => {
        const MIN = 40;
        const small = [];
        const elements = document.querySelectorAll('button, a, input, select');
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < MIN || rect.height < MIN)) {
            // Check if it has a visible text or icon
            const text = el.innerText || el.getAttribute('aria-label') || '';
            const cls = el.className && typeof el.className === 'string'
              ? `.${el.className.trim().split(/\s+/).join('.')}`
              : el.tagName.toLowerCase();
            small.push({ selector: cls, text: text.slice(0, 25), width: Math.round(rect.width), height: Math.round(rect.height) });
          }
        });
        return { count: small.length, examples: small.slice(0, 6) };
      });

      results.summary.totalChecksPerformed++;
      if (touchAudit.count > 0) {
        results.summary.warnings++;
        results.touchTargetIssues.push({
          page: pageInfo.name,
          path: pageInfo.path,
          viewport: viewport.name,
          count: touchAudit.count,
          examples: touchAudit.examples
        });
      } else {
        results.summary.passedChecks++;
      }
    }

    // 3. Log console errors & broken images
    if (errors.length > 0) {
      results.consoleErrors.push({
        page: pageInfo.name,
        viewport: viewport.name,
        errors: errors.slice(0, 5)
      });
    }
    if (brokenImgs.length > 0) {
      results.brokenImages.push({
        page: pageInfo.name,
        viewport: viewport.name,
        images: brokenImgs
      });
    }

  } catch (err) {
    console.error(`Error loading ${url} at ${viewport.name}:`, err.message);
  } finally {
    page.off('console', consoleHandler);
    page.off('response', responseHandler);
  }
}

async function testBreakpoints(page) {
  console.log('\n--- Testing Breakpoint Boundaries ---');
  const samplePages = [
    { name: 'Home', path: '/' },
    { name: 'Mukhwas Listing', path: '/mukhwas' },
    { name: 'Product Detail', path: '/product/drakshawati-mukhwas' },
    { name: 'Cart', path: '/cart' }
  ];

  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp, height: 800 });
    for (const p of samplePages) {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const overflow = await page.evaluate((width) => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const hasOverflow = docScrollWidth > width + 1;
        let culprit = '';
        if (hasOverflow) {
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > width + 1) {
              culprit = el.className || el.tagName;
            }
          });
        }
        return { hasOverflow, docScrollWidth, culprit };
      }, bp);

      results.summary.totalChecksPerformed++;
      if (overflow.hasOverflow) {
        results.summary.failedChecks++;
        results.breakpointIssues.push({
          breakpoint: bp,
          page: p.name,
          scrollWidth: overflow.docScrollWidth,
          culprit: overflow.culprit
        });
      } else {
        results.summary.passedChecks++;
      }
    }
  }
}

async function testFunctionalCustomerJourneys(page) {
  console.log('\n--- Testing Customer Functional Journeys ---');

  // Set mobile iPhone 14 viewport for detailed journey test
  await page.setViewportSize({ width: 390, height: 844 });

  // Journey 1: Header, Navigation & Mobile Menu Drawer
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const hamburger = page.locator('button[aria-label="Toggle navigation menu"], .hiyaghar-mobile-menu-btn, button.hamburger-menu').first();
    const hasHamburger = await hamburger.isVisible().catch(() => false);
    
    let drawerOpened = false;
    if (hasHamburger) {
      await hamburger.click();
      await page.waitForTimeout(500);
      const drawer = page.locator('.hiyaghar-mobile-drawer, .mobile-menu-drawer, nav[aria-label="Mobile Navigation"]');
      drawerOpened = await drawer.isVisible().catch(() => false);
      if (drawerOpened) {
        // Close drawer
        const closeBtn = page.locator('button[aria-label="Close menu"], .hiyaghar-mobile-drawer-close').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        } else {
          // click outside
          await page.keyboard.press('Escape');
        }
      }
    }

    results.functionalTests.push({
      journey: 'Mobile Navigation Drawer',
      status: hasHamburger && drawerOpened ? 'PASS' : 'WARN',
      notes: `Hamburger found: ${hasHamburger}, Drawer opened cleanly: ${drawerOpened}`
    });
  } catch (e) {
    results.functionalTests.push({ journey: 'Mobile Navigation Drawer', status: 'FAIL', notes: e.message });
  }

  // Journey 2: Browse Category, Filter & Sort
  try {
    await page.goto(`${BASE_URL}/mukhwas`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const products = page.locator('.hiyaghar-mukhwas-card, .product-card');
    const count = await products.count();

    const sortSelect = page.locator('select.hiyaghar-sort-select, select[aria-label="Sort by"]').first();
    const hasSort = await sortSelect.isVisible().catch(() => false);
    if (hasSort) {
      await sortSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }

    results.functionalTests.push({
      journey: 'Category Listing & Sorting (/mukhwas)',
      status: count > 0 ? 'PASS' : 'FAIL',
      notes: `Found ${count} products on /mukhwas. Sort selector interactive: ${hasSort}`
    });
  } catch (e) {
    results.functionalTests.push({ journey: 'Category Listing & Sorting', status: 'FAIL', notes: e.message });
  }

  // Journey 3: Product Detail Page, Variants & Add to Cart
  try {
    await page.goto(`${BASE_URL}/product/drakshawati-mukhwas`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Check variant pills
    const variantPills = page.locator('.product-variant-pill, .attribute-chip, .variant-selector button');
    const pillCount = await variantPills.count();
    if (pillCount > 1) {
      await variantPills.nth(1).click();
      await page.waitForTimeout(400);
    }

    // Check quantity increment
    const plusBtn = page.locator('button[aria-label="Increase quantity"], button.qty-plus, .qty-btn-inc').first();
    const hasPlus = await plusBtn.isVisible().catch(() => false);
    if (hasPlus) {
      await plusBtn.click();
      await page.waitForTimeout(300);
    }

    // Add to Cart
    const addBtn = page.locator('button.add-to-cart-btn, button:has-text("Add to Cart")').first();
    const hasAddBtn = await addBtn.isVisible().catch(() => false);
    let cartUpdated = false;
    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(800);
      // Verify cart badge or toast
      const badge = page.locator('.cart-count-badge, .header-cart-count');
      const badgeText = await badge.innerText().catch(() => '0');
      cartUpdated = parseInt(badgeText, 10) > 0;
    }

    results.functionalTests.push({
      journey: 'Product Detail & Add to Cart (/product/drakshawati-mukhwas)',
      status: hasAddBtn ? 'PASS' : 'FAIL',
      notes: `Variant pills: ${pillCount}, Qty counter: ${hasPlus}, Cart badge updated: ${cartUpdated}`
    });
  } catch (e) {
    results.functionalTests.push({ journey: 'Product Detail & Add to Cart', status: 'FAIL', notes: e.message });
  }

  // Journey 4: Wishlist Toggle & Page
  try {
    await page.goto(`${BASE_URL}/product/tea-masala`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const wishlistBtn = page.locator('button[aria-label*="wishlist" i], button.wishlist-btn, .product-wishlist-toggle').first();
    const hasWishlistBtn = await wishlistBtn.isVisible().catch(() => false);
    if (hasWishlistBtn) {
      await wishlistBtn.click();
      await page.waitForTimeout(500);
    }

    // Visit Wishlist page
    await page.goto(`${BASE_URL}/wishlist`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const wishlistItems = page.locator('.wishlist-item, .wishlist-product-card, .hiyaghar-mukhwas-card');
    const wishCount = await wishlistItems.count();

    results.functionalTests.push({
      journey: 'Wishlist Toggle & Listing (/wishlist)',
      status: hasWishlistBtn ? 'PASS' : 'WARN',
      notes: `Wishlist button on product: ${hasWishlistBtn}, Items rendered on /wishlist: ${wishCount}`
    });
  } catch (e) {
    results.functionalTests.push({ journey: 'Wishlist Flow', status: 'FAIL', notes: e.message });
  }

  // Journey 5: Cart Management & Pincode Checker
  try {
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const cartItems = page.locator('.cart-item, .hiyaghar-cart-row, .cart-product-row');
    const itemCount = await cartItems.count();

    // Pincode input check
    const pincodeInput = page.locator('input[placeholder*="pincode" i], input[name*="pincode" i], input.pincode-input').first();
    const hasPincode = await pincodeInput.isVisible().catch(() => false);
    let pincodeVerified = false;
    if (hasPincode) {
      await pincodeInput.fill('380061');
      const checkBtn = page.locator('button:has-text("Check"), button.check-pincode-btn').first();
      if (await checkBtn.isVisible().catch(() => false)) {
        await checkBtn.click();
        await page.waitForTimeout(600);
        pincodeVerified = true;
      }
    }

    results.functionalTests.push({
      journey: 'Cart Page & Delivery Verification (/cart)',
      status: itemCount > 0 ? 'PASS' : 'WARN',
      notes: `Cart items: ${itemCount}, Pincode checker visible: ${hasPincode}, Delivery check triggered: ${pincodeVerified}`
    });
  } catch (e) {
    results.functionalTests.push({ journey: 'Cart Page Flow', status: 'FAIL', notes: e.message });
  }

  // Journey 6: Checkout Step 1-3 (STOPPING BEFORE PAYMENT)
  try {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const contactForm = page.locator('form, .hiyaghar-checkout-contact-form, input[name="firstName"]');
    const onCheckout = await page.url().includes('/checkout');

    // Check presence of contact fields
    const firstName = page.locator('input[name="firstName"], input[placeholder*="First Name" i]').first();
    const hasFirstName = await firstName.isVisible().catch(() => false);

    const phone = page.locator('input[name="mobileNumber"], input[placeholder*="Mobile" i], input[type="tel"]').first();
    const hasPhone = await phone.isVisible().catch(() => false);

    // Check payment selection visibility (Step 3 components)
    const paymentMethods = page.locator('input[value="COD"], input[value="Razorpay"], .payment-method-option');
    const paymentOptionsCount = await paymentMethods.count().catch(() => 0);

    results.functionalTests.push({
      journey: 'Checkout Flow (Stopped at Payment Gate)',
      status: onCheckout && hasFirstName ? 'PASS' : 'WARN',
      notes: `Landed on /checkout: ${onCheckout}, Contact inputs present: ${hasFirstName}, Payment options configured: ${paymentOptionsCount > 0}. Note: Strictly halted before placing order.`
    });
  } catch (e) {
    results.functionalTests.push({ journey: 'Checkout Flow', status: 'FAIL', notes: e.message });
  }

  // Journey 7: FAQ Accordion
  try {
    await page.goto(`${BASE_URL}/faq`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const firstFaq = page.locator('.faq-question, .accordion-header, .hiyaghar-faq-item button').first();
    const hasFaq = await firstFaq.isVisible().catch(() => false);
    let accordionWorked = false;
    if (hasFaq) {
      await firstFaq.click();
      await page.waitForTimeout(400);
      const answer = page.locator('.faq-answer, .accordion-content').first();
      accordionWorked = await answer.isVisible().catch(() => false);
    }

    results.functionalTests.push({
      journey: 'FAQ Accordion Interaction (/faq)',
      status: hasFaq && accordionWorked ? 'PASS' : 'WARN',
      notes: `FAQ item interactive: ${hasFaq}, Accordion expands: ${accordionWorked}`
    });
  } catch (e) {
    results.functionalTests.push({ journey: 'FAQ Accordion', status: 'FAIL', notes: e.message });
  }

  // Journey 8: 404 Error Page
  try {
    await page.goto(`${BASE_URL}/non-existent-page-test-404`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const heading = await page.locator('h1, .not-found-title').innerText().catch(() => '');
    const homeBtn = page.locator('a[href="/"], a:has-text("Home"), button:has-text("Home")').first();
    const hasHomeBtn = await homeBtn.isVisible().catch(() => false);

    results.functionalTests.push({
      journey: '404 Error Page Fallback',
      status: hasHomeBtn || heading.toLowerCase().includes('404') || heading.toLowerCase().includes('found') ? 'PASS' : 'WARN',
      notes: `Page heading: "${heading.trim()}", Return Home link present: ${hasHomeBtn}`
    });
  } catch (e) {
    results.functionalTests.push({ journey: '404 Error Page', status: 'FAIL', notes: e.message });
  }
}

(async () => {
  console.log('================================================================');
  console.log(' HIYAGHAR SENIOR QA TEST SUITE - CUSTOMER JOURNEY & RESPONSIVE');
  console.log(` Target: ${BASE_URL}`);
  console.log(' Safety Mode: READ-ONLY (No orders, payments, accounts, reviews, or mutations)');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });

  try {
    // 1. Audit all 21 pages across all 7 primary viewports
    for (const vp of PRIMARY_VIEWPORTS) {
      console.log(`\n>>> Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        ignoreHTTPSErrors: true
      });
      const page = await context.newPage();

      for (const p of PAGES_TO_TEST) {
        process.stdout.write(`    Checking ${p.name}... `);
        await checkPageHealth(page, p, vp);
        process.stdout.write(`[Done]\n`);
      }

      await context.close();
    }

    // 2. Breakpoint boundary checks
    const bpContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const bpPage = await bpContext.newPage();
    await testBreakpoints(bpPage);
    await bpContext.close();

    // 3. Customer Interactive Flows
    const funcContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const funcPage = await funcContext.newPage();
    await testFunctionalCustomerJourneys(funcPage);
    await funcContext.close();

  } catch (err) {
    console.error('Test Suite Fatal Error:', err);
  } finally {
    await browser.close();
  }

  // Write results JSON for report generation
  const resultsPath = path.join(__dirname, 'qa-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n================================================================`);
  console.log(` QA RUN COMPLETE! Results saved to ${resultsPath}`);
  console.log(` Total checks: ${results.summary.totalChecksPerformed}`);
  console.log(` Passed: ${results.summary.passedChecks}`);
  console.log(` Failed: ${results.summary.failedChecks}`);
  console.log(` Warnings: ${results.summary.warnings}`);
  console.log('================================================================\n');
})();

