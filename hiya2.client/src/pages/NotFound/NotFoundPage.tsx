import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { navigateTo } from '../../utils/navigation';
import './NotFoundPage.css';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="hiyaghar-notfound-layout">
      <Helmet>
        <title>404 - Page Not Found | Hiya Ghar</title>
        <meta name="description" content="The page you are looking for does not exist or has been moved." />
      </Helmet>
      <Header />
      <main className="hiyaghar-notfound-main">
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
