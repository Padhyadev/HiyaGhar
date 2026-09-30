import React from 'react';

interface DynamicIconProps {
  icon?: string;
  menuKey?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  icon = '',
  menuKey = '',
  size = 20,
  color,
  style,
  className = '',
}) => {
  const rawIcon = (icon || '').trim();
  const normKey = (menuKey || '').toUpperCase().replace(/\s+/g, '_');
  const normIcon = rawIcon.toLowerCase();

  const getFaClass = (str: string) => {
    if (!str) return 'fa-solid fa-list-check';
    if (str.startsWith('fa-') || str.includes(' fa-') || str.startsWith('fas ') || str.startsWith('far ') || str.startsWith('fab ')) {
      return str.includes(' ') ? str : `fa-solid ${str}`;
    }
    const kebab = str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    return `fa-solid fa-${kebab}`;
  };

  if (rawIcon && (rawIcon.startsWith('fa-') || rawIcon.includes(' fa-') || rawIcon.startsWith('fas ') || rawIcon.startsWith('far ') || rawIcon.startsWith('fab '))) {
    return (
      <i
        className={`${getFaClass(rawIcon)} ${className}`}
        style={{
          fontSize: `${size}px`,
          color: color || '#3b82f6',
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style,
        }}
      />
    );
  }

  let type = 'default';
  let defaultColor = '#64748b';

  if (
    (normKey.includes('USER') && !normKey.includes('ROLE') && !normKey.includes('CUSTOMER')) ||
    normIcon === 'user' || normIcon === 'users'
  ) {
    type = 'user';
    defaultColor = '#3b82f6';
  } else if (
    normKey.includes('ROLE') || normIcon.includes('shield') || normIcon === 'shieldcheck'
  ) {
    type = 'role';
    defaultColor = '#22c55e';
  } else if (
    normKey.includes('PRODUCT') || normIcon.includes('box') || normIcon.includes('cube') || normIcon === 'package'
  ) {
    type = 'product';
    defaultColor = '#f97316';
  } else if (
    normKey.includes('MENU') || normIcon.includes('bars') || normIcon.includes('list') || normIcon.includes('layer') || normIcon === 'layers'
  ) {
    type = 'menu';
    defaultColor = '#8b5cf6';
  } else if (
    normKey.includes('CUSTOMER') || normIcon.includes('users') || normIcon.includes('group') || normIcon === 'usercheck'
  ) {
    type = 'customer';
    defaultColor = '#ec4899';
  } else if (
    normKey.includes('CATEGORY') || normIcon.includes('tag') || normIcon.includes('folder') || normIcon === 'foldertree'
  ) {
    type = 'category';
    defaultColor = '#3b82f6';
  } else if (
    normKey.includes('ATTRIBUTE') || normIcon.includes('slider') || normIcon === 'tags'
  ) {
    type = 'attribute';
    defaultColor = '#14b8a6';
  } else if (
    normKey.includes('HOMEPAGE') || normIcon.includes('puzzle') || normIcon.includes('component')
  ) {
    type = 'homepage';
    defaultColor = '#6366f1';
  } else if (
    normKey.includes('TEST') || normIcon.includes('vial') || normIcon.includes('flask')
  ) {
    type = 'test';
    defaultColor = '#a855f7';
  } else if (
    normKey.includes('DASHBOARD') || normIcon.includes('chart')
  ) {
    type = 'dashboard';
    defaultColor = '#3b82f6';
  }

  const activeColor = color || defaultColor;

  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: activeColor,
    strokeWidth: '2',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { display: 'inline-block', verticalAlign: 'middle', ...style },
    className,
  };

  switch (type) {
    case 'user':
      return (
        <svg {...svgProps}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'role':
      return (
        <svg {...svgProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="10" r="2.5" />
          <path d="M9.5 16c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5" />
        </svg>
      );
    case 'product':
      return (
        <svg {...svgProps}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...svgProps}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill={activeColor} />
          <circle cx="4" cy="12" r="1.5" fill={activeColor} />
          <circle cx="4" cy="18" r="1.5" fill={activeColor} />
        </svg>
      );
    case 'customer':
      return (
        <svg {...svgProps}>
          <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M9 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'category':
      return (
        <svg {...svgProps}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case 'attribute':
      return (
        <svg {...svgProps}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case 'homepage':
      return (
        <svg {...svgProps}>
          <path d="M19.439 7.85c-.049-.322.059-.648.289-.878l1.568-1.568c.47-.47.706-1.087.706-1.704s-.235-1.235-.706-1.706c-.941-.941-2.468-.941-3.41 0l-1.567 1.567c-.23.23-.556.338-.878.29-1.218-.184-2.483.056-3.493.687l-.988-.988c.23-.23.338-.556.29-.878-.184-1.218.056-2.483.687-3.493l-1.568-1.568c-.941-.941-2.468-.941-3.41 0s-.941 2.469 0 3.41l1.567 1.567c.23.23.338.556.29.878-.184 1.218.056 2.483.687 3.493l-.988.988c-.23-.23-.556-.338-.878-.29-1.218.184-2.483-.056-3.493-.687l-1.568 1.568c-.941.941-.941 2.469 0 3.41s2.469.941 3.41 0l1.567-1.567c.23-.23.556-.338.878-.29 1.218.184 2.483-.056 3.493.687l.988.988c-.23.23-.338.556-.29.878.184 1.218-.056 2.483-.687 3.493l1.568 1.568c.47.47 1.087.706 1.704.706s1.235-.235 1.706-.706c.941-.941.941-2.469 0-3.41l-1.567-1.567c-.23-.23-.338-.556-.29-.878.184-1.218-.056-2.483-.687-3.493l.988-.988c.23.23.556.338.878.29 1.218-.184 2.483.056 3.493-.687z" />
        </svg>
      );
    case 'test':
      return (
        <svg {...svgProps}>
          <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
          <line x1="8.5" y1="2" x2="15.5" y2="2" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      );
    default:
      if (rawIcon) {
        return (
          <i
            className={`${getFaClass(rawIcon)} ${className}`}
            style={{ fontSize: `${size}px`, color: activeColor, ...style }}
          />
        );
      }
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
  }
};
