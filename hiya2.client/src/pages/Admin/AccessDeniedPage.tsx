import React from 'react';
import './AccessDeniedPage.css';

interface AccessDeniedPageProps {
  moduleName?: string;
  onNavigateDashboard?: () => void;
  onNavigateHome?: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  moduleName = 'this system module',
  onNavigateDashboard,
  onNavigateHome,
}) => {
  return (
    <div className="hiyaghar-denied-page">
      <div className="hiyaghar-denied-card">
        <div className="hiyaghar-denied-icon">🚫</div>
        <span className="hiyaghar-denied-code">HTTP 403 ACCESS DENIED</span>
        <h2>Permission Required</h2>
        <p>
          Your user account does not have authorization to view or manage{' '}
          <strong>{moduleName}</strong>.
        </p>
        <p className="hiyaghar-denied-subtext">
          Please contact a System Administrator to request permission updates in the Security & Role Management module.
        </p>

        <div className="hiyaghar-denied-actions">
          {onNavigateDashboard && (
            <button
              type="button"
              className="hiyaghar-btn-dashboard"
              onClick={onNavigateDashboard}
            >
              📊 Back to Admin Dashboard
            </button>
          )}
          {onNavigateHome && (
            <button
              type="button"
              className="hiyaghar-btn-home"
              onClick={onNavigateHome}
            >
              🏠 Go to Storefront
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
