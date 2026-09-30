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
  const [columnCount, setColumnCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 8;
    const width = window.innerWidth;
    if (width < 640) return 3;
    if (width < 1024) return 5;
    return 8;
  });

  const [shutterPhase, setShutterPhase] = useState<'idle' | 'closing' | 'covered' | 'opening'>('idle');
  const [pageStage, setPageStage] = useState<'idle' | 'leaving' | 'entering'>('idle');
  const [displayChildren, setDisplayChildren] = useState<React.ReactNode>(children);

  const prevHashRef = useRef<string>(currentHash);
  const isTransitioningRef = useRef<boolean>(false);

  // Responsive Column Count Listener
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnCount(3);
      else if (width < 1024) setColumnCount(5);
      else setColumnCount(8);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** Helper to extract primary route path without query parameters or sub-anchors */
  const getCleanRouteBase = (hash: string) => {
    if (!hash) return '/';
    const clean = hash.replace(/^#\/?/, '').split('?')[0].split('#')[0];
    return clean || '/';
  };

  useEffect(() => {
    const prevRoute = getCleanRouteBase(prevHashRef.current);
    const newRoute = getCleanRouteBase(currentHash);

    // 1. Ignore same-page anchor scrolling or identical hash clicks
    if (prevRoute === newRoute) {
      setDisplayChildren(children);
      prevHashRef.current = currentHash;
      return;
    }

    // 2. Prevent overlapping transitions on rapid navigation
    if (isTransitioningRef.current) {
      setDisplayChildren(children);
      prevHashRef.current = currentHash;
      return;
    }

    prevHashRef.current = currentHash;
    isTransitioningRef.current = true;

    // Calculate total stagger duration based on active column count
    const staggerStepMs = 35;
    const coverDurationMs = 380 + (columnCount - 1) * staggerStepMs;
    const revealDurationMs = 420 + (columnCount - 1) * staggerStepMs;

    // PHASE 1: CLOSING SHUTTERS (Alternating Top/Bottom Columns Slide In)
    setShutterPhase('closing');
    setPageStage('leaving');

    // PHASE 2: COVERED & ROUTE SWAP
    const coverTimer = setTimeout(() => {
      setShutterPhase('covered');
      setDisplayChildren(children);
      setPageStage('entering');

      // PHASE 3: OPENING SHUTTERS (Reverse Unveiling)
      const openingTriggerTimer = setTimeout(() => {
        setShutterPhase('opening');

        const endTimer = setTimeout(() => {
          setShutterPhase('idle');
          setPageStage('idle');
          isTransitioningRef.current = false;
        }, revealDurationMs);

        return () => clearTimeout(endTimer);
      }, 50);

      return () => clearTimeout(openingTriggerTimer);
    }, coverDurationMs);

    return () => {
      clearTimeout(coverTimer);
    };
  }, [currentHash, children, columnCount]);

  return (
    <div className="hiyaghar-shutter-wrapper">
      {/* Distinct Horizontal Brand Wipe Transition Overlay */}
      <div
        className={`hiyaghar-shutter-overlay ${
          shutterPhase === 'closing'
            ? 'is-closing'
            : shutterPhase === 'covered'
            ? 'is-covered'
            : shutterPhase === 'opening'
            ? 'is-opening'
            : ''
        }`}
        aria-hidden="true"
      >
        {/* Main Navy Wipe Panel with Gold Leading Stripe */}
        <div className="hiyaghar-horizontal-wipe-panel">
          <div className="hiyaghar-wipe-gold-stripe" />
          <img src="/image/HIYA LOGO (1).png" alt="" className="hiyaghar-wipe-watermark-logo" />
        </div>
      </div>

      {/* Page Content Stage Underneath Curtain */}
      <div
        className={`hiyaghar-shutter-page-stage ${
          pageStage === 'leaving'
            ? 'is-leaving'
            : pageStage === 'entering'
            ? 'is-entering'
            : ''
        }`}
      >
        {displayChildren}
      </div>
    </div>
  );
};
