import React, { useState, useMemo } from 'react';
import './DataTable.css';

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  sortValue?: (item: T) => any;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  title: string;
  addButtonText?: string;
  columns: ColumnDef<T>[];
  data: T[];
  onAddClick?: () => void;
  onEditClick?: (item: T) => void;
  onDeleteClick?: (item: T) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  onExportClick?: () => void;
  extraControls?: React.ReactNode;
  loading?: boolean;
}

// Helper to extract plain text string from React elements or primitive values
function extractSortableValue(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.trim();
  if (val instanceof Date) return val.getTime();

  // If it's a React element, recursively extract its children's string content
  if (typeof val === 'object' && val.props) {
    const children = val.props.children;
    if (typeof children === 'string' || typeof children === 'number') {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map(extractSortableValue).join(' ').trim();
    }
    return extractSortableValue(children);
  }

  return String(val);
}

export function DataTable<T extends Record<string, any>>({
  title,
  addButtonText = '+ Add Item',
  columns,
  data,
  onAddClick,
  onEditClick,
  onDeleteClick,
  canAdd = true,
  canEdit = true,
  canDelete = true,
  canExport = true,
  onExportClick,
  extraControls,
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter Data (Triggers on 3+ characters or when cleared)
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    // If search is empty, return all data
    if (!term) return data;
    // If search is less than 3 characters, require at least 3 characters before filtering
    if (term.length < 3) return data;

    return data.filter((item) =>
      Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(term);
        }
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm]);

  // Sort Data (Default: Newest additions at #1, or user-selected column sort)
  const sortedData = useMemo(() => {
    if (!sortKey) {
      // If no column is clicked for sorting, default to showing newest created items at the top (#1)
      return [...filteredData].sort((a, b) => {
        const idA = a.id ?? a.userId ?? a.roleId ?? a.menuId ?? a.customerId ?? a.attributeId ?? a.componentId ?? a.orderId ?? a.couponId ?? a.occasionId ?? 0;
        const idB = b.id ?? b.userId ?? b.roleId ?? b.menuId ?? b.customerId ?? b.attributeId ?? b.componentId ?? b.orderId ?? b.couponId ?? b.occasionId ?? 0;
        if (typeof idA === 'number' && typeof idB === 'number' && (idA !== 0 || idB !== 0)) {
          return idB - idA;
        }
        return 0;
      });
    }

    const colDef = columns.find((c) => c.key === sortKey);

    return [...filteredData].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (colDef?.sortValue) {
        aVal = colDef.sortValue(a);
        bVal = colDef.sortValue(b);
      } else if (colDef && colDef.key in a) {
        aVal = a[colDef.key];
        bVal = b[colDef.key];
      } else if (colDef?.render) {
        aVal = extractSortableValue(colDef.render(a, 0));
        bVal = extractSortableValue(colDef.render(b, 0));
      } else {
        // Dynamic key fallback (e.g. 'name' maps to firstName + lastName)
        if (sortKey === 'name') {
          aVal = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.name || a.productName || a.categoryName;
          bVal = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.name || b.productName || b.categoryName;
        } else if (sortKey === 'stock') {
          aVal = a.stockQuantity ?? a.availableStock ?? 0;
          bVal = b.stockQuantity ?? b.availableStock ?? 0;
        } else if (sortKey === 'categoryName') {
          aVal = a.categoryName || a.category?.categoryName || a.categoryTitle || '';
          bVal = b.categoryName || b.category?.categoryName || b.categoryTitle || '';
        } else {
          aVal = a[sortKey];
          bVal = b[sortKey];
        }
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined || aVal === '') return 1;
      if (bVal === null || bVal === undefined || bVal === '') return -1;

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const numA = aVal ? 1 : 0;
        const numB = bVal ? 1 : 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Check if both strings are valid numbers (e.g. "120" vs "20")
      const numA = parseFloat(String(aVal).replace(/[^0-9.-]+/g, ''));
      const numB = parseFloat(String(bVal).replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numA) && !isNaN(numB) && String(numA) === String(aVal).trim()) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleDefaultExport = () => {
    if (onExportClick) {
      onExportClick();
      return;
    }
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`);
    const rows = sortedData.map((item) =>
      columns.map((c) => {
        const val = item[c.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="hiyaghar-datatable-card">
      {/* Table Header: Title + Add Button */}
      <div className="hiyaghar-datatable-top-header">
        <h2 className="hiyaghar-datatable-title">{title}</h2>
        <div className="hiyaghar-datatable-actions-top">
          {canExport && (
            <button type="button" className="hiyaghar-export-btn" onClick={handleDefaultExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          )}
          {canAdd && onAddClick && (
            <button type="button" className="hiyaghar-add-entity-btn" onClick={onAddClick}>
              {addButtonText}
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Entries Count & Search Bar */}
      <div className="hiyaghar-datatable-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div className="hiyaghar-entries-control">
            <span>Show entries</span>
            <select value={pageSize} onChange={handlePageSizeChange} className="hiyaghar-select-pagesize">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {extraControls}
        </div>

        <div className="hiyaghar-search-control">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="hiyaghar-search-input"
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="hiyaghar-table-responsive">
        <table className="hiyaghar-datatable">
          <thead>
            <tr>
              <th className="th-srno">Sr.No</th>
              {columns.map((col) => {
                const isActionCol = col.sortable === false || col.key.toLowerCase() === 'action' || col.key.toLowerCase() === 'actions';
                if (isActionCol) {
                  return (
                    <th key={col.key} className="th-action">
                      {col.label}
                    </th>
                  );
                }

                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort(col.key);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="th-sortable"
                    title={`Click or press Enter to sort by ${col.label}`}
                    aria-label={`Sort by ${col.label}, currently ${isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'unsorted'}`}
                  >
                    <div className="th-sortable-inner">
                      <span>{col.label}</span>
                      <span className={`sort-icon ${isSorted ? 'active' : ''}`}>
                        {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </div>
                  </th>
                );
              })}
              {(canEdit || canDelete) && <th className="th-action">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="td-empty">
                  ⏳ Loading data...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="td-empty">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const srNo = startIndex + index + 1;
                return (
                  <tr key={item.id || item.userId || item.roleId || item.menuId || index}>
                    <td className="td-srno">{srNo}</td>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(item, startIndex + index) : item[col.key] ?? '-'}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="td-action">
                        <div className="hiyaghar-action-btns">
                          {canEdit && onEditClick && (
                            <button
                              type="button"
                              className="hiyaghar-action-edit-btn"
                              onClick={() => onEditClick(item)}
                              title="Edit Record"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && onDeleteClick && (
                            <button
                              type="button"
                              className="hiyaghar-action-delete-btn"
                              onClick={() => onDeleteClick(item)}
                              title="Delete Record"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Entry Info & Pagination */}
      <div className="hiyaghar-datatable-footer">
        <div className="hiyaghar-footer-info">
          Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
        </div>

        <div className="hiyaghar-pagination">
          <button
            type="button"
            className="hiyaghar-page-btn"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>

          {(() => {
            const pages: (number | string)[] = [];
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              // Sliding window around safeCurrentPage
              pages.push(1);
              if (safeCurrentPage > 3) pages.push('...');
              
              const start = Math.max(2, safeCurrentPage - 1);
              const end = Math.min(totalPages - 1, safeCurrentPage + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              
              if (safeCurrentPage < totalPages - 2) pages.push('...');
              pages.push(totalPages);
            }

            return pages.map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span key={`ellipsis-${idx}`} className="hiyaghar-page-ellipsis">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  type="button"
                  className={`hiyaghar-page-btn ${p === safeCurrentPage ? 'is-active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              );
            });
          })()}

          <button
            type="button"
            className="hiyaghar-page-btn"
            disabled={safeCurrentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
