import React, { useState } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import './AdminLoginPage.css';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState<string>('admin@gmail.com');
  const [password, setPassword] = useState<string>('admin');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await AdminAuthService.loginApi(email, password);
      if (res && res.success && res.token) {
        try {
          const user = AdminAuthService.getUser();
          const permRes = await fetch(
            `/api/auth/menu-permissions?userId=${user?.userId || 0}`,
            { headers: AdminAuthService.getAuthHeaders() }
          );
          if (permRes.ok) {
            const permData = await permRes.json();
            if (permData && Array.isArray(permData.permissions)) {
              const permMap: Record<string, any> = {};
              permData.permissions.forEach((p: any) => {
                const rawKey = p.controller
                  ? p.controller.replace(/Controller$/i, '')
                  : p.menuName;
                const key = rawKey?.toUpperCase().replace(/\s+/g, '_');
                if (key) {
                  const hasAccess = !!(p.canView || p.canAdd || p.canEdit || p.canDelete);
                  permMap[key] = {
                    menuName: p.menuName,
                    icon: p.icon,
                    displayOrder: p.displayOrder,
                    controller: p.controller,
                    canView: p.canView ?? hasAccess,
                    canAdd: p.canAdd ?? hasAccess,
                    canEdit: p.canEdit ?? hasAccess,
                    canDelete: p.canDelete ?? hasAccess,
                    canExport: p.canExport ?? hasAccess,
                  };
                }
              });
              AdminAuthService.setPermissions(permMap);
            }
          }
        } catch (e) {
          console.warn('Note loading permissions:', e);
        }

        onLoginSuccess();
      } else {
        setErrorMsg(res.message || 'Invalid admin credentials. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hiyaghar-admin-login-page">
      <div className="hiyaghar-admin-login-card">
        <div className="hiyaghar-admin-login-header">
          <div className="hiyaghar-admin-brand" onClick={onNavigateHome}>
            <img src="/image/HIYA LOGO (1).png" alt="HIYA" className="hiyaghar-brand-icon" />
          </div>
          <p className="hiyaghar-admin-login-subtitle">Admin & Staff Portal Access</p>
        </div>

        {errorMsg && <div className="hiyaghar-admin-login-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="hiyaghar-admin-login-form">
          <div className="hiyaghar-form-field">
            <label>Admin Email Address</label>
            <input
              type="email"
              placeholder="e.g. vmgami33333@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="hiyaghar-form-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="hiyaghar-admin-login-submit"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div className="hiyaghar-admin-login-footer">
          <span onClick={onNavigateHome} className="hiyaghar-back-link">
            ← Back to HIYAGHAR Store
          </span>
        </div>
      </div>
    </div>
  );
};
