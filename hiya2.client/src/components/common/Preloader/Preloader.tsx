import React, { useState, useEffect } from 'react';
import './Preloader.css';

interface PreloaderProps {
  /** Optional custom logo URL, defaults to the HIYA brand logo */
  logoSrc?: string;
  /** Minimum time in ms the preloader will show to allow page assets/data to load */
  minDisplayMs?: number;
  /** Maximum failsafe timeout in ms to prevent loader getting stuck */
  maxTimeoutMs?: number;
}

export const Preloader: React.FC<PreloaderProps> = ({
  logoSrc = '/image/HIYA LOGO (1).png',
  minDisplayMs = 2000,
  maxTimeoutMs = 3500,
}) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isDestroyed, setIsDestroyed] = useState<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    let dismissTimerId: ReturnType<typeof setTimeout>;
    let destroyTimerId: ReturnType<typeof setTimeout>;

    const triggerDismiss = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayMs - elapsedTime);

      dismissTimerId = setTimeout(() => {
        setIsExiting(true);
        document.body.classList.add('preloader-done');
        window.dispatchEvent(new CustomEvent('preloaderComplete'));
        // Wait for the 450ms CSS fade/scale exit animation before destroying DOM element
        destroyTimerId = setTimeout(() => {
          setIsDestroyed(true);
        }, 450);
      }, remainingTime);
    };

    // 1. If document is already completely loaded when component mounts
    if (document.readyState === 'complete') {
      triggerDismiss();
    } else {
      // 2. Otherwise listen for full window load
      const onLoad = () => triggerDismiss();
      window.addEventListener('load', onLoad, { once: true });

      // 3. Failsafe: Ensure loader NEVER hangs indefinitely
      const failsafeTimer = setTimeout(() => {
        window.removeEventListener('load', onLoad);
        triggerDismiss();
      }, maxTimeoutMs);

      return () => {
        window.removeEventListener('load', onLoad);
        clearTimeout(failsafeTimer);
        clearTimeout(dismissTimerId);
        clearTimeout(destroyTimerId);
      };
    }

    return () => {
      clearTimeout(dismissTimerId);
      clearTimeout(destroyTimerId);
    };
  }, [minDisplayMs, maxTimeoutMs]);

  if (isDestroyed) {
    return null;
  }

  return (
    <div
      className={`hiyaghar-preloader-overlay ${isExiting ? 'hiyaghar-preloader-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Hiya Organics Storefront"
    >
      {/* Split Curtain Panels for Exit Animation (Top slides UP, Bottom slides DOWN) */}
      <div className="hiyaghar-preloader-curtain-top" aria-hidden="true" />
      <div className="hiyaghar-preloader-curtain-bottom" aria-hidden="true" />

      {/* Background Radial Glow */}
      <div className="hiyaghar-preloader-glow-backdrop" aria-hidden="true" />

      <div className="hiyaghar-preloader-content">
        {/* Logo Container with SVG Progress Ring */}
        <div className="hiyaghar-preloader-brand-wrapper">
          <svg
            className="hiyaghar-preloader-svg-ring"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="hiyagharPreloaderGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#2d6a4f" />
                <stop offset="50%" stopColor="#37a6ca" />
                <stop offset="100%" stopColor="#cb992c" />
              </linearGradient>
            </defs>

            {/* Subtle background track circle */}
            <circle
              className="hiyaghar-preloader-ring-track"
              cx="50"
              cy="50"
              r="44"
            />

            {/* Glowing animated progress arc */}
            <circle
              className="hiyaghar-preloader-ring-indicator"
              cx="50"
              cy="50"
              r="44"
            />
          </svg>

          {/* Central Brand Logo */}
          <img
            src={logoSrc}
            alt="HIYA Organics Logo"
            className="hiyaghar-preloader-logo"
          />
        </div>

        {/* Shimmering Progress Bar */}
        <div className="hiyaghar-preloader-bar-track" aria-hidden="true">
          <div className="hiyaghar-preloader-bar-fill" />
        </div>

        {/* Subtitle Brand Tagline */}
        <div className="hiyaghar-preloader-tagline" aria-hidden="true">
          N A T U R A L &nbsp;&bull;&nbsp; O R G A N I C
        </div>
      </div>
    </div>
  );
};
