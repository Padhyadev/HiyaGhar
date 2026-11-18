import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { getInstallState, promptInstall, subscribeInstall } from '../../../utils/pwaInstall';
import './InstallAppPopup.css';

// Install banner ("Install HIYAGHAR - quick & 1-click access"). Same rules as the footer button
// (utils/pwaInstall.ts): only when the browser can install the site, or as a Share tip on
// iPhone/iPad; never inside the installed app. The X hides it for DISMISS_DAYS (remembered in
// this browser). Not shown during checkout. Admin pages never render it (see App.tsx).

const DISMISS_KEY = 'hiya_install_popup_dismissed_at';
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 3000;

const dismissedRecently = (): boolean => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

interface InstallAppPopupProps {
  /** Current route, so the banner stays out of checkout. */
  route: string;
}

export const InstallAppPopup: React.FC<InstallAppPopupProps> = ({ route }) => {
  const { canPrompt, isIos, isInstalled } = useSyncExternalStore(subscribeInstall, getInstallState, getInstallState);
  const [dismissed, setDismissed] = useState<boolean>(dismissedRecently);
  const [ready, setReady] = useState(false); // small delay so it does not pop up on first paint
  const [showIosTip, setShowIosTip] = useState(false);

  const eligible = !isInstalled && !dismissed && (canPrompt || isIos);
  const onCheckout = route.toLowerCase().startsWith('/checkout');

  useEffect(() => {
    if (!eligible) return;
    const t = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [eligible]);

  if (!eligible || !ready || onCheckout) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage blocked: hidden for this visit only */
    }
  };

  const install = async () => {
    if (canPrompt) {
      await promptInstall(); // the banner hides itself: the offer can only be used once
    } else {
      setShowIosTip((v) => !v);
    }
  };

  return (
    <div className="hiyaghar-install-popup" role="dialog" aria-label="Install the HIYAGHAR app">
      <div className="hiyaghar-install-popup-row">
        <div className="hiyaghar-install-popup-logo">
          <img src="/android-chrome-192x192.png" alt="" width={40} height={40} />
        </div>
        <div className="hiyaghar-install-popup-text">
          <strong>HIYAGHAR</strong>
          <span>Install for quick &amp; 1&#8209;click access</span>
        </div>
        <button type="button" className="hiyaghar-install-popup-btn" onClick={install}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12" />
            <polyline points="7 10 12 15 17 10" />
            <path d="M5 21h14" />
          </svg>
          <span>Install</span>
        </button>
        <button type="button" className="hiyaghar-install-popup-close" onClick={close} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {isIos && showIosTip && (
        <p className="hiyaghar-install-popup-tip" role="note">
          Tap <strong>Share</strong>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share icon">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          then <strong>Add to Home Screen</strong>.
        </p>
      )}
    </div>
  );
};
