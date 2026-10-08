import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { ScrollReveal } from '../../components/common/ScrollReveal/ScrollReveal';
import { ShippingService, type ShippingSettings } from '../../services/shippingService';
import { navigateTo } from '../../utils/navigation';
import './LegalPage.css';

interface StaticLegalPageProps {
  title: string;
  metaDescription: string;
  children: React.ReactNode | ((settings: ShippingSettings) => React.ReactNode);
  activeSlug?: string;
}

export const StaticLegalPage: React.FC<StaticLegalPageProps> = ({
  title,
  metaDescription,
  children,
  activeSlug,
}) => {
  const [storeSettings, setStoreSettings] = useState<ShippingSettings>(() => ShippingService.getSettings());

  useEffect(() => {
    if (title) {
      document.title = `${title} | HIYAGHAR`;
    }
    ShippingService.loadSettingsFromApi().then((settings) => {
      if (settings) setStoreSettings(settings);
    });

    const handleStorageChange = () => {
      setStoreSettings(ShippingService.getSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [title]);

  const policyTabs = [
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms & Conditions', path: '/terms-conditions' },
    { name: 'Refund & Cancellation', path: '/refund-policy' },
    { name: 'Shipping Policy', path: '/shipping-policy' },
  ];

  const currentPath = activeSlug || window.location.pathname;

  return (
    <div className="hiyaghar-legal-layout">
      <Helmet>
        <title>{title} | HIYAGHAR</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <Header />

      <main className="hiyaghar-legal-main">
        {/* PREMIUM HERO BANNER WITH BACKGROUND PICTURE */}
        <section className="hiyaghar-legal-hero-banner" aria-label="Legal & Policies Banner">
          <div className="hiyaghar-legal-hero-banner-card">
            <div className="hiyaghar-legal-hero-banner-overlay" />
            <div className="hiyaghar-legal-hero-container">
              <ScrollReveal variant="fade-up">
                {/* Breadcrumbs */}
                <nav className="hiyaghar-legal-banner-breadcrumb" aria-label="Breadcrumb">
                  <ol className="hiyaghar-legal-breadcrumb-list">
                    <li>
                      <a
                        href="#/"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo('/');
                        }}
                      >
                        Home
                      </a>
                    </li>
                    <li className="sep">/</li>
                    <li className="current">Policies & Trust</li>
                    <li className="sep">/</li>
                    <li className="current-sub">{title}</li>
                  </ol>
                </nav>

                <span className="hiyaghar-legal-hero-eyebrow">POLICIES & LEGAL TRANSPARENCY</span>
                <h1 className="hiyaghar-legal-hero-title">{title}</h1>
                <p className="hiyaghar-legal-hero-subtitle">
                  We value your trust. Learn about how we handle orders, privacy protection, and transparent customer care at HIYAGHAR.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* POLICY QUICK NAVIGATION TABS */}
        <div className="hiyaghar-legal-tabs-wrapper">
          <div className="hiyaghar-legal-tabs-container">
            {policyTabs.map((tab) => {
              const isActive = currentPath.toLowerCase().includes(tab.path.toLowerCase()) || title.toLowerCase() === tab.name.toLowerCase();
              return (
                <button
                  key={tab.path}
                  type="button"
                  className={`hiyaghar-legal-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => navigateTo(tab.path)}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN LEGAL CONTENT CARD */}
        <div className="hiyaghar-legal-container-outer">
          <ScrollReveal variant="fade-up">
            <div className="hiyaghar-legal-card">
              <div className="hiyaghar-legal-header-meta">
                <div className="hiyaghar-legal-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Official Policy Document</span>
                </div>
                <span className="hiyaghar-legal-last-updated">Last Updated: October 2026</span>
              </div>

              <div className="hiyaghar-legal-content">
                {typeof children === 'function' ? children(storeSettings) : children}
              </div>

              {/* DYNAMIC TRUST & ASSISTANCE CARD */}
              <div className="hiyaghar-legal-help-card">
                <div className="hiyaghar-legal-help-info">
                  <h3>Need further clarification?</h3>
                  <p>Our customer support team is always available to answer your questions or assist with any concerns.</p>
                </div>
                <div className="hiyaghar-legal-help-actions">
                  <a
                    href={`https://wa.me/${(storeSettings.contactPhone || '919274443617').replace(/[^0-9]/g, '')}?text=Hello%20HiyaGhar,%20I%20have%20a%20question%20about%20your%20${encodeURIComponent(title)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hiyaghar-legal-wa-btn"
                  >
                    <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.1rem' }}></i>
                    <span>Chat on WhatsApp</span>
                  </a>
                  <a
                    href="#/contact-us"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/contact-us');
                    }}
                    className="hiyaghar-legal-contact-btn"
                  >
                    <span>Contact Us</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};
