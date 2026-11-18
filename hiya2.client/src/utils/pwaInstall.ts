// "Install App" support (manifest: public/manifest.webmanifest).
//
// Chrome / Edge / Samsung Internet fire `beforeinstallprompt` once, early, when the site can be
// installed. It must be caught before React renders (main.tsx calls initInstallPrompt first),
// kept, and replayed with prompt() when the visitor clicks "Install App".
// iPhone / iPad never fire it: there the visitor uses Share -> Add to Home Screen, so we show a tip.
// Nothing is shown when the site already runs as an installed app (standalone).

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallState {
  /** The browser offered installing (Chrome/Edge/Android) and the event is kept. */
  canPrompt: boolean;
  /** iPhone/iPad: no install event exists; show the Share -> Add to Home Screen tip. */
  isIos: boolean;
  /** Already running as the installed app. */
  isInstalled: boolean;
}

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = { canPrompt: false, isIos: false, isInstalled: false };
const listeners = new Set<() => void>();

const setState = (next: Partial<InstallState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const runningStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS reports itself as a Mac, so also check for a touch screen.
const isIosDevice = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let started = false;

/** Call once, before React renders (main.tsx). */
export function initInstallPrompt(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  state = { canPrompt: false, isIos: isIosDevice(), isInstalled: runningStandalone() };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep it for our own button instead of the browser's mini-bar
    deferred = e as BeforeInstallPromptEvent;
    setState({ canPrompt: true });
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    setState({ canPrompt: false, isInstalled: true });
  });

  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (e) => {
    if (e.matches) setState({ isInstalled: true, canPrompt: false });
  });
}

/** Shows the browser's install dialog. Returns true when the visitor installed. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null; // the event can only be used once
  setState({ canPrompt: false });
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === 'accepted';
}

export const subscribeInstall = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getInstallState = () => state;
