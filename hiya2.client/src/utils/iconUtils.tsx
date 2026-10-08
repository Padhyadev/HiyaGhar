import React from 'react';

const KNOWN_ICON_MAP: Record<string, string> = {
  Users: 'fa-solid fa-user',
  ShieldCheck: 'fa-solid fa-user-shield',
  Package: 'fa-solid fa-box',
  Layers: 'fa-solid fa-bars',
  UserCheck: 'fa-solid fa-users',
  FolderTree: 'fa-solid fa-tags',
  Tags: 'fa-solid fa-sliders',
  HomePageComponent: 'fa-solid fa-puzzle-piece',
  Dashboard: 'fa-solid fa-chart-line',

  USER: 'fa-solid fa-user',
  ROLE: 'fa-solid fa-user-shield',
  PRODUCT: 'fa-solid fa-box',
  MENU: 'fa-solid fa-bars',
  CUSTOMER: 'fa-solid fa-users',
  CATEGORY: 'fa-solid fa-tags',
  ATTRIBUTE: 'fa-solid fa-sliders',
  HOMEPAGECOMPONENT: 'fa-solid fa-puzzle-piece',
  HOMEPAGE_COMPONENT: 'fa-solid fa-puzzle-piece',
  TESTMENU: 'fa-solid fa-puzzle-piece',
  DASHBOARD: 'fa-solid fa-chart-line',
};

/**
 * Normalizes an API icon string or menu key into a valid Font Awesome 6 class name.
 * Priority:
 * 1. Explicit Font Awesome class string (e.g. 'fa-solid fa-user')
 * 2. Mapped legacy name or menu key
 * 3. Sensible fallback ('fa-solid fa-cube')
 */
export function getMenuIconClass(rawIcon?: string, menuKey?: string): string {
  if (rawIcon && rawIcon.trim()) {
    const icon = rawIcon.trim();
    if (
      icon.startsWith('fa-') ||
      icon.includes(' fa-') ||
      icon.startsWith('fas ') ||
      icon.startsWith('far ') ||
      icon.startsWith('fab ')
    ) {
      return icon.includes(' ') ? icon : `fa-solid ${icon}`;
    }
    if (KNOWN_ICON_MAP[icon]) {
      return KNOWN_ICON_MAP[icon];
    }
  }

  if (menuKey) {
    const key = menuKey.toUpperCase().replace(/\s+/g, '_');
    if (KNOWN_ICON_MAP[key]) {
      return KNOWN_ICON_MAP[key];
    }
  }

  if (rawIcon && rawIcon.trim()) {
    const kebab = rawIcon.trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    return `fa-solid fa-${kebab}`;
  }

  return 'fa-solid fa-cube';
}

interface MenuIconProps {
  icon?: string;
  menuKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable MenuIcon component for rendering Font Awesome dynamic menu icons.
 * Never renders class name text, only the actual <i> icon element.
 */
export const MenuIcon: React.FC<MenuIconProps> = ({ icon, menuKey, className = '', style }) => {
  const iconClass = getMenuIconClass(icon, menuKey);
  return <i className={`${iconClass} ${className}`.trim()} style={style} aria-hidden="true" />;
};
