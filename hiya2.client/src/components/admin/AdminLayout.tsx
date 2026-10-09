import React, { useState, useMemo } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { MenuIcon, getMenuIconClass } from '../../utils/iconUtils';
import { showToast } from '../../utils/alertService';
import './AdminLayout.css';
import '../../pages/Admin/RoleManagementPage.css'

interface AdminNavItem {
  key: string;
  name: string;
  hash: string;
  icon: string;
  displayOrder?: number;
}

const ROUTE_DICTIONARY: Record<string, string> = {
  DASHBOARD: '/admin/dashboard',
  USER: '/admin/users',
  ROLE: '/admin/roles',
  PRODUCT: '/admin/products',
  MENU: '/admin/menus',
  CUSTOMER: '/admin/customers',
  CATEGORY: '/admin/categories',
  ATTRIBUTE: '/admin/attributes',
  HOMEPAGECOMPONENT: '/admin/homepage-components',
  HOMEPAGE_COMPONENT: '/admin/homepage-components',
  GIFTHAMPER: '/admin/gift-hampers',
  ORDER: '/admin/orders',
  SHIPPING: '/admin/shipping',
  SHIPPING_SETTINGS: '/admin/shipping',
  COMBOPACK: '/admin/combo-packs',
  COMBO_PACK: '/admin/combo-packs',
  LOV: '/admin/lov',
  STOCK: '/admin/stock',
  STOCKSETTING: '/admin/stock-settings',
  REWARD: '/admin/reward-slabs',
  COUPON: '/admin/coupons',
  REVIEW: '/admin/reviews',
  CONTACT_QUERY: '/admin/contact-queries',
  CONTACTQUERY: '/admin/contact-queries',
  CONTACT_QUERIES: '/admin/contact-queries',
  FAQ: '/admin/faqs',
  FAQ_MANAGEMENT: '/admin/faqs',
  TESTMENU: '/admin/test-menu',
  TEST_MENU: '/admin/test-menu',
};

