import React, { useState } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { showToast } from '../../utils/alertService';
import './AdminLoginPage.css';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

// Inline SVG (not emoji) so the icon renders identically on every PC/browser
const EyeIcon: React.FC<{ open: boolean }> = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a17.7 17.7 0 0 1-3.16 4.4M6.61 6.61C3.87 8.36 2 12 2 12s4 8 11 8a9.1 9.1 0 0 0 4.24-1.02" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState<string>(() => localStorage.getItem('hiyaghar_admin_remember_email') || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => localStorage.getItem('hiyaghar_admin_remember_me') === 'true');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Please enter email';
    } else if (!email.includes('@')) {
      errors.email = 'Please enter valid email';
    }

    if (!password) {
      errors.password = 'Please enter password';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    if (rememberMe) {
      localStorage.setItem('hiyaghar_admin_remember_email', email.trim());
      localStorage.setItem('hiyaghar_admin_remember_me', 'true');
    } else {
      localStorage.removeItem('hiyaghar_admin_remember_email');
      localStorage.removeItem('hiyaghar_admin_remember_me');
    }

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

        showToast('Login successfully', 'success');
        onLoginSuccess();
      } else {
        setErrorMsg(res.message || 'Invalid admin credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
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

        <form onSubmit={handleSubmit} className="hiyaghar-admin-login-form" noValidate autoComplete="off">
          <div className="hiyaghar-form-field">
            <label htmlFor="admin_user_email">Admin Email Address</label>
            <input
              id="admin_user_email"
              type="email"
              name="admin_user_email"
              autoComplete="email"
              placeholder="e.g. admin@hiyaghar.com"
              value={email}
              className={formErrors.email ? 'input-error' : ''}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
              }}
            />
            {formErrors.email && <span className="hiyaghar-field-error">{formErrors.email}</span>}
          </div>

          <div className="hiyaghar-form-field">
            <label htmlFor="admin_user_password">Password</label>
            <div className="hiyaghar-admin-password-wrapper">
              <input
                id="admin_user_password"
                type={showPassword ? 'text' : 'password'}
                name="admin_user_password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                className={formErrors.password ? 'input-error' : ''}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }));
                }}
              />
              <button
                type="button"
                className="hiyaghar-admin-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {formErrors.password && <span className="hiyaghar-field-error">{formErrors.password}</span>}
          </div>

          <div className="hiyaghar-admin-remember-row">
            <label htmlFor="admin_remember_me" className="hiyaghar-admin-remember-label">
              <input
                id="admin_remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="hiyaghar-admin-remember-checkbox"
                aria-label="Remember me"
              />
              <span>Remember me</span>
            </label>
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
