// Keeps open tabs on the latest published version.
// Every publish replaces the hashed JS files (and deletes the old ones), so a tab opened before a
// publish keeps running old code. Two safeguards:
//  1. A lazy page file that fails to load (deleted by the publish) reloads the page once.
//  2. When the tab becomes visible again (and every 10 minutes) /index.html is checked; if it
//     names a different main script, the next in-app navigation does a full reload
//     (see App.tsx) - never in the middle of a form.

const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_GUARD_KEY = 'hiya_reload_after_publish';
const MAIN_SCRIPT = /\/assets\/index-[^"']+\.js/;

// null in the Vite dev server (/src/main.tsx), so the check is off there.
const currentScript = (() => {
  const src = Array.from(document.querySelectorAll('script[type="module"][src]'))
    .map((s) => s.getAttribute('src') || '')
    .find((s) => MAIN_SCRIPT.test(s));
  return src ? src.match(MAIN_SCRIPT)![0] : null;
})();

let updateAvailable = false;

export const isUpdateAvailable = () => updateAvailable;

async function checkForUpdate() {
  if (!currentScript || updateAvailable) return;
  try {
    const res = await fetch('/index.html', { cache: 'no-store' });
    if (!res.ok) return;
    const latest = (await res.text()).match(MAIN_SCRIPT)?.[0];
    if (latest && latest !== currentScript) updateAvailable = true;
  } catch {
    // offline: try again later
  }
}

export function startVersionWatch() {
  window.addEventListener('vite:preloadError', (event) => {
    // At most one automatic reload per 10 s, so a real network failure cannot loop.
    let last = 0;
    try { last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0); } catch { /* ignore */ }
    if (Date.now() - last < 10_000) return;
    try { sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now())); } catch { /* ignore */ }
    event.preventDefault();
    window.location.reload();
  });

  if (!currentScript) return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForUpdate();
  });
  window.setInterval(() => void checkForUpdate(), CHECK_INTERVAL_MS);
}
