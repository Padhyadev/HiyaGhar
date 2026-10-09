import React from 'react';

/**
 * Minimal neutral Suspense fallback for lazy-loaded routes.
 * Uses a tiny inline SVG spinner so no extra CSS file is needed.
 * Height is clamped so the layout doesn't shift when replacing the
 * previous route's content.
 */
export const RouteLoader: React.FC = () => (
  <div
    aria-label="Loading page…"
    role="status"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%',
    }}
  >
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CB992C"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.9s linear infinite' }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  </div>
);
