import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminAuthService } from '../services/adminAuthService';

export interface ActionPermissions {
  menuName?: string;
  icon?: string;
  displayOrder?: number;
  controller?: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export type PermissionsMap = Record<string, ActionPermissions>;

interface PermissionContextType {
  permissions: PermissionsMap;
  hasPermission: (menuKey: string, action?: keyof ActionPermissions) => boolean;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: {},
  hasPermission: () => false,
  refreshPermissions: () => {},
});

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionsMap>(AdminAuthService.getPermissions());

  const refreshPermissions = () => {
    setPermissions(AdminAuthService.getPermissions());
  };

  useEffect(() => {
    const unsub = AdminAuthService.subscribe(refreshPermissions);

    const syncPermissionsFromApi = async () => {
      if (!AdminAuthService.isAuthenticated()) return;
      try {
        const user = AdminAuthService.getUser();
        const res = await fetch(`/api/auth/menu-permissions?userId=${user?.userId || 0}`, {
          headers: AdminAuthService.getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.permissions)) {
            const permMap: Record<string, ActionPermissions> = {
              DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dashboard', displayOrder: 0, icon: 'fa-solid fa-chart-line' },
            };
            data.permissions.forEach((p: any) => {
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
            setPermissions(permMap);
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch menu permissions:', err);
      }
    };

    syncPermissionsFromApi();

    return () => {
      unsub();
    };
  }, []);

  const hasPermission = (menuKey: string, action: keyof ActionPermissions = 'canView'): boolean => {
    if (!menuKey) return true;
    const cleanKey = menuKey.toUpperCase().replace(/\s+/g, '_');
    const perm = permissions[cleanKey] || permissions[menuKey];
    
    // Check Super Admin fallback or permission object
    const user = AdminAuthService.getUser();
    const isSuperAdmin = user?.roles?.some(r => r.roleCode === 'SUPER_ADMIN' || r.roleName === 'Super Admin') ?? false;
    if (isSuperAdmin) return true;

    if (!perm) return false;
    if (action && typeof perm[action] === 'boolean') {
      return perm[action] as boolean;
    }
    return !!(perm.canView || perm.canAdd || perm.canEdit || perm.canDelete);
  };

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission, refreshPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (menuKey?: string) => {
  const ctx = useContext(PermissionContext);
  const hasAccess = menuKey ? ctx.hasPermission(menuKey) : true;
  
  const currentMenuPermission: ActionPermissions = hasAccess
    ? { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true }
    : { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false };

  return {
    permissions: ctx.permissions,
    hasPermission: ctx.hasPermission,
    currentMenuPermission,
  };
};
