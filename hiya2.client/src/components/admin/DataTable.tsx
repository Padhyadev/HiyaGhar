import React, { useState, useMemo } from 'react';
import './DataTable.css';

export interface ColumnDef<T> {
  key: string;
  label: string;
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

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const totalEntries = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="hiyaghar-datatable-card">
      {/* Table Header: Title + Add Button */}
      <div className="hiyaghar-datatable-top-header">
        <h2 className="hiyaghar-datatable-title">{title}</h2>
        <div className="hiyaghar-datatable-actions-top">
          {canExport && onExportClick && (
            <button type="button" className="hiyaghar-export-btn" onClick={onExportClick}>
              📥 Export CSV
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
            placeholder="Type to filter..."
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
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
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
                              ✏️
                            </button>
                          )}
                          {canDelete && onDeleteClick && (
                            <button
                              type="button"
                              className="hiyaghar-action-delete-btn"
                              onClick={() => onDeleteClick(item)}
                              title="Delete Record"
                            >
                              🗑️
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

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`hiyaghar-page-btn ${pageNum === safeCurrentPage ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

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
