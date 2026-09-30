import React, { useState } from 'react';
import { navigateTo } from '../../../utils/navigation';
import { useSidebarCategories, getCategorySlug } from './useSidebarCategories';

export const CategoriesMobileTrigger: React.FC = () => {
  const categories = useSidebarCategories();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const currentPath = window.location.pathname;

  return (
    <>
      <button
        type="button"
        className="hiyaghar-mukhwas-mobile-filter-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Browse categories"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="14" y2="17" />
        </svg>
        <span>Categories</span>
      </button>

      {isOpen && (
        <div className="hiyaghar-drawer-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="hiyaghar-mukhwas-filter-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Browse categories"
          >
            <div className="hiyaghar-filter-drawer-header">
              <div className="hiyaghar-drawer-title-group">
                <h3 className="hiyaghar-filter-drawer-title">Categories</h3>
                <span className="hiyaghar-drawer-sub">Browse our other collections</span>
              </div>
              <button
                type="button"
                className="hiyaghar-drawer-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="hiyaghar-filter-drawer-body">
              <ul className="hiyaghar-sidebar-list">
                {categories.map((cat) => {
                  const slug = getCategorySlug(cat.categoryName);
                  const isActive = currentPath === `/${slug}`;
                  return (
                    <li key={cat.id} className="hiyaghar-sidebar-item">
                      <button
                        className={`hiyaghar-sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setIsOpen(false);
                          navigateTo(`/${slug}`);
                        }}
                      >
                        <span className="hiyaghar-sidebar-bullet"></span>
                        {cat.categoryName}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
