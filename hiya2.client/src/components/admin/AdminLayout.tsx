import React, { useState, useMemo } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { MenuIcon, getMenuIconClass } from '../../utils/iconUtils';
import './AdminLayout.css';

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
  LOV: '/admin/lov',
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

        const name = perm.menuName || rawKey;
        const icon = getMenuIconClass(perm.icon);
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
        { key: 'LOV', name: 'List of Values', hash: '/admin/lov', icon: 'fa-solid fa-list', displayOrder: 11 },
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
    <div className={`hiyaghar-admin-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <header className="hiyaghar-admin-topbar">
        <div className="hiyaghar-topbar-left">
          <button
            type="button"
            className="hiyaghar-sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title="Toggle Sidebar"
          >
            ☰
          </button>
          <div className="hiyaghar-topbar-brand" onClick={() => onNavigate('/admin/dashboard')}>
            <img src="/image/HIYA LOGO (1).png" alt="HIYA" className="hiyaghar-topbar-logo" />
            <span className="hiyaghar-topbar-title">HIYAGHAR <small>ADMIN</small></span>
          </div>
        </div>

        <div className="hiyaghar-topbar-right">
          <button
            type="button"
            className="hiyaghar-store-btn"
            onClick={() => onNavigate('/')}
            title="View Live Store"
          >
            🏪 View Storefront
          </button>

          <div className="hiyaghar-user-badge">
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
          </div>

          <button
            type="button"
            className="hiyaghar-admin-logout-btn"
            onClick={onLogout}
            title="Sign Out"
          >
            Logout 🚪
          </button>
        </div>
      </header>

      <div className="hiyaghar-admin-body">
        <aside className="hiyaghar-admin-sidebar">
          <div className="hiyaghar-sidebar-section-title">MANAGEMENT MODULES</div>
          <nav className="hiyaghar-sidebar-nav">
            {authorizedNavItems.map((item) => {
              const isActive =
                cleanCurrentRoute.includes(item.hash) ||
                (item.hash === '/admin/dashboard' &&
                  (cleanCurrentRoute === '/admin' || cleanCurrentRoute === '/admin/dashboard'));
              return (
                <a
                  key={item.key}
                  href={item.hash}
                  className={`hiyaghar-nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.hash);
                  }}
                >
                  <span className="hiyaghar-nav-icon">
                    <MenuIcon icon={item.icon} menuKey={item.key} />
                  </span>
                  <span className="hiyaghar-nav-text">{permissions[item.key]?.menuName || item.name}</span>
                </a>
              );
            })}
          </nav>

          <div className="hiyaghar-sidebar-footer">
            <p>© 2026 HIYAGHAR Security</p>
          </div>
        </aside>

        <main className="hiyaghar-admin-content">{children}</main>
      </div>
    </div>
  );
};
