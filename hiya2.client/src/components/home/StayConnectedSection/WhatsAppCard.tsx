import React from 'react';
import { retentionConfig } from './retentionConfig';

export const WhatsAppCard: React.FC = () => {
  return (
    <div className="hiyaghar-retention-card hiyaghar-whatsapp-card">
      <div className="hiyaghar-retention-card-header">
        <div className="hiyaghar-retention-icon-box hiyaghar-whatsapp-icon-box" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2d6a4f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <span className="hiyaghar-retention-badge hiyaghar-whatsapp-badge">DIRECT UPDATES</span>
      </div>

      <h3 className="hiyaghar-retention-card-title">{retentionConfig.whatsappTitle}</h3>
      <p className="hiyaghar-retention-card-desc">{retentionConfig.whatsappDesc}</p>

      <div className="hiyaghar-retention-card-action">
        <a
          href={retentionConfig.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hiyaghar-retention-btn hiyaghar-whatsapp-btn"
          aria-label="Join Hiya on WhatsApp (opens in a new tab)"
        >
          <span>{retentionConfig.whatsappCta}</span>
          <svg
            className="hiyaghar-retention-arrow"
            width="16"
            height="12"
            viewBox="0 0 18 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="1" y1="7" x2="15" y2="7" />
            <polyline points="10 2 15 7 10 12" />
          </svg>
        </a>
      </div>
    </div>
  );
};
