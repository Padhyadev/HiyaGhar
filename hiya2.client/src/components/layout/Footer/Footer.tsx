import React, { useState, useEffect } from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { navigateTo } from '../../../utils/navigation';
import { ShippingService, type ShippingSettings } from '../../../services/shippingService';
import './Footer.css';

export const Footer: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<ShippingSettings>(() => ShippingService.getSettings());

  useEffect(() => {
    // Initial fetch from API
    ShippingService.loadSettingsFromApi().then((data) => {
      if (data) setStoreSettings(data);
    });

    // Listen to store settings updates in same or other tabs
    const handleStorageChange = () => {
      setStoreSettings(ShippingService.getSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  type FooterLink =
    | { label: string; type: 'route'; href: string }
    | { label: string; type: 'external'; href: string };

  const navColumns: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Shop',
      links: [
        { label: 'Artisanal Mukhwas', type: 'route', href: '/mukhwas' },
        { label: 'Traditional Tea Masala', type: 'route', href: '/tea-masala' },
        { label: 'Handmade Soap', type: 'route', href: '/handmade-soap' },
        { label: 'Ayurvedic Hair Oil', type: 'route', href: '/hair-oil' },
      ],
    },
    {
      title: 'Gifting',
      links: [
        { label: 'Gift Hampers', type: 'route', href: '/gift-hampers' },
        { label: 'Wellness Combos', type: 'route', href: '/combos' },
        { label: 'Customize Combo', type: 'route', href: '/customize-combo' },
      ],
    },
    {
      title: 'Hiya',
      links: [
        { label: 'Our Story', type: 'route', href: '/our-story' },
        { label: 'FAQs & Help', type: 'route', href: '/faq' },
        { label: 'Contact Us', type: 'route', href: '/contact-us' },
      ],
    },
    {
      title: 'Help & Support',
      links: [
        { label: 'Track Order', type: 'route', href: '/track-order' },
        { label: 'Shipping Policy', type: 'route', href: '/shipping-policy' },
        { label: 'Returns & Refunds', type: 'route', href: '/refund-policy' },
        { label: 'My Account', type: 'route', href: '/profile' },
      ],
    },
    {
      title: 'Legal & Trust',
      links: [
        { label: 'Privacy Policy', type: 'route', href: '/privacy-policy' },
        { label: 'Terms & Conditions', type: 'route', href: '/terms-conditions' },
        { label: 'Cancellation Policy', type: 'route', href: '/refund-policy' },
      ],
    },
  ];

  return (
    <footer className="hiyaghar-footer-section" aria-label="Page Footer">
      <div className="hiyaghar-footer-inner-container">
        {/* Top White Card with Navigation */}
        <div className="hiyaghar-footer-white-card">
          {/* Links Navigation Columns */}
          <ScrollReveal variant="fade-up" delay={100} className="hiyaghar-footer-nav-grid">
            {navColumns.map((col) => (
              <div key={col.title} className="hiyaghar-footer-nav-col">
                <h3 className="hiyaghar-footer-col-heading">{col.title}</h3>
                <ul className="hiyaghar-footer-col-list">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.type === 'route' ? (
                        <a
                          href={link.href}
                          className="hiyaghar-footer-col-link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo(link.href);
                          }}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <a
                          href={link.href}
                          className="hiyaghar-footer-col-link"
                          target={link.href.startsWith('http') ? '_blank' : undefined}
                          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ScrollReveal>
        </div>

        {/* Bottom Bar Below White Card on Cyan Background */}
        <div className="hiyaghar-footer-bottom-bar">
          {/* Social Links (Clickable links to social platforms) */}
          <ScrollReveal variant="fade-right" delay={200} className="hiyaghar-footer-socials">
            <a
              href="https://www.instagram.com/hiyaghar_/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="hiyaghar-footer-social-btn"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61593338044762"
              target="_blank"
              rel="noopener noreferrer"
              className="hiyaghar-footer-social-btn"
              aria-label="Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </ScrollReveal>

          {/* Center Brand Logo & Trust Signals */}
          <ScrollReveal variant="fade-up" delay={100} className="hiyaghar-footer-center-logo">
            <img src="/image/HIYA LOGO (1).png" alt="HIYA" className="hiyaghar-footer-logo-img" />
            {storeSettings.enableFssaiDisplay && storeSettings.fssaiLicenseNumber && (
              <div className="hiyaghar-footer-fssai-pill">
                <span className="hiyaghar-fssai-label">FSSAI Lic. No.</span>
                <span className="hiyaghar-fssai-val">{storeSettings.fssaiLicenseNumber}</span>
              </div>
            )}
            <p className="hiyaghar-footer-contact-brief">
              {[
                storeSettings.contactEmail,
                storeSettings.contactPhone,
                storeSettings.contactAddress,
              ]
                .filter(Boolean)
                .join(' | ')}
            </p>
          </ScrollReveal>

          {/* Right Copyright */}
          <ScrollReveal variant="fade-up" delay={250} className="hiyaghar-footer-right-info">
            <p className="hiyaghar-footer-copyright">
              © {new Date().getFullYear()} HIYAGHAR. All Rights Reserved.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </footer>
  );
};

