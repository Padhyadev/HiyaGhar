import { test, chromium, devices, Page } from '@playwright/test';

// This spec is meant to be watched live, not run headlessly in CI:
// it opens a real, visible Chromium window emulating an iPhone 13, walks
// through the site's key pages with pauses in between, and then stays open
// indefinitely so a human can keep poking at it. Disable the default
// per-test timeout since "stay open until told to close" is the point.
test.setTimeout(0);

const BASE_URL = 'https://localhost:59978';

const ROUTES: { name: string; path: string }[] = [
  { name: 'Home', path: '/#/' },
  { name: 'Mukhwas (category)', path: '/#mukhwas' },
  { name: 'Tea Masala (category)', path: '/#tea-masala' },
  { name: 'Handmade Soap (category)', path: '/#handmade-soap' },
  { name: 'Hair Oil (category)', path: '/#hair-oil' },
  { name: 'Gift Hampers', path: '/#gift-hampers' },
  { name: 'Product Detail', path: '/#product/1' },
  { name: 'Cart', path: '/#cart' },
  { name: 'Wishlist', path: '/#wishlist' },
  { name: 'Track Order', path: '/#track-order' },
  { name: 'Login / Auth', path: '/#login' },
];

// Detects elements that push past the viewport's right edge — the classic
// mobile "horizontal scrollbar" bug.
async function checkHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const docScrollWidth = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;
    const hasOverflow = docScrollWidth > innerWidth + 1;

    const offenders: Array<{ selector: string; right: number; width: number }> = [];
    if (hasOverflow) {
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > innerWidth + 1.5) {
          const cls = typeof el.className === 'string' && el.className.trim()
            ? `.${el.className.trim().split(/\s+/).join('.')}`
            : el.tagName.toLowerCase();
          offenders.push({ selector: cls, right: rect.right, width: rect.width });
        }
      });
    }

    return { hasOverflow, docScrollWidth, innerWidth, offenders: offenders.slice(0, 8) };
  });
}

// Flags interactive elements smaller than the ~40px minimum comfortable
// touch-target size (Apple HIG / Material both recommend ~44px).
async function checkTapTargets(page: Page) {
  return page.evaluate(() => {
    const MIN = 40;
    const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
    const small: Array<{ selector: string; width: number; height: number }> = [];

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // hidden/collapsed, not a real target
      if (rect.width < MIN || rect.height < MIN) {
        const cls = typeof (el as HTMLElement).className === 'string' && (el as HTMLElement).className.trim()
          ? `.${(el as HTMLElement).className.trim().split(/\s+/).join('.')}`
          : el.tagName.toLowerCase();
        small.push({ selector: cls, width: rect.width, height: rect.height });
      }
    });

    return { count: small.length, examples: small.slice(0, 6) };
  });
}

test('Live mobile walkthrough — iPhone 13', async () => {
  const iphone13 = devices['iPhone 13'];

  console.log('\n================================================================');
  console.log(' MOBILE RESPONSIVENESS — LIVE WALKTHROUGH');
  console.log(` Device: iPhone 13  (${iphone13.viewport.width}x${iphone13.viewport.height}, touch enabled)`);
  console.log(` Dev server: ${BASE_URL}`);
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ ...iphone13, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  console.log('BROWSER WINDOW IS NOW OPEN\n');

  for (const route of ROUTES) {
    console.log(`\n>>> NOW SHOWING: ${route.name}   (${BASE_URL}${route.path})`);
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const overflow = await checkHorizontalOverflow(page);
    if (overflow.hasOverflow) {
      console.log(`    [OVERFLOW] scrollWidth=${overflow.docScrollWidth} > viewport=${overflow.innerWidth}`);
      overflow.offenders.forEach((o) => console.log(`        - ${o.selector}  right=${o.right.toFixed(0)}px width=${o.width.toFixed(0)}px`));
    } else {
      console.log('    [OK] no horizontal overflow');
    }

    const tap = await checkTapTargets(page);
    if (tap.count > 0) {
      console.log(`    [TAP TARGETS] ${tap.count} interactive element(s) smaller than 40x40px:`);
      tap.examples.forEach((t) => console.log(`        - ${t.selector}  ${t.width.toFixed(0)}x${t.height.toFixed(0)}px`));
    } else {
      console.log('    [OK] all checked tap targets are >=40x40px');
    }

    // Extra dwell time so it's comfortable to actually look at, on top of the
    // slowMo already spacing out the underlying actions.
    await page.waitForTimeout(2500);
  }

  console.log('\n================================================================');
  console.log(' WALKTHROUGH COMPLETE — browser window will stay open.');
  console.log(' Scroll / tap / resize it yourself if you want a closer look.');
  console.log(' Tell the assistant when you want this closed.');
  console.log('================================================================\n');

  // Keep the process (and therefore the browser) alive indefinitely.
  await new Promise(() => {});
});
