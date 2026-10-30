// Remembers where the shopper was on each page so the browser Back/Forward button
// returns them to the same spot (e.g. back from a product to the middle of a listing)
// instead of the top. Normal in-app navigation still opens the new page at the top.
//
// The app sets history.scrollRestoration = 'manual' and scrolls to the top on every
// route change, so this is done by hand: the position is saved whenever a new URL is
// pushed (every link in the app goes through history.pushState) and restored only on a
// real Back/Forward - the app also dispatches its own synthetic popstate events after
// pushing, which are not trusted events and are ignored here.

const positions = new Map<string, number>();
let cancelActiveRestore: (() => void) | null = null;
let installed = false;
let lastPush: { from: string; to: string } | null = null;

const currentKey = () => window.location.pathname + window.location.search;

export const installScrollMemory = (): void => {
  if (installed) return;
  installed = true;
  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = (...args: Parameters<History['pushState']>) => {
    const from = currentKey();
    positions.set(from, window.scrollY);
    originalPushState(...args);
    lastPush = { from, to: currentKey() };
  };
};

// True when the current page was opened straight from `path` (e.g. a product opened
// from the Mukhwas listing), so an in-page "Back to ..." button can use history.back()
// and land at the same scroll position.
export const cameDirectlyFrom = (path: string): boolean =>
  !!lastPush && lastPush.to === currentKey() && lastPush.from.split('?')[0].toLowerCase() === path.toLowerCase();

// Returns true when it is restoring a saved position, false when the caller should
// scroll to the top as usual.
export const restoreScrollOnPopstate = (event: Event): boolean => {
  cancelActiveRestore?.();
  cancelActiveRestore = null;

  if (!event.isTrusted) return false;
  const target = positions.get(currentKey());
  if (!target) return false;

  // The page swaps in after a short transition and listings load their products
  // asynchronously, so keep trying until the page is tall enough and stays put.
  // Stops as soon as the shopper scrolls themselves.
  const startedAt = Date.now();
  let timer = 0;
  const stop = () => {
    window.clearInterval(timer);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
    if (cancelActiveRestore === stop) cancelActiveRestore = null;
  };
  timer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    // Wait for PageTransition to swap the page in (280 ms), so the old page isn't moved.
    if (elapsed < 300) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll >= target - 2 && Math.abs(window.scrollY - target) > 2) {
      window.scrollTo({ top: target, left: 0, behavior: 'instant' });
    }
    const settled = elapsed > 700 && Math.abs(window.scrollY - target) <= 2;
    if (settled || elapsed > 3000) stop();
  }, 50);
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);
  cancelActiveRestore = stop;
  return true;
};
