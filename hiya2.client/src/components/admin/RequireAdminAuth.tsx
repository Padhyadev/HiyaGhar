import React, { useEffect, useState } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { AdminLoginPage } from '../../pages/Admin/AdminLoginPage';

interface RequireAdminAuthProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

// How often to re-check the token's expiry while an admin session sits open,
// so a session left idle past the token's lifetime gets bounced to login
// instead of silently failing every API call.
const TOKEN_CHECK_INTERVAL_MS = 30_000;

export const RequireAdminAuth: React.FC<RequireAdminAuthProps> = ({ onLoginSuccess, onNavigateHome, children }) => {
  const [authenticated, setAuthenticated] = useState(() => AdminAuthService.isAuthenticated());

  useEffect(() => {
    const checkAuth = () => setAuthenticated(AdminAuthService.isAuthenticated());

    const unsubscribe = AdminAuthService.subscribe(checkAuth);
    const intervalId = setInterval(checkAuth, TOKEN_CHECK_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  if (!authenticated) {
    return (
      <AdminLoginPage
        onLoginSuccess={() => {
          setAuthenticated(true);
          onLoginSuccess();
        }}
        onNavigateHome={onNavigateHome}
      />
    );
  }
  return <>{children}</>;
};
