import React from 'react';
import { SEO } from '../../components/common/SEO/SEO';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { navigateTo } from '../../utils/navigation';
import './NotFoundPage.css';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="hiyaghar-notfound-layout">
      <SEO
        title="404 - Page Not Found | HIYAGHAR"
        description="The page you are looking for does not exist or has been moved."
        path={window.location.pathname}
        noindex
      />
      <Header />
      <main id="main-content" tabIndex={-1} className="hiyaghar-notfound-main">
        <div className="hiyaghar-notfound-card">
          <div className="hiyaghar-notfound-code">404</div>
          <h1 className="hiyaghar-notfound-title">Oops! Page Not Found</h1>
          <p className="hiyaghar-notfound-sub">
            The page you're looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <div className="hiyaghar-notfound-actions">
            <button
              type="button"
              className="hiyaghar-notfound-btn primary"
              onClick={() => navigateTo('/')}
            >
              Back to Home
            </button>
            <button
              type="button"
              className="hiyaghar-notfound-btn secondary"
              onClick={() => navigateTo('/mukhwas')}
            >
              Explore Mukhwas
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
