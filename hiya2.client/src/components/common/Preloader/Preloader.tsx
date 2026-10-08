import React, { useState, useEffect } from 'react';
import './Preloader.css';

interface PreloaderProps {
  logoSrc?: string;
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({
  logoSrc = '/image/HIYA LOGO (1).png',
  onComplete
}) => {
  const hasLoadedBefore = sessionStorage.getItem('hiyaghar_initial_loaded') === 'true';
  const [isExiting, setIsExiting] = useState<boolean>(hasLoadedBefore);
  const [isDestroyed, setIsDestroyed] = useState<boolean>(hasLoadedBefore);

  useEffect(() => {
    if (hasLoadedBefore) {
      if (onComplete) onComplete();
      return;
    }

    sessionStorage.setItem('hiyaghar_initial_loaded', 'true');

    // Fast & snappy: 800ms total entrance + quick exit
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      document.body.classList.add('preloader-done');
      window.dispatchEvent(new CustomEvent('preloaderComplete'));
      if (onComplete) onComplete();
    }, 850);

    // Unmount completely from DOM in 1.1s
    const destroyTimer = setTimeout(() => {
      setIsDestroyed(true);
    }, 1150);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(destroyTimer);
    };
  }, [onComplete]);

  if (isDestroyed) return null;

  return (
    <div className={`hg-pure-loader ${isExiting ? 'is-exiting' : ''}`} aria-hidden="true">
      {/* Frosted Modal Card Showcase */}
      <div className="hg-frosted-card">
        {/* Dual Rotating Arcs */}
        <div className="hg-brand-spinner">
          <div className="spinner-arc-outer" />
          <div className="spinner-arc-inner" />
        </div>

        {/* Core Logo Container */}
        <div className="hg-frosted-logo-box">
          <img src={logoSrc} alt="HIYAGHAR" className="hg-frosted-logo" />
        </div>

        {/* 3 Animated Gold Dots */}
        <div className="hg-frosted-tagline">
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
        </div>
      </div>
    </div>
  );
};
