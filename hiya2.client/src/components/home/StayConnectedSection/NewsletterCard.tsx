import React, { useState } from 'react';
import { retentionConfig } from './retentionConfig';

export const NewsletterCard: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const validateEmail = (input: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(input.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 600);
  };

  return (
    <div className="hiyaghar-retention-card hiyaghar-newsletter-card">
      <div className="hiyaghar-retention-card-header">
        <div className="hiyaghar-retention-icon-box hiyaghar-newsletter-icon-box" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c2410c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <span className="hiyaghar-retention-badge hiyaghar-newsletter-badge">INBOX STORIES</span>
      </div>

      <h3 className="hiyaghar-retention-card-title">{retentionConfig.newsletterTitle}</h3>
      <p className="hiyaghar-retention-card-desc">{retentionConfig.newsletterDesc}</p>

      {status === 'success' ? (
        <div className="hiyaghar-newsletter-success-box" role="status" aria-live="polite">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2d6a4f"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <strong>You're in! Welcome to the Hiya loop.</strong>
            <p className="hiyaghar-success-subtext">Check your inbox soon for special updates.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="hiyaghar-newsletter-form" noValidate>
          <div className="hiyaghar-newsletter-input-group">
            <label htmlFor="hiya-newsletter-email" className="visually-hidden">
              Enter your email address
            </label>
            <input
              id="hiya-newsletter-email"
              type="email"
              className={`hiyaghar-newsletter-input ${status === 'error' ? 'input-error' : ''}`}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? 'newsletter-error-text' : undefined}
            />
            <button
              type="submit"
              className="hiyaghar-newsletter-submit-btn"
              disabled={status === 'loading'}
            >
              <span>{status === 'loading' ? 'Joining...' : 'Subscribe'}</span>
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
            </button>
          </div>

          {status === 'error' && (
            <p id="newsletter-error-text" className="hiyaghar-newsletter-error-msg" role="alert">
              {errorMsg}
            </p>
          )}

          <p className="hiyaghar-newsletter-privacy">{retentionConfig.newsletterPrivacy}</p>
        </form>
      )}
    </div>
  );
};
