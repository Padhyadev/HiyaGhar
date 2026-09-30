import React from 'react';
import { navigateTo } from '../../../utils/navigation';
import { useSidebarCategories, getCategorySlug } from './useSidebarCategories';
import './PremiumSidebar.css';

export const PremiumSidebar: React.FC = () => {
  const categories = useSidebarCategories();
  const currentPath = window.location.pathname;

  return (
    <aside className="hiyaghar-premium-sidebar hiyaghar-premium-sidebar-desktop">
      <div className="hiyaghar-sidebar-section">
        <h3 className="hiyaghar-sidebar-title">Categories</h3>
        <ul className="hiyaghar-sidebar-list">
          {categories.map((cat) => {
            const slug = getCategorySlug(cat.categoryName);
            const isActive = currentPath === `/${slug}`;
            return (
              <li key={cat.id} className="hiyaghar-sidebar-item">
                <button
                  className={`hiyaghar-sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => navigateTo(`/${slug}`)}
                >
                  <span className="hiyaghar-sidebar-bullet"></span>
                  {cat.categoryName}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};
