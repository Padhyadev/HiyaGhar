// Remembers where the shopper was on each page so the browser Back/Forward button
// returns them to the same spot (e.g. back from a product to the middle of a listing)
// instead of the top. Normal in-app navigation still opens the new page at the top.
//
// The app sets history.scrollRestoration = 'manual' and scrolls to the top on every
// route change, so this is done by hand: the position is saved whenever a new URL is
// pushed (every link in the app goes through history.pushState) and restored only on a
// real Back/Forward - the app also dispatches its own synthetic popstate events after
// pushing, which are not trusted events and are ignored here.
//
// A link inside an element marked data-scroll-anchor="<name>" (e.g. the "Meet the
// Founder" strip) returns the shopper to the top of that element instead of the exact
// pixel position, so a tall section stacked on mobile isn't cut off above the viewport.

interface SavedPosition {
  y: number;
  anchor?: string;
}

const positions = new Map<string, SavedPosition>();
let cancelActiveRestore: (() => void) | null = null;
let pageSwapped: (() => void) | null = null;
let installed = false;
let lastPush: { from: string; to: string } | null = null;
let lastClick: { target: Element; at: number } | null = null;

const currentKey = () => window.location.pathname + window.location.search;

export const installScrollMemory = (): void => {
  if (installed) return;
  installed = true;
  document.addEventListener(
    'click',
    (e) => {
      if (e.target instanceof Element) lastClick = { target: e.target, at: Date.now() };
    },
    true
  );
  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = (...args: Parameters<History['pushState']>) => {
    const from = currentKey();
    const anchor =
      lastClick && Date.now() - lastClick.at < 1000
        ? lastClick.target.closest('[data-scroll-anchor]')?.getAttribute('data-scroll-anchor') ?? undefined
        : undefined;
    positions.set(from, { y: window.scrollY, anchor });
    lastClick = null;
    originalPushState(...args);
    lastPush = { from, to: currentKey() };
  };
};

// True when the current page was opened straight from `path` (e.g. a product opened
// from the Mukhwas listing), so an in-page "Back to ..." button can use history.back()
// and land at the same scroll position.
export const cameDirectlyFrom = (path: string): boolean =>
  !!lastPush && lastPush.to === currentKey() && lastPush.from.split('?')[0].toLowerCase() === path.toLowerCase();

// Where to scroll for a saved position: the top of its anchor element (just below the
// sticky header) when that element is on the page, otherwise the saved pixel offset.
const resolveTarget = (saved: SavedPosition): { top: number; clamp: boolean } => {
  if (saved.anchor) {
    const el = document.querySelector(`[data-scroll-anchor="${saved.anchor}"]`);
    if (el) {
      const header = document.querySelector('.hiyaghar-header-wrapper') as HTMLElement | null;
      const top = el.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight ?? 0);
      return { top: Math.max(0, Math.round(top)), clamp: true };
    }
  }
  return { top: saved.y, clamp: false };
};

// Called by PageTransition right after the new page is rendered (before it is painted).
// Returns true when a Back/Forward restore took over the scroll position, false when
// the caller should scroll to the top as usual.
export const scrollAfterPageSwap = (): boolean => {
  if (!pageSwapped) return false;
  pageSwapped();
  return true;
};

// Returns true when it is restoring a saved position, false when the caller should
// scroll to the top as usual. `waitForPageSwap` is set when the route changes page, so
// the restore starts only once PageTransition swaps the new page in (scrollAfterPageSwap)
// - the old page isn't moved and the new one never flashes its top first.
export const restoreScrollOnPopstate = (event: Event, waitForPageSwap = false): boolean => {
  cancelActiveRestore?.();
  cancelActiveRestore = null;
  pageSwapped = null;

  if (!event.isTrusted) return false;
  const saved = positions.get(currentKey());
  if (!saved || (!saved.y && !saved.anchor)) return false;

  // Listings load their products asynchronously and images above the anchor may still
  // be sizing, so keep correcting until the page is tall enough and stays put.
  // Stops as soon as the shopper scrolls themselves.
  let startedAt = 0;
  let timer = 0;
  const tick = () => {
    const elapsed = Date.now() - startedAt;
    const { top, clamp } = resolveTarget(saved);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if ((clamp || maxScroll >= top - 2) && Math.abs(window.scrollY - top) > 2) {
      window.scrollTo({ top, left: 0, behavior: 'instant' });
    }
    const settled = elapsed > 400 && Math.abs(window.scrollY - top) <= 2;
    if (settled || elapsed > 3000) stop();
  };
  const start = () => {
    pageSwapped = null;
    startedAt = Date.now();
    tick();
    timer = window.setInterval(tick, 50);
  };
  const stop = () => {
    window.clearInterval(timer);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
    if (pageSwapped === start) pageSwapped = null;
    if (cancelActiveRestore === stop) cancelActiveRestore = null;
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);
  cancelActiveRestore = stop;
  if (waitForPageSwap) {
    pageSwapped = start;
    // Safety net in case no swap arrives (e.g. the transition was skipped).
    window.setTimeout(() => { if (pageSwapped === start) start(); }, 1000);
  } else {
    start();
  }
  return true;
};
