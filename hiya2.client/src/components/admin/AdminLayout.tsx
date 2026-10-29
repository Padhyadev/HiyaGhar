import React, { useState, useMemo, useEffect } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { MenuIcon } from '../../utils/iconUtils';
import { showToast } from '../../utils/alertService';
import './AdminLayout.css';
import { LOGO_URL } from '../../utils/brand';
import '../../pages/Admin/RoleManagementPage.css'

interface AdminNavSubItem {
  key: string;
  name: string;
  hash: string;
  icon: string;
  displayOrder?: number;
}

interface AdminNavGroup {
  key: string;
  name: string;
  icon: string;
  displayOrder: number;
  hash?: string;
  children?: AdminNavSubItem[];
}



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

  // Accordion: only one parent group open at a time; all closed by default.
  const [openGroup, setOpenGroup] = useState<string | null>(null);

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

  const authorizedNavGroups = useMemo<AdminNavGroup[]>(() => {
    const isSuperAdmin = user?.roles?.some((r) => r.roleCode === 'SUPER_ADMIN' || r.roleName === 'Super Admin') ?? false;
    const canSee = (k: string) => isSuperAdmin || hasPermission(k, 'canView');

    const catalogChildren: AdminNavSubItem[] = [
      { key: 'PRODUCT', name: 'Products', hash: '/admin/products', icon: 'fa-solid fa-box', displayOrder: 1 },
      { key: 'CATEGORY', name: 'Categories', hash: '/admin/categories', icon: 'fa-solid fa-tags', displayOrder: 2 },
      { key: 'ATTRIBUTE', name: 'Attributes', hash: '/admin/attributes', icon: 'fa-solid fa-sliders', displayOrder: 3 },
      { key: 'COMBOPACK', name: 'Combos', hash: '/admin/combo-packs', icon: 'fa-solid fa-boxes-packing', displayOrder: 4 },
      { key: 'GIFTHAMPER', name: 'Gift Hampers', hash: '/admin/gift-hampers', icon: 'fa-solid fa-gift', displayOrder: 5 },
      { key: 'STOCK', name: 'Stock & Inventory', hash: '/admin/stock', icon: 'fa-solid fa-boxes-stacked', displayOrder: 6 },
    ].filter((c) => canSee(c.key) || canSee(c.key.replace(/_/g, '')));

    const ordersChildren: AdminNavSubItem[] = [
      { key: 'ORDER', name: 'Order Management', hash: '/admin/orders', icon: 'fa-solid fa-box-open', displayOrder: 1 },
      { key: 'DELIVERY_PINCODE', name: 'Delivery Pincodes', hash: '/admin/delivery-pincodes', icon: 'fa-solid fa-map-location-dot', displayOrder: 2 },
      { key: 'SHIPPING', name: 'Store Settings', hash: '/admin/shipping', icon: 'fa-solid fa-sliders', displayOrder: 3 },
    ].filter((c) => canSee(c.key) || canSee(c.key.replace(/_/g, '')));

    const customersChildren: AdminNavSubItem[] = [
      { key: 'CUSTOMER', name: 'Customers', hash: '/admin/customers', icon: 'fa-solid fa-users', displayOrder: 1 },
      { key: 'REVIEW', name: 'Customer Reviews', hash: '/admin/reviews', icon: 'fa-solid fa-star', displayOrder: 2 },
      { key: 'CONTACT_QUERY', name: 'Contact Inquiries', hash: '/admin/contact-queries', icon: 'fa-solid fa-envelope-open-text', displayOrder: 3 },
    ].filter((c) => canSee(c.key) || canSee(c.key.replace(/_/g, '')));

    const marketingChildren: AdminNavSubItem[] = [
      { key: 'COUPON', name: 'Coupons & Vouchers', hash: '/admin/coupons', icon: 'fa-solid fa-ticket', displayOrder: 1 },
      { key: 'REWARD', name: 'Reward Coins', hash: '/admin/reward-slabs', icon: 'fa-solid fa-coins', displayOrder: 2 },
    ].filter((c) => canSee(c.key) || canSee(c.key.replace(/_/g, '')));

    const contentChildren: AdminNavSubItem[] = [
      { key: 'HOMEPAGECOMPONENT', name: 'Homepage Banners', hash: '/admin/homepage-components', icon: 'fa-solid fa-puzzle-piece', displayOrder: 1 },
      { key: 'FAQ', name: 'FAQ Management', hash: '/admin/faqs', icon: 'fa-solid fa-circle-question', displayOrder: 2 },
    ].filter((c) => canSee(c.key) || canSee(c.key.replace(/_/g, '')));

    const systemChildren: AdminNavSubItem[] = [
      { key: 'USER', name: 'Users', hash: '/admin/users', icon: 'fa-solid fa-user', displayOrder: 1 },
      { key: 'ROLE', name: 'Roles & Permissions', hash: '/admin/roles', icon: 'fa-solid fa-user-shield', displayOrder: 2 },
      { key: 'MENU', name: 'Menu Registry', hash: '/admin/menus', icon: 'fa-solid fa-bars', displayOrder: 3 },
      { key: 'LOV', name: 'Dropdown Masters', hash: '/admin/lov', icon: 'fa-solid fa-list-check', displayOrder: 4 },
    ].filter((c) => canSee(c.key) || canSee(c.key.replace(/_/g, '')));

    const groups: AdminNavGroup[] = [
      {
        key: 'DASHBOARD',
        name: 'Dashboard',
        hash: '/admin/dashboard',
        icon: 'fa-solid fa-chart-line',
        displayOrder: 0,
      },
    ];

    if (catalogChildren.length > 0) {
      groups.push({
        key: 'CATALOG_GROUP',
        name: 'Catalog & Inventory',
        icon: 'fa-solid fa-boxes-stacked',
        displayOrder: 1,
        children: catalogChildren,
      });
    }

    if (ordersChildren.length > 0) {
      groups.push({
        key: 'ORDERS_GROUP',
        name: 'Orders & Logistics',
        icon: 'fa-solid fa-truck-fast',
        displayOrder: 2,
        children: ordersChildren,
      });
    }

    if (customersChildren.length > 0) {
      groups.push({
        key: 'CUSTOMERS_GROUP',
        name: 'Customers & Inquiries',
        icon: 'fa-solid fa-users-gear',
        displayOrder: 3,
        children: customersChildren,
      });
    }

    if (marketingChildren.length > 0) {
      groups.push({
        key: 'MARKETING_GROUP',
        name: 'Marketing & Promotions',
        icon: 'fa-solid fa-bullhorn',
        displayOrder: 4,
        children: marketingChildren,
      });
    }

    if (contentChildren.length > 0) {
      groups.push({
        key: 'CONTENT_GROUP',
        name: 'Website & Content',
        icon: 'fa-solid fa-globe',
        displayOrder: 5,
        children: contentChildren,
      });
    }

    if (systemChildren.length > 0) {
      groups.push({
        key: 'SYSTEM_GROUP',
        name: 'System & Security',
        icon: 'fa-solid fa-shield-halved',
        displayOrder: 6,
        children: systemChildren,
      });
    }

    return groups.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [permissions, hasPermission, user]);

  const cleanCurrentRoute = currentHash.replace(/^#\/?/, '/');

  // Open the group that contains the current page, so the active menu is visible after navigation.
  const activeGroupKey = authorizedNavGroups.find((g) =>
    g.children?.some((c) => cleanCurrentRoute.includes(c.hash))
  )?.key;
  useEffect(() => {
    if (activeGroupKey) setOpenGroup(activeGroupKey);
  }, [activeGroupKey, cleanCurrentRoute]);

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
            <img src={LOGO_URL} alt="HIYA" className="hiyaghar-topbar-logo" />
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
            {authorizedNavGroups.map((group) => {
              // 1. Standalone Top-Level Menu (e.g. Dashboard)
              if (!group.children || group.children.length === 0) {
                const isActive =
                  cleanCurrentRoute.includes(group.hash!) ||
                  (group.hash === '/admin/dashboard' &&
                    (cleanCurrentRoute === '/admin' || cleanCurrentRoute === '/admin/dashboard'));
                return (
                  <button
                    key={group.key}
                    type="button"
                    role="link"
                    className={`hiyaghar-nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      if (group.hash) onNavigate(group.hash);
                      setMobileOpen(false);
                    }}
                  >
                    <span className="hiyaghar-nav-icon">
                      <MenuIcon icon={group.icon} menuKey={group.key} />
                    </span>
                    <span className="hiyaghar-nav-text">{group.name}</span>
                  </button>
                );
              }

              // 2. Parent Menu with Accordion Submenu
              const isOpen = openGroup === group.key;
              const hasActiveChild = group.children.some((c) => cleanCurrentRoute.includes(c.hash));

              return (
                <div
                  key={group.key}
                  className={`hiyaghar-nav-group-wrapper ${hasActiveChild ? 'has-active-child' : ''} ${isOpen ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className={`hiyaghar-nav-group-btn ${hasActiveChild ? 'is-active' : ''}`}
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        setOpenGroup(group.key);
                      } else {
                        setOpenGroup((prev) => (prev === group.key ? null : group.key));
                      }
                    }}
                    title={group.name}
                    aria-expanded={isOpen}
                  >
                    <div className="hiyaghar-nav-group-left">
                      <span className="hiyaghar-nav-icon">
                        <MenuIcon icon={group.icon} menuKey={group.key} />
                      </span>
                      <span className="hiyaghar-nav-text">{group.name}</span>
                    </div>
                    <span className={`hiyaghar-nav-chevron ${isOpen ? 'is-open' : ''}`} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                    </span>
                  </button>

                  {/* Always rendered so it can slide open/closed; hidden from tab order while closed */}
                  <div className={`hiyaghar-nav-submenu-wrap ${isOpen && !collapsed ? 'is-open' : ''}`}>
                    <div className="hiyaghar-nav-submenu" role="region" aria-label={group.name} inert={!isOpen || collapsed}>
                      {group.children.map((child) => {
                        const isChildActive = cleanCurrentRoute.includes(child.hash);
                        return (
                          <button
                            key={child.key}
                            type="button"
                            role="link"
                            className={`hiyaghar-nav-sublink ${isChildActive ? 'is-active' : ''}`}
                            onClick={() => {
                              onNavigate(child.hash);
                              setMobileOpen(false);
                            }}
                            title={child.name}
                            aria-current={isChildActive ? 'page' : undefined}
                          >
                            <span className="hiyaghar-nav-sub-icon">
                              <MenuIcon icon={child.icon} menuKey={child.key} />
                            </span>
                            <span className="hiyaghar-nav-sub-text">{child.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
