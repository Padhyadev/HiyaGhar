import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { LovService, type LovItem, type LovCategory } from '../../services/lovService';
import { showToast } from '../../utils/alertService';
import './OrderManagementPage.css';

export const LovManagementPage: React.FC = () => {
  const [columns, setColumns] = useState<LovCategory[]>([]);
  const [loadingColumns, setLoadingColumns] = useState<boolean>(true);

  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [items, setItems] = useState<LovItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<LovItem | null>(null);
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [categoryDisplayTextInput, setCategoryDisplayTextInput] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<LovCategory | null>(null);
  const [categoryEditDesc, setCategoryEditDesc] = useState<string>('');
  const [categoryFieldErrors, setCategoryFieldErrors] = useState<Record<string, string>>({});
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  const loadColumns = async () => {
    setLoadingColumns(true);
    const cols = await LovService.getColumns();
    setColumns(cols);
    setLoadingColumns(false);
  };

  useEffect(() => {
    loadColumns();
  }, []);

  const openColumn = async (column: string) => {
    setSelectedColumn(column);
    setLoadingItems(true);
    const rows = await LovService.getItems(column);
    setItems(rows.sort((a, b) => a.displayOrder - b.displayOrder));
    setLoadingItems(false);
  };

  const backToColumns = () => {
    setSelectedColumn(null);
    setItems([]);
    loadColumns();
  };

  const openAddForm = () => {
    setEditingItem(null);
    setNewColumnName(selectedColumn || '');
    setCategoryDisplayTextInput('');
    setFormCode('');
    setFormDesc('');
    setFormOrder(items.length + 1);
    setFormActive(true);
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const openCategoryEditForm = (category: LovCategory) => {
    setEditingCategory(category);
    setCategoryEditDesc(category.displayText);
    setCategoryFieldErrors({});
    setIsCategoryFormOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    const errors: Record<string, string> = {};

    if (!categoryEditDesc.trim()) {
      errors.displayText = 'Please enter display text';
    }

    if (Object.keys(errors).length > 0) {
      setCategoryFieldErrors(errors);
      return;
    }

    setIsSavingCategory(true);
    setCategoryFieldErrors({});
    const res = await LovService.updateCategory(editingCategory.id, categoryEditDesc.trim());
    setIsSavingCategory(false);

    if (res.success) {
      setIsCategoryFormOpen(false);
      showToast(`Category ${categoryEditDesc} updated successfully.`, 'success');
      await loadColumns();
    } else {
      setCategoryFieldErrors({ general: res.message || 'Failed to update category.' });
    }
  };

  const openEditForm = (item: LovItem) => {
    setEditingItem(item);
    setNewColumnName(item.lovColumn);
    setFormCode(item.lovCode);
    setFormDesc(item.lovDesc);
    setFormOrder(item.displayOrder);
    setFormActive(item.isActive);
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};

    if (!formDesc.trim()) {
      errors.desc = 'Please enter display text';
    }

    if (!editingItem) {
      if (!newColumnName.trim()) {
        errors.column = 'Please enter category name';
      }
      if (!formCode.trim()) {
        errors.code = 'Please enter code';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    setFieldErrors({});

    if (editingItem) {
      const res = await LovService.updateItem(editingItem.id, editingItem.lovColumn, {
        lovDesc: formDesc.trim(),
        displayOrder: formOrder,
        isActive: formActive,
      });
      setIsSaving(false);
      if (res.success) {
        setIsFormOpen(false);
        showToast(`Entry ${editingItem.lovCode} updated successfully.`, 'success');
        if (selectedColumn) await openColumn(selectedColumn);
      } else {
        setFieldErrors({ general: res.message || 'Failed to update entry.' });
      }
    } else {
      const res = await LovService.createItem({
        lovColumn: newColumnName.trim(),
        lovCode: formCode.trim(),
        lovDesc: formDesc.trim(),
        displayOrder: formOrder,
        categoryDisplayText: selectedColumn ? undefined : categoryDisplayTextInput.trim() || undefined,
      });
      setIsSaving(false);
      if (res.success) {
        setIsFormOpen(false);
        showToast(`Entry ${formCode} created successfully.`, 'success');
        await loadColumns();
        await openColumn(newColumnName.trim());
      } else {
        setFieldErrors({ general: res.message || 'Failed to create entry.' });
      }
    }
  };

  const handleDelete = async (item: LovItem) => {
    const res = await LovService.deleteItem(item.id, item.lovColumn);
    if (res.success) {
      showToast(`Entry ${item.lovCode} deleted successfully.`, 'success');
      if (selectedColumn) await openColumn(selectedColumn);
    } else {
      showToast(res.message || 'Failed to delete entry.', 'error');
    }
  };

  const columnListColumns: ColumnDef<LovCategory>[] = [
    { key: 'lovColumn', label: 'Category (LovColumn)' },
    { key: 'displayText', label: 'Display Text' },
    {
      key: 'actions',
      label: 'Action',
      render: (category) => (
        <div className="hiyaghar-action-btns">
          <button
            type="button"
            className="hiyaghar-action-edit-btn"
            title="Edit category display text"
            onClick={() => openCategoryEditForm(category)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="hiyaghar-action-edit-btn"
            title="View codes in this category"
            onClick={() => openColumn(category.lovColumn)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  const itemColumns: ColumnDef<LovItem>[] = [
    { key: 'lovCode', label: 'Code (fixed)' },
    { key: 'lovDesc', label: 'Display Text' },
    { key: 'displayOrder', label: 'Order' },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) => (
        <span className={`hiyaghar-order-status-pill ${item.isActive ? 'status-delivered' : 'status-cancelled'}`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="hiyaghar-admin-page-container">
      {!selectedColumn ? (
        <DataTable
          title="Dropdown & Status Master"
          addButtonText="+ Add New Category"
          columns={columnListColumns}
          data={columns}
          loading={loadingColumns}
          canAdd={true}
          canDelete={false}
          canEdit={false}
          onAddClick={openAddForm}
        />
      ) : (
        <DataTable
          title={`LOV: ${selectedColumn}`}
          addButtonText="+ Add Code"
          columns={itemColumns}
          data={items}
          loading={loadingItems}
          canAdd={true}
          canDelete={true}
          canEdit={true}
          onAddClick={openAddForm}
          onEditClick={openEditForm}
          onDeleteClick={handleDelete}
          extraControls={
            <button type="button" className="hiyaghar-export-btn" onClick={backToColumns}>
              ← Back to Categories
            </button>
          }
        />
      )}

      {isFormOpen && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>
                {editingItem
                  ? `Edit ${editingItem.lovCode}`
                  : selectedColumn
                  ? `Add Code to ${selectedColumn}`
                  : 'Add New Category'}
              </h3>
              <button type="button" className="close-btn" onClick={() => setIsFormOpen(false)}>
                ✕
              </button>
            </div>

            {!editingItem && !selectedColumn && (
              <p style={{ fontSize: '0.85rem', color: 'var(--hiya-muted, #475467)', margin: '0 0 14px 0' }}>
                A category is created the moment it has its first code — fill in both below to create
                {newColumnName ? ` ${newColumnName}` : ''} as a brand-new category.
              </p>
            )}

            {!editingItem && (
              <>
                <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
                  <h4>Category (LovColumn){selectedColumn ? '' : ' - new'} *</h4>
                  <input
                    type="text"
                    value={newColumnName}
                    className={fieldErrors.column ? 'input-error' : ''}
                    onChange={(e) => {
                      setNewColumnName(e.target.value);
                      if (fieldErrors.column) setFieldErrors((prev) => ({ ...prev, column: '' }));
                    }}
                    placeholder="e.g. OrderStatus"
                    disabled={!!selectedColumn}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e8e2c9',
                      boxSizing: 'border-box',
                      background: selectedColumn ? '#f1f5f9' : '#ffffff',
                    }}
                  />
                  {fieldErrors.column && <span className="hiyaghar-field-error">{fieldErrors.column}</span>}
                </div>

                {!selectedColumn && (
                  <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
                    <h4>Category Display Text</h4>
                    <input
                      type="text"
                      value={categoryDisplayTextInput}
                      onChange={(e) => setCategoryDisplayTextInput(e.target.value)}
                      placeholder="Friendly label for this category, e.g. Order Status"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
                  <h4>Code *</h4>
                  <input
                    type="text"
                    value={formCode}
                    className={fieldErrors.code ? 'input-error' : ''}
                    onChange={(e) => {
                      setFormCode(e.target.value);
                      if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: '' }));
                    }}
                    placeholder="e.g. Delivered"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
                  />
                  {fieldErrors.code && <span className="hiyaghar-field-error">{fieldErrors.code}</span>}
                </div>
              </>
            )}

            {editingItem && (
              <p style={{ fontSize: '0.85rem', color: 'var(--hiya-muted, #475467)', margin: '0 0 14px 0' }}>
                Category: <strong>{editingItem.lovColumn}</strong> &middot; Code:{' '}
                <strong>{editingItem.lovCode}</strong>
              </p>
            )}

            <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
              <h4>{editingItem || selectedColumn ? 'Display Text *' : 'Value Display Text *'}</h4>
              <input
                type="text"
                value={formDesc}
                className={fieldErrors.desc ? 'input-error' : ''}
                onChange={(e) => {
                  setFormDesc(e.target.value);
                  if (fieldErrors.desc) setFieldErrors((prev) => ({ ...prev, desc: '' }));
                }}
                placeholder="What customers/admins actually see"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
              />
              {fieldErrors.desc && <span className="hiyaghar-field-error">{fieldErrors.desc}</span>}
            </div>

            <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
              <h4>Display Order</h4>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
              />
            </div>

            {editingItem && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', marginBottom: '12px' }}>
                <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
                Active
              </label>
            )}

            {fieldErrors.general && <p className="hiyaghar-order-error-text">{fieldErrors.general}</p>}

            <div className="hiyaghar-modal-footer">
              <button type="button" className="hiyaghar-btn-cancel" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="hiyaghar-btn-submit" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCategoryFormOpen && editingCategory && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsCategoryFormOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>Edit Category</h3>
              <button type="button" className="close-btn" onClick={() => setIsCategoryFormOpen(false)}>
                ✕
              </button>
            </div>

            <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
              <h4>Lov Column (not editable)</h4>
              <input
                type="text"
                value={editingCategory.lovColumn}
                disabled
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box', background: '#f1f5f9' }}
              />
            </div>

            <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
              <h4>Display Text *</h4>
              <input
                type="text"
                value={categoryEditDesc}
                className={categoryFieldErrors.displayText ? 'input-error' : ''}
                onChange={(e) => {
                  setCategoryEditDesc(e.target.value);
                  if (categoryFieldErrors.displayText) setCategoryFieldErrors((prev) => ({ ...prev, displayText: '' }));
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
              />
              {categoryFieldErrors.displayText && <span className="hiyaghar-field-error">{categoryFieldErrors.displayText}</span>}
            </div>

            {categoryFieldErrors.general && <p className="hiyaghar-order-error-text">{categoryFieldErrors.general}</p>}

            <div className="hiyaghar-modal-footer">
              <button type="button" className="hiyaghar-btn-cancel" onClick={() => setIsCategoryFormOpen(false)} disabled={isSavingCategory}>
                Cancel
              </button>
              <button type="button" className="hiyaghar-btn-submit" onClick={handleSaveCategory} disabled={isSavingCategory}>
                {isSavingCategory ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
