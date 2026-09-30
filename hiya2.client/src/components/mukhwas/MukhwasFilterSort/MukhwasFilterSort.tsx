import React, { useState } from 'react';
import { sortOptions } from '../../../data/mukhwasData';
import './MukhwasFilterSort.css';

interface MukhwasFilterSortProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  selectedSort: string;
  onSelectSort: (sortId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalResults: number;
  productTypeName?: string;
  /** Extra mobile toolbar buttons (e.g. a Categories trigger) rendered next to Sort Products */
  children?: React.ReactNode;
}

export const MukhwasFilterSort: React.FC<MukhwasFilterSortProps> = ({
  selectedSort,
  onSelectSort,
  totalResults,
  productTypeName = 'Mukhwas',
  children,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  return (
    <div className="hiyaghar-mukhwas-filter-bar-wrapper">
      <div className="hiyaghar-container">
        <div className="hiyaghar-mukhwas-filter-bar-inner">
          {/* Left Results Meta Count */}
          <div className="hiyaghar-mukhwas-results-meta">
            <span className="hiyaghar-results-count">
              Showing <strong>{totalResults}</strong> {productTypeName} product{totalResults !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Desktop Right Tool: Sort Dropdown */}
          <div className="hiyaghar-mukhwas-filter-tools">
            {/* Sort Dropdown */}
            <div className="hiyaghar-mukhwas-sort-dropdown-wrapper">
              <label htmlFor="mukhwas-sort-select" className="hiyaghar-sort-label">
                Sort by:
              </label>
              <div className="hiyaghar-sort-select-box">
                <select
                  id="mukhwas-sort-select"
                  className="hiyaghar-mukhwas-sort-select"
                  value={selectedSort}
                  onChange={(e) => onSelectSort(e.target.value)}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg className="hiyaghar-select-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1.5L6 6.5L11 1.5" />
                </svg>
              </div>
            </div>

            {/* Mobile Filter & Sort Button (< 992px) */}
            <button
              type="button"
              className="hiyaghar-mukhwas-mobile-filter-trigger"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open sort drawer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              <span>Sort Products</span>
            </button>

            {children}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Out Filter Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div className="hiyaghar-drawer-backdrop" onClick={() => setIsMobileDrawerOpen(false)}>
          <div className="hiyaghar-mukhwas-filter-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Filter products">
            <div className="hiyaghar-filter-drawer-header">
              <div className="hiyaghar-drawer-title-group">
                <h3 className="hiyaghar-filter-drawer-title">Filter & Sort {productTypeName}</h3>
                <span className="hiyaghar-drawer-sub">Customise your product view</span>
              </div>
              <button
                type="button"
                className="hiyaghar-drawer-close-btn"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Close drawer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="hiyaghar-filter-drawer-body">
              {/* Sort By */}
              <div className="hiyaghar-drawer-section">
                <label className="hiyaghar-drawer-section-title">Sort By</label>
                <div className="hiyaghar-drawer-sort-list">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`hiyaghar-drawer-sort-btn ${selectedSort === opt.id ? 'is-active' : ''}`}
                      onClick={() => {
                        onSelectSort(opt.id);
                        setIsMobileDrawerOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {selectedSort === opt.id && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