interface AdminLayoutProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentHash,
  onNavigate,
  onLogout,
  children,
}) => {
  const user = AdminAuthService.getUser();
  const { permissions, hasPermission } = usePermission();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const handleOpenPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
    setIsPasswordModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newPassword) {
      errors.newPassword = 'Please enter new password';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Please enter at least 8 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please enter confirm password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Please enter matching confirm password';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});

    setPasswordLoading(true);
    const res = await AdminAuthService.changePassword('', newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setIsPasswordModalOpen(false);
      showToast('Password changed successfully!', 'success');
    } else {
      setPasswordErrors({ form: res.message || 'Failed to change password' });
    }
  };

  const authorizedNavItems = useMemo(() => {
    const items: AdminNavItem[] = [
      { key: 'DASHBOARD', name: 'Dashboard', hash: '/admin/dashboard', icon: 'fa-solid fa-chart-line', displayOrder: 0 },
    ];

    const addedKeys = new Set<string>(['DASHBOARD']);

    Object.keys(permissions).forEach((rawKey) => {
      const key = rawKey.toUpperCase().replace(/\s+/g, '_');
      if (addedKeys.has(key)) return;

      const perm = permissions[rawKey];
      if (hasPermission(key, 'canView')) {
        addedKeys.add(key);

        const isShipping = key === 'SHIPPING' || key === 'SHIPPING_SETTINGS';
        const isLov = key === 'LOV' || key === 'LIST_OF_VALUES';
        const name = isShipping
          ? 'Store Settings'
          : isLov
          ? 'Dropdown & Status Master'
          : (perm.menuName || rawKey);
        const icon = isShipping
          ? 'fa-solid fa-sliders'
          : isLov
          ? 'fa-solid fa-list-check'
          : getMenuIconClass(perm.icon, key);
        const hash = ROUTE_DICTIONARY[key] || `/admin/${key.toLowerCase().replace(/_/g, '-')}`;
        const displayOrder = perm.displayOrder ?? 99;

        items.push({
          key,
          name,
          hash,
          icon,
          displayOrder,
        });
      }
    });

    const isSuperAdmin = user?.roles?.some((r) => r.roleCode === 'SUPER_ADMIN' || r.roleName === 'Super Admin') ?? false;
    
    // Always include core modules for Super Admin or when accessible
    if (isSuperAdmin || hasPermission('SHIPPING', 'canView')) {
      if (!addedKeys.has('SHIPPING')) {
        addedKeys.add('SHIPPING');
        items.push({
          key: 'SHIPPING',
          name: 'Store Settings',
          hash: '/admin/shipping',
          icon: 'fa-solid fa-sliders',
          displayOrder: 11,
        });
      }
    }

    if (isSuperAdmin || hasPermission('COMBOPACK', 'canView') || hasPermission('COMBO_PACK', 'canView')) {
      if (!addedKeys.has('COMBOPACK')) {
        addedKeys.add('COMBOPACK');
        items.push({
          key: 'COMBOPACK',
          name: 'Combo Packs',
          hash: '/admin/combo-packs',
          icon: 'fa-solid fa-boxes-packing',
          displayOrder: 12,
        });
      }
    }

    if (isSuperAdmin || hasPermission('COUPON', 'canView')) {
      if (!addedKeys.has('COUPON')) {
        addedKeys.add('COUPON');
        items.push({
          key: 'COUPON',
          name: 'Coupons & Vouchers',
          hash: '/admin/coupons',
          icon: 'fa-solid fa-ticket',
          displayOrder: 13,
        });
      }
    }

    if (isSuperAdmin || hasPermission('CONTACT_QUERY', 'canView') || hasPermission('CONTACTQUERY', 'canView')) {
      if (!addedKeys.has('CONTACT_QUERY')) {
        addedKeys.add('CONTACT_QUERY');
        items.push({
          key: 'CONTACT_QUERY',
          name: 'Contact Inquiries',
          hash: '/admin/contact-queries',
          icon: 'fa-solid fa-envelope-open-text',
          displayOrder: 13.5,
        });
      }
    }

    if (isSuperAdmin || hasPermission('FAQ', 'canView') || hasPermission('FAQ_MANAGEMENT', 'canView')) {
      if (!addedKeys.has('FAQ')) {
        addedKeys.add('FAQ');
        items.push({
          key: 'FAQ',
          name: 'FAQ Management',
          hash: '/admin/faqs',
          icon: 'fa-solid fa-circle-question',
          displayOrder: 13.8,
        });
      }
    }

    if (isSuperAdmin && Object.keys(permissions).length <= 1) {
      const superDefaults: AdminNavItem[] = [
        { key: 'USER', name: 'User', hash: '/admin/users', icon: 'fa-solid fa-user', displayOrder: 1 },
        { key: 'ROLE', name: 'Role', hash: '/admin/roles', icon: 'fa-solid fa-user-shield', displayOrder: 2 },
        { key: 'PRODUCT', name: 'Product', hash: '/admin/products', icon: 'fa-solid fa-box', displayOrder: 3 },
        { key: 'MENU', name: 'Menu', hash: '/admin/menus', icon: 'fa-solid fa-bars', displayOrder: 4 },
        { key: 'CUSTOMER', name: 'Customer', hash: '/admin/customers', icon: 'fa-solid fa-users', displayOrder: 5 },
        { key: 'CATEGORY', name: 'Category', hash: '/admin/categories', icon: 'fa-solid fa-tags', displayOrder: 6 },
        { key: 'ATTRIBUTE', name: 'Attribute', hash: '/admin/attributes', icon: 'fa-solid fa-sliders', displayOrder: 7 },
        { key: 'HOMEPAGECOMPONENT', name: 'HomePageComponent', hash: '/admin/homepage-components', icon: 'fa-solid fa-puzzle-piece', displayOrder: 8 },
        { key: 'GIFTHAMPER', name: 'Gift Hampers', hash: '/admin/gift-hampers', icon: 'fa-solid fa-gift', displayOrder: 9 },
        { key: 'ORDER', name: 'Orders', hash: '/admin/orders', icon: 'fa-solid fa-box-open', displayOrder: 10 },
        { key: 'SHIPPING', name: 'Store Settings', hash: '/admin/shipping', icon: 'fa-solid fa-sliders', displayOrder: 11 },
        { key: 'COMBOPACK', name: 'Combo Packs', hash: '/admin/combo-packs', icon: 'fa-solid fa-boxes-packing', displayOrder: 12 },
        { key: 'COUPON', name: 'Coupons & Vouchers', hash: '/admin/coupons', icon: 'fa-solid fa-ticket', displayOrder: 13 },
        { key: 'CONTACT_QUERY', name: 'Contact Inquiries', hash: '/admin/contact-queries', icon: 'fa-solid fa-envelope-open-text', displayOrder: 13.5 },
        { key: 'FAQ', name: 'FAQ Management', hash: '/admin/faqs', icon: 'fa-solid fa-circle-question', displayOrder: 13.8 },
        { key: 'LOV', name: 'Dropdown & Status Master', hash: '/admin/lov', icon: 'fa-solid fa-list-check', displayOrder: 14 },
      ];

      superDefaults.forEach((def) => {
        if (!addedKeys.has(def.key)) {
          addedKeys.add(def.key);
          items.push(def);
        }
      });
    }

    return items.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
  }, [permissions, hasPermission, user]);

  const cleanCurrentRoute = currentHash.replace(/^#\/?/, '/');

  return (
    <div className={`hiyaghar-admin-layout ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <header className="hiyaghar-admin-topbar">
        <div className="hiyaghar-topbar-left">
          <button
            type="button"
            className="hiyaghar-sidebar-toggle"
            onClick={() => {
              if (window.innerWidth <= 768) {
                setMobileOpen(!mobileOpen);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            title="Toggle Sidebar"
          >
            ☰
          </button>
          <div className="hiyaghar-topbar-brand" onClick={() => onNavigate('/admin/dashboard')}>
            <img src="/image/HIYA LOGO (1).png" alt="HIYA" className="hiyaghar-topbar-logo" />
          </div>
        </div>

        <div className="hiyaghar-topbar-right">
          <button
            type="button"
            className="hiyaghar-store-btn"
            onClick={() => onNavigate('/')}
            title="View Live Store"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>View Storefront</span>
          </button>

          <button
            type="button"
            className="hiyaghar-user-badge"
            onClick={handleOpenPasswordModal}
            title="Admin Profile & Change Password"
            aria-label="Admin Profile and Change Password"
          >
            <div className="hiyaghar-user-avatar">
              {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
            </div>
            <div className="hiyaghar-user-details">
              <span className="hiyaghar-user-name">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator'}
              </span>
              <span className="hiyaghar-user-role">
                {user?.roles && user.roles.length > 0 ? user.roles[0].roleName : 'Super Admin'}
              </span>
            </div>
          </button>

          <button
            type="button"
            className="hiyaghar-admin-logout-btn"
            onClick={onLogout}
            title="Sign Out"
          >
            <span>Logout</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="hiyaghar-sidebar-backdrop" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      <div className="hiyaghar-admin-body">
        <aside className={`hiyaghar-admin-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}>
          <div className="hiyaghar-sidebar-header-mobile">
            <span className="hiyaghar-sidebar-section-title" style={{ padding: '12px 16px' }}>MANAGEMENT MODULES</span>
            <button 
              type="button" 
              className="hiyaghar-sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="hiyaghar-sidebar-nav">
            {authorizedNavItems.map((item) => {
              const isActive =
                cleanCurrentRoute.includes(item.hash) ||
                (item.hash === '/admin/dashboard' &&
                  (cleanCurrentRoute === '/admin' || cleanCurrentRoute === '/admin/dashboard'));
              return (
                <button
                  key={item.key}
                  type="button"
                  role="link"
                  className={`hiyaghar-nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    onNavigate(item.hash);
                    setMobileOpen(false);
                  }}
                >
                  <span className="hiyaghar-nav-icon">
                    <MenuIcon icon={item.icon} menuKey={item.key} />
                  </span>
                  <span className="hiyaghar-nav-text">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="hiyaghar-sidebar-footer">
            <p>© 2026 HIYAGHAR Security</p>
          </div>
        </aside>

        <main className="hiyaghar-admin-content">{children}</main>
      </div>

      {/* Admin Profile & Security Modal */}
      {isPasswordModalOpen && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div
            className="hiyaghar-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '94%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '18px',
              overflow: 'hidden',
            }}
          >
            <div className="hiyaghar-modal-header" style={{ padding: '16px 24px', background: '#FAF8F2', borderBottom: '1px solid #E8E2D3', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#D19A27', fontSize: '1.1rem' }}>
                  <i className="fa-solid fa-user-gear" aria-hidden="true"></i>
                </span>
                <h3 className="hiyaghar-modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>Admin Account Profile</h3>
              </div>
              <button
                type="button"
                className="hiyaghar-modal-close"
                onClick={() => setIsPasswordModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Container */}
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '10px' }}>
              {/* Admin Header Card */}
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, #FAF8F2 0%, #F5EFE0 100%)', borderBottom: '1px solid #E8E2D3' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D19A27', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(209, 154, 39, 0.25)', border: '2px solid #ffffff' }}>
                {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: '#10243E', fontSize: '1.1rem', lineHeight: 1.2 }}>
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator'}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#D19A27', color: '#ffffff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', marginTop: '4px' }}>
                  <i className="fa-solid fa-shield-halved" style={{ fontSize: '12px' }}></i>
                  {user?.roles && user.roles.length > 0 ? user.roles[0].roleName : 'Super Admin'}
                </div>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div style={{ padding: '18px 24px 10px 24px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Account Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>First Name</span>
                  <span style={{ fontSize: '0.9rem', color: '#10243E', fontWeight: 700 }}>{user?.firstName || '—'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Last Name</span>
                  <span style={{ fontSize: '0.9rem', color: '#10243E', fontWeight: 700 }}>{user?.lastName || '—'}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Email Address</span>
                  <span style={{ fontSize: '0.9rem', color: '#10243E', fontWeight: 700, wordBreak: 'break-all' }}>{user?.email || 'admin@hiyaghar.com'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Phone Number</span>
                  <span style={{ fontSize: '0.9rem', color: '#10243E', fontWeight: 700 }}>{user?.phone || '—'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Gender</span>
                  <span style={{ fontSize: '0.9rem', color: '#10243E', fontWeight: 700 }}>{user?.gender || '—'}</span>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePasswordSubmit} className="hiyaghar-modal-body" style={{ padding: '10px 24px 20px 24px' }} noValidate>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '8px 0 12px 0' }}>
                Security & Change Password
              </div>
              {passwordErrors.form && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  {passwordErrors.form}
                </div>
              )}

              <div className="hiyaghar-form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>New Password *</label>
                <div className="hiyaghar-password-wrapper">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    className={passwordErrors.newPassword ? 'input-error' : ''}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.newPassword) setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="hiyaghar-password-toggle-btn"
                    onClick={() => setShowNewPass(!showNewPass)}
                    title={showNewPass ? 'Hide password' : 'Show password'}
                  >
                    {showNewPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && <span className="hiyaghar-field-error">{passwordErrors.newPassword}</span>}
              </div>

              <div className="hiyaghar-form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Confirm New Password *</label>
                <div className="hiyaghar-password-wrapper">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className={passwordErrors.confirmPassword ? 'input-error' : ''}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirmPassword) setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="hiyaghar-password-toggle-btn"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    title={showConfirmPass ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && <span className="hiyaghar-field-error">{passwordErrors.confirmPassword}</span>}
              </div>

              <div className="hiyaghar-modal-footer" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="hiyaghar-btn-cancel"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hiyaghar-btn-submit"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
