import React, { useState, useSyncExternalStore } from 'react';
import { getInstallState, promptInstall, subscribeInstall } from '../../../utils/pwaInstall';
import './InstallAppButton.css';

interface InstallAppButtonProps {
  /** Footer (light pill) or mobile menu (full-width row). */
  variant?: 'footer' | 'menu';
}

// "Install App": only when the browser can install the site (Chrome/Edge/Android), or a tip on
// iPhone/iPad. Hidden when the site already runs as the installed app.
export const InstallAppButton: React.FC<InstallAppButtonProps> = ({ variant = 'footer' }) => {
  const { canPrompt, isIos, isInstalled } = useSyncExternalStore(subscribeInstall, getInstallState, getInstallState);
  const [showIosTip, setShowIosTip] = useState(false);

  if (isInstalled || (!canPrompt && !isIos)) return null;

  const onClick = () => {
    if (canPrompt) {
      void promptInstall();
    } else {
      setShowIosTip((v) => !v);
    }
  };

  return (
    <div className={`hiyaghar-install-app hiyaghar-install-app--${variant}`}>
      <button type="button" className="hiyaghar-install-app-btn" onClick={onClick} aria-expanded={isIos ? showIosTip : undefined}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" />
          <polyline points="7 10 12 15 17 10" />
          <path d="M5 21h14" />
        </svg>
        <span>Install App</span>
      </button>
      {isIos && showIosTip && (
        <p className="hiyaghar-install-app-tip" role="note">
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
