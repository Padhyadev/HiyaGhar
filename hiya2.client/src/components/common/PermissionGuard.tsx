import React from 'react';
import { usePermission, type ActionPermissions } from '../../context/PermissionContext';

interface PermissionGuardProps {
  menuKey: string;
  action?: keyof ActionPermissions;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  menuKey,
  action,
  fallback = null,
  children,
}) => {
  const { hasPermission } = usePermission();

  if (!hasPermission(menuKey, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
