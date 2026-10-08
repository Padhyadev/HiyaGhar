import React, { useState, useEffect, useRef } from 'react';
import './PageTransition.css';

interface PageTransitionProps {
  currentHash: string;
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  currentHash,
  children,
}) => {
  const [displayChildren, setDisplayChildren] = useState<React.ReactNode>(children);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const prevHashRef = useRef<string>(currentHash);

  /** Helper to extract primary route path without query parameters or sub-anchors */
  const getCleanRouteBase = (hash: string) => {
    if (!hash) return '/';
    const clean = hash.replace(/^#\/?/, '').split('?')[0].split('#')[0];
    return clean || '/';
  };

  useEffect(() => {
    const prevRoute = getCleanRouteBase(prevHashRef.current);
    const newRoute = getCleanRouteBase(currentHash);

    // If same route, update children immediately without triggering transition
    if (prevRoute === newRoute) {
      setDisplayChildren(children);
      prevHashRef.current = currentHash;
      return;
    }

    prevHashRef.current = currentHash;

    // Trigger Frosted Glass & Minimal Brand Spinner
    setIsTransitioning(true);
    setIsExiting(false);

    // Smooth timing: 280ms reveal swap, then fade out frosted glass
    const swapTimer = setTimeout(() => {
      setDisplayChildren(children);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setIsExiting(true);

      const finishTimer = setTimeout(() => {
        setIsTransitioning(false);
        setIsExiting(false);
      }, 250);

      return () => clearTimeout(finishTimer);
    }, 280);

    return () => {
      clearTimeout(swapTimer);
    };
  }, [currentHash, children]);

  return (
    <div className="hiyaghar-page-container-root">
      {/* LUXURY FROSTED GLASS & MINIMAL BRAND SPINNER OVERLAY */}
      {isTransitioning && (
        <div className={`hiyaghar-frosted-overlay ${isExiting ? 'is-exiting' : ''}`} aria-hidden="true">
          <div className="hiyaghar-frosted-backdrop" />
          
          <div className="hiyaghar-frosted-card">
            {/* Elegant Dual Spinning Gold Arc */}
            <div className="hiyaghar-brand-spinner">
              <div className="spinner-arc-outer" />
              <div className="spinner-arc-inner" />
            </div>

            {/* HIYAGHAR Clean Brand Emblem & Logo */}
            <div className="hiyaghar-frosted-logo-box">
              <img
                src="/image/HIYA LOGO (1).png"
                alt="HIYAGHAR"
                className="hiyaghar-frosted-logo"
              />
            </div>

            {/* Micro subtle brand text */}
            <div className="hiyaghar-frosted-tagline">
              <span className="dot dot-1" />
              <span className="dot dot-2" />
              <span className="dot dot-3" />
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className={`hiyaghar-page-content-wrapper ${isTransitioning ? 'page-blur' : ''}`}>
        {displayChildren}
      </div>
    </div>
  );
};
