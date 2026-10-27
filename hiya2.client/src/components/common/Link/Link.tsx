import React from 'react';
import { navigateTo } from '../../../utils/navigation';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ to, children, onClick, ...props }) => {
  return (
    <a
      href={to}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          navigateTo(to);
        }
        if (onClick) onClick(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
};
