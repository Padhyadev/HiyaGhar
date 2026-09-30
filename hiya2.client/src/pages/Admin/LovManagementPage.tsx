import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { LovService, type LovItem, type LovCategory } from '../../services/lovService';
import './OrderManagementPage.css';

export const LovManagementPage: React.FC = () => {
  const [columns, setColumns] = useState<LovCategory[]>([]);
  const [loadingColumns, setLoadingColumns] = useState<boolean>(true);

  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [items, setItems] = useState<LovItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  const [toast, setToast] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<LovItem | null>(null);
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [categoryDisplayTextInput, setCategoryDisplayTextInput] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Separate modal for editing a category's own Display Text - LovColumn is
  // never editable here, matching how a value's Code is never editable once
  // created.
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<LovCategory | null>(null);
  const [categoryEditDesc, setCategoryEditDesc] = useState<string>('');
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
    setFormError(null);
    setIsFormOpen(true);
  };

  const openCategoryEditForm = (category: LovCategory) => {
    setEditingCategory(category);
    setCategoryEditDesc(category.displayText);
    setCategoryFormError(null);
    setIsCategoryFormOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    if (!categoryEditDesc.trim()) {
      setCategoryFormError('Display Text is required.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryFormError(null);
    const res = await LovService.updateCategory(editingCategory.id, categoryEditDesc.trim());
    setIsSavingCategory(false);

    if (res.success) {
      setIsCategoryFormOpen(false);
      showToastMsg('Category updated.');
      await loadColumns();
    } else {
      setCategoryFormError(res.message || 'Failed to update category.');
    }
  };

  const openEditForm = (item: LovItem) => {
    setEditingItem(item);
    setNewColumnName(item.lovColumn);
    setFormCode(item.lovCode);
    setFormDesc(item.lovDesc);
    setFormOrder(item.displayOrder);
    setFormActive(item.isActive);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formDesc.trim()) {
      setFormError('Display Text is required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    if (editingItem) {
      const res = await LovService.updateItem(editingItem.id, editingItem.lovColumn, {
        lovDesc: formDesc.trim(),
        displayOrder: formOrder,
        isActive: formActive,
      });
      setIsSaving(false);
      if (res.success) {
        setIsFormOpen(false);
        showToastMsg('Entry updated.');
        if (selectedColumn) await openColumn(selectedColumn);
      } else {
        setFormError(res.message || 'Failed to update entry.');
      }
    } else {
      if (!newColumnName.trim() || !formCode.trim()) {
        setIsSaving(false);
        setFormError('Category and Code are both required for a new entry.');
        return;
      }
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
        showToastMsg('Entry created.');
        await loadColumns();
        await openColumn(newColumnName.trim());
      } else {
        setFormError(res.message || 'Failed to create entry.');
      }
    }
  };

  const handleDelete = async (item: LovItem) => {
    const res = await LovService.deleteItem(item.id, item.lovColumn);
    if (res.success) {
      showToastMsg('Entry removed.');
      if (selectedColumn) await openColumn(selectedColumn);
    } else {
      showToastMsg(res.message || 'Failed to remove entry.');
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
            ✏️
          </button>
          <button
            type="button"
            className="hiyaghar-action-edit-btn"
            title="View codes in this category"
            onClick={() => openColumn(category.lovColumn)}
          >
            👁️
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
      {toast && <div className="hiyaghar-admin-toast">{toast}</div>}

      {!selectedColumn ? (
        <DataTable
          title="List of Values (LOV)"
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
                  ? `Edit "${editingItem.lovCode}"`
                  : selectedColumn
                  ? `Add Code to "${selectedColumn}"`
                  : 'Add New Category'}
              </h3>
              <button type="button" className="close-btn" onClick={() => setIsFormOpen(false)}>
                ✕
              </button>
            </div>

            {!editingItem && !selectedColumn && (
              <p style={{ fontSize: '0.85rem', color: '#667085', margin: '0 0 14px 0' }}>
                A category is created the moment it has its first code — fill in both below to create
                "{newColumnName || '...'}" as a brand-new category.
              </p>
            )}

            {!editingItem && (
              <>
                <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
                  <h4>Category (LovColumn){selectedColumn ? '' : ' - new'}</h4>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
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
                  <h4>Code (stable key - app code will refer to this)</h4>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. Delivered"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {editingItem && (
              <p style={{ fontSize: '0.85rem', color: '#667085', margin: '0 0 14px 0' }}>
                Category: <strong>{editingItem.lovColumn}</strong> &middot; Code:{' '}
                <strong>{editingItem.lovCode}</strong> (not editable — only the display text below is).
              </p>
            )}

            <div className="hiyaghar-order-detail-block" style={{ marginBottom: '12px' }}>
              <h4>{editingItem || selectedColumn ? 'Display Text' : 'Value Display Text'}</h4>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What customers/admins actually see"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
              />
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
                Active (inactive codes fall back to their raw code name wherever displayed)
              </label>
            )}

            {formError && <p className="hiyaghar-order-error-text">{formError}</p>}

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
              <h4>Display Text</h4>
              <input
                type="text"
                value={categoryEditDesc}
                onChange={(e) => setCategoryEditDesc(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8e2c9', boxSizing: 'border-box' }}
              />
            </div>

            {categoryFormError && <p className="hiyaghar-order-error-text">{categoryFormError}</p>}

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
