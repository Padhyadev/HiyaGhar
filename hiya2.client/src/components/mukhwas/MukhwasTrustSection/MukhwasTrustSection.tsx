import React from 'react';
import './MukhwasTrustSection.css';

interface TrustItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface MukhwasTrustSectionProps {
  items?: TrustItem[];
}

export const MukhwasTrustSection: React.FC<MukhwasTrustSectionProps> = ({ items }) => {
  const defaultTrustItems: TrustItem[] = [
    {
      id: 'ingredients',
      title: 'Fresh & Quality Ingredients',
      description: 'Hand-picked organic seeds, Gulkand & sun-dried spices',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'hygienic',
      title: 'Hygienically Packed',
      description: 'Sealed in airtight glass jars & food-grade pouch packs',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      id: 'authentic',
      title: 'Authentic Taste',
      description: 'Heritage recipes handed down through generations',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: 'delivery',
      title: 'Fast & Secure Delivery',
      description: 'Express doorstep shipping with 100% freshness guarantee',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
  ];

  const trustItems = items && items.length > 0 ? items : defaultTrustItems;

  return (
    <section className="hiyaghar-mukhwas-trust-section" aria-label="Quality and Trust Guarantee">
      <div className="hiyaghar-container">
        <div className="hiyaghar-mukhwas-trust-grid">
          {trustItems.map((item) => (
            <div key={item.id} className="hiyaghar-trust-card">
              <div className="hiyaghar-trust-icon-box">{item.icon}</div>
              <h3 className="hiyaghar-trust-title">{item.title}</h3>
              <p className="hiyaghar-trust-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
