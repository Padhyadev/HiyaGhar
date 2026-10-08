import React, { useEffect, useState } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { AdminLoginPage } from '../../pages/Admin/AdminLoginPage';

interface RequireAdminAuthProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const RequireAdminAuth: React.FC<RequireAdminAuthProps> = ({ onLoginSuccess, onNavigateHome, children }) => {
  const [authenticated, setAuthenticated] = useState(() => AdminAuthService.isAuthenticated());

  useEffect(() => {
    // On mount: local token check only (no network call, no server polling)
    if (!AdminAuthService.isAuthenticated()) {
      setAuthenticated(false);
    }

    // React to explicit logout() calls (clears localStorage → fires listener)
    const unsubscribe = AdminAuthService.subscribe(() => {
      setAuthenticated(AdminAuthService.isAuthenticated());
    });

    return () => {
      unsubscribe();
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
