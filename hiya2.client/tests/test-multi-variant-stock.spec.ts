import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:59978';

test.describe('Multi-Variant Stock Behavior Verification', () => {
  test.setTimeout(45000);

  test('Smart in-stock variant fallback on catalog card and PDP', async ({ page }) => {
    // Register test customer
    const randomNum = Math.floor(10000000 + Math.random() * 89999999);
    const testEmail = `tester${randomNum}@example.com`;
    const testPassword = 'Password@123';
    const testMobile = `98${Math.floor(10000000 + Math.random() * 89999999)}`;

    console.log(`Registering test user: ${testEmail}`);
    await page.goto(`${BASE_URL}/#login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.evaluate(async ({ email, password, mobileNo }) => {
      const res = await fetch('/api/customerauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'QA', lastName: 'Tester', email, mobileNo, password })
      });
      const data = await res.json();
      if (data.isSuccess && data.token) {
        localStorage.setItem('hiya_customer_jwt_token', data.token);
        localStorage.setItem('hiya_customer_auth', JSON.stringify({ ...data.customer, isLoggedIn: true }));
      }
    }, { email: testEmail, password: testPassword, mobileNo: testMobile });

    console.log('\n--- 1. Testing Category Listing Card (/#mukhwas) ---');
    await page.goto(`${BASE_URL}/#mukhwas`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const chocolateCard = page.locator('.hiyaghar-mukhwas-card').filter({ hasText: /chocolate/i }).first();
    const isVisible = await chocolateCard.isVisible();
    expect(isVisible).toBeTruthy();

    // Check that card does NOT show "Out of Stock" because 200g is available
    const outOfStockBadge = chocolateCard.locator('.badge-out-of-stock');
    expect(await outOfStockBadge.isVisible().catch(() => false)).toBeFalsy();

    // Check that active label on card is 200 g and price is 120
    const cardText = await chocolateCard.innerText();
    console.log('Chocolate Mukhwas card details on listing:');
    console.log(cardText);
    expect(cardText).toContain('200 g');
    expect(cardText.replace(/\s+/g, '')).toContain('120');

    // Add to cart from card
    const addBtn = chocolateCard.locator('.hiyaghar-btn-add-cart');
    expect(await addBtn.isDisabled()).toBeFalsy();
    await addBtn.click();
    await page.waitForTimeout(1500);

    const localCart = await page.evaluate(() => localStorage.getItem('hiya_shopping_cart') || '[]');
    console.log('Cart after adding 200g Chocolate Mukhwas:', localCart);
    expect(localCart).toContain('200 g');

    console.log('\n--- 2. Testing Product Detail Page (/product/8) ---');
    await page.goto(`${BASE_URL}/product/8`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Verify PDP initialized to 200g (in-stock)
    const pdpTitle = await page.locator('.hiyaghar-detail-title').innerText();
    console.log('PDP Title:', pdpTitle);
    expect(pdpTitle).toContain('Chocolate Mukhwas');

    const selectedWeightPill = page.locator('.hiyaghar-attr-pill.is-selected').filter({ hasText: /200/i });
    expect(await selectedWeightPill.isVisible()).toBeTruthy();

    const detailAddBtn = page.locator('.hiyaghar-detail-btn-cart');
    expect(await detailAddBtn.isDisabled()).toBeFalsy();
    console.log('PDP initial state: 200g selected, Add to Cart enabled');

    // Check 100g out-of-stock pill indicator
    const outOfStockPill100 = page.locator('.hiyaghar-attr-pill.is-pill-out-of-stock').filter({ hasText: /100/i }).first();
    expect(await outOfStockPill100.isVisible()).toBeTruthy();
    const outOfStockPillText = await outOfStockPill100.innerText();
    console.log('Out of stock pill text:', outOfStockPillText);
    expect(outOfStockPillText).toContain('Out of Stock');

    // Click 100g (out of stock)
    console.log('Clicking 100g out-of-stock pill...');
    await outOfStockPill100.click();
    await page.waitForTimeout(1000);

    // Verify Add to Cart is disabled and Out of Stock message is displayed
    const outOfStockNotice = page.getByText('Currently Out of Stock', { exact: true });
    expect(await outOfStockNotice.isVisible()).toBeTruthy();
    expect(await detailAddBtn.isDisabled()).toBeTruthy();
    const btnText100 = await detailAddBtn.innerText();
    console.log('Button state when 100g is selected:', btnText100, '(disabled:', await detailAddBtn.isDisabled(), ')');
    expect(btnText100).toContain('Out of Stock');

    // Click back to 200g (in stock)
    console.log('Clicking back to 200g in-stock pill...');
    await page.locator('.hiyaghar-attr-pill').filter({ hasText: /200/i }).click();
    await page.waitForTimeout(1000);

    expect(await detailAddBtn.isDisabled()).toBeFalsy();
    const btnText200 = await detailAddBtn.innerText();
    console.log('Button state when 200g is selected:', btnText200, '(disabled:', await detailAddBtn.isDisabled(), ')');
    expect(btnText200).toContain('Add to Cart');

    console.log('\n>>> All Multi-Variant In-Stock Fallback Tests Passed! <<<');
  });
});
