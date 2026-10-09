import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/globals/global.css';
import App from './App.tsx';

// Filter third-party SDK noise from console (e.g. Razorpay Sardine/Sentry internal port probes)
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args: any[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a) || '')).join(' ');
    if (
      msg.includes('sardine') ||
      msg.includes('sentry') ||
      msg.includes('Permissions policy') ||
      msg.includes('devicemotion') ||
      msg.includes('deviceorientation') ||
      msg.includes('37857') ||
      msg.includes('7070') ||
      msg.includes('7071') ||
      msg.includes('loopback') ||
      msg.includes('x-rtb-fingerprint-id') ||
      msg.includes('request-id')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a) || '')).join(' ');
    if (
      msg.includes('Permissions policy') ||
      msg.includes('devicemotion') ||
      msg.includes('deviceorientation') ||
      msg.includes('loopback')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Head tags from index.html (data-static-head) and from the server's SEO injection (data-server-seo)
// are for non-JS crawlers and social scrapers; <SEO> (react-helmet-async) recreates the same tags
// once the app runs, so drop them to avoid duplicates. Server JSON-LD stays until the first
// in-app navigation (see App.tsx).
document
  .querySelectorAll('head [data-static-head], head [data-server-seo]:not(script[type="application/ld+json"])')
  .forEach((el) => el.remove());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
