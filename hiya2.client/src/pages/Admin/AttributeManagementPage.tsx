import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError, showToast, extractApiErrorMessage } from '../../utils/alertService';

interface AttributeValItem {
  id?: number;
  attributeId?: number;
  value: string;
}

interface AttributeItem {
  id: number;
  name: string;
  displayName?: string;
  isActive?: boolean;
  values?: AttributeValItem[];
}

export const AttributeManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('ATTRIBUTE');
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<AttributeItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    name: string;
    values: AttributeValItem[];
    newValue: string;
  }>({
    name: '',
    values: [],
    newValue: '',
  });

  const [editingRowIndices, setEditingRowIndices] = useState<{ [key: number]: boolean }>({});

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      const res = await fetch('/api/attribute', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAttributes(data);
      } else {
        setAttributes([]);
      }
    } catch (e) {
      console.warn('Error loading attributes:', e);
      setAttributes([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormErrors({});
    setEditingRowIndices({});
    setFormData({
      name: '',
      values: [],
      newValue: '',
    });
    setViewMode('form');
  };

  const handleOpenEdit = (item: AttributeItem) => {
    setEditingItem(item);
    setFormErrors({});
    setEditingRowIndices({});
    setFormData({
      name: item.name,
      values: item.values ? item.values.map((v) => ({ id: v.id, value: v.value })) : [],
      newValue: '',
    });
    setViewMode('form');
  };

  const handleDelete = async (item: AttributeItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${item.name}' attribute master?`, 'Delete Attribute Master');
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/attribute/${item.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setAttributes((prev) => prev.filter((a) => a.id !== item.id));
        showToastMsg(`Attribute ${item.name} deleted.`);
      } else {
        setAttributes((prev) => prev.filter((a) => a.id !== item.id));
        showToastMsg(`Attribute ${item.name} deleted.`);
      }
    } catch (e) {
      setAttributes((prev) => prev.filter((a) => a.id !== item.id));
      showToastMsg(`Attribute ${item.name} deleted.`);
    }
  };

  const handleAddValTag = (valToAdd?: string) => {
    const targetVal = (valToAdd || formData.newValue).trim();
    if (!targetVal) return;
    if (formData.values.some((v) => v.value.toLowerCase() === targetVal.toLowerCase())) return;

    if (formErrors.values) {
      setFormErrors((prev) => ({ ...prev, values: '' }));
    }

    const newIndex = formData.values.length;
    setEditingRowIndices((prev) => ({ ...prev, [newIndex]: true }));
    setFormData((prev) => ({
      ...prev,
      values: [...prev.values, { id: 0, value: targetVal }],
      newValue: '',
    }));
  };

  // The row order here is the order the value buttons show on the product page.
  const handleMoveValue = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= formData.values.length) return;
    setFormData((prev) => {
      const values = [...prev.values];
      [values[index], values[target]] = [values[target], values[index]];
      return { ...prev, values };
    });
    // Editing state is kept per row index, so swap it along with the rows.
    setEditingRowIndices((prev) => ({ ...prev, [index]: !!prev[target], [target]: !!prev[index] }));
  };

  // ↑/↓ on the list: order of the attribute rows (Packing, Weight, ...) on the product page.
  const handleMoveAttribute = async (item: AttributeItem, direction: -1 | 1) => {
    const index = attributes.findIndex((a) => a.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= attributes.length) return;
    const reordered = [...attributes];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setAttributes(reordered);
    try {
      const res = await fetch('/api/attribute/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...AdminAuthService.getAuthHeaders() },
        body: JSON.stringify({ attributeIds: reordered.map((a) => a.id) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToastMsg('Attribute order saved.');
    } catch (e) {
      console.warn('Error saving attribute order:', e);
      showToastMsg('Could not save the attribute order. Please try again.', 'error');
      await loadAttributes();
    }
  };

  const handleRemoveValTag = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      values: prev.values.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter attribute name';
    }

    const validValues = formData.values.filter((v) => v.value.trim() !== '');
    if (validValues.length === 0) {
      newErrors.values = 'Please enter at least one attribute value';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    if (editingItem) {
      const confirmUpdate = await showConfirm(`Are you sure you want to update all listed attribute values together for ${formData.name}?`, 'Update Attribute Master');
      if (!confirmUpdate) return;
    }

    const payload = {
      id: editingItem ? editingItem.id : 0,
      name: formData.name.trim(),
      displayName: formData.name.trim(),
      isActive: true,
      values: formData.values
        .filter((v) => v.value.trim() !== '')
        .map((v, index) => ({
          id: v.id || 0,
          value: v.value.trim(),
          displayOrder: index + 1,
        })),
    };

    try {
      const url = editingItem ? `/api/attribute/${editingItem.id}` : '/api/attribute';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...AdminAuthService.getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const message = await extractApiErrorMessage(res, `Failed to save Attribute Master ${formData.name}. Please try again.`);
        await showError(message, 'Save Error');
        return;
      }

      showToastMsg(editingItem ? `Attribute ${formData.name} updated successfully.` : `Attribute ${formData.name} created successfully.`);
      await loadAttributes();
    } catch (e) {
      await showError(`Failed to save Attribute Master ${formData.name}. Please check your connection and try again.`, 'Save Error');
      return;
    }

    setViewMode('list');
  };

  const orderButtonStyle = (disabled: boolean): React.CSSProperties => ({
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: disabled ? '#cbd5e1' : '#334155',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '0.85rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  });

  const columns: ColumnDef<AttributeItem>[] = [
    {
      key: 'displayOrder',
      label: 'Order',
      sortValue: (a) => attributes.findIndex((x) => x.id === a.id),
      render: (a) => {
        const index = attributes.findIndex((x) => x.id === a.id);
        const isFirst = index <= 0;
        const isLast = index === attributes.length - 1;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, color: '#64748b', minWidth: '18px' }}>{index + 1}</span>
            {currentMenuPermission.canEdit && (
              <>
                <button type="button" title="Show this attribute earlier on the product page" aria-label={`Move ${a.name} up`} disabled={isFirst} onClick={() => handleMoveAttribute(a, -1)} style={orderButtonStyle(isFirst)}>↑</button>
                <button type="button" title="Show this attribute later on the product page" aria-label={`Move ${a.name} down`} disabled={isLast} onClick={() => handleMoveAttribute(a, 1)} style={orderButtonStyle(isLast)}>↓</button>
              </>
            )}
          </div>
        );
      },
    },
    { key: 'name', label: 'Attribute Name' },
    {
      key: 'values',
      label: 'Attribute Value',
      render: (a) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {a.values && a.values.length > 0 ? (
            a.values.map((v, idx) => (
              <span
                key={idx}
                style={{
                  background: '#e6f4ea',
                  color: '#2d6a4f',
                  border: '1px solid #2d6a4f',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                {v.value}
              </span>
            ))
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No values</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {viewMode === 'list' ? (
        <DataTable<AttributeItem>
          title="Product Attribute Masters Management"
          addButtonText="+ Add Attribute Master"
          columns={columns}
          data={attributes}
          defaultSortKey="displayOrder"
          defaultSortDirection="asc"
          onAddClick={handleOpenAdd}
          onEditClick={handleOpenEdit}
          onDeleteClick={handleDelete}
          canAdd={currentMenuPermission.canAdd}
          canEdit={currentMenuPermission.canEdit}
          canDelete={currentMenuPermission.canDelete}
        />
      ) : (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title">
              {editingItem ? `Update Attribute: ${editingItem.name}` : 'Add New Attribute Master'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Attributes List
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
            <div className="hiyaghar-form-group">
              <label>Attribute Name *</label>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. Weight, Packaging, Colour"
                className={formErrors.name ? 'input-error' : ''}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
              />
              {formErrors.name && <span className="hiyaghar-field-error">{formErrors.name}</span>}
            </div>

            {/* Values Builder - One by one, each on a separate line/row */}
            <div className="hiyaghar-form-group" style={{ marginTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: formErrors.values ? '1px solid #dc2626' : '1px solid #e2e8f0' }}>
              <label style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                Attribute Values List (Manage Values for this Attribute) *
              </label>
              <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#64748b' }}>
                Each value record is displayed on its own line below. Click <strong>Update</strong> next to any row to edit it, then click <strong>Update Attribute Master</strong> at the bottom to bulk save all records together. Use <strong>↑ / ↓</strong> to set the order the values show on the product page (top = first).
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Type new value (e.g. 100g, 200g, Glass Jar) and click + Add Value"
                  value={formData.newValue}
                  onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
                  style={{ flex: 1, background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddValTag();
                    }
                  }}
                />
                <button
                  type="button"
                  className="hiyaghar-add-entity-btn"
                  onClick={() => handleAddValTag()}
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  + Add Value
                </button>
              </div>

              {/* Listed Records: Displayed line-by-line / row-by-row */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '16px' }}>
                {formData.values.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                    No values added yet. Type a value above and click <strong>+ Add Value</strong>.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {formData.values.map((v, i) => {
                      const isRowEditing = !!editingRowIndices[i];
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: isRowEditing ? '#f0fdf4' : '#f8fafc',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${isRowEditing ? '#86efac' : '#e2e8f0'}`,
                          }}
                        >
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', minWidth: '28px' }}>
                            #{i + 1}
                          </span>
                          <button type="button" title="Show this value earlier on the product page" aria-label={`Move ${v.value} up`} disabled={i === 0} onClick={() => handleMoveValue(i, -1)} style={orderButtonStyle(i === 0)}>↑</button>
                          <button type="button" title="Show this value later on the product page" aria-label={`Move ${v.value} down`} disabled={i === formData.values.length - 1} onClick={() => handleMoveValue(i, 1)} style={orderButtonStyle(i === formData.values.length - 1)}>↓</button>
                          <input
                            type="text"
                            value={v.value}
                            disabled={!isRowEditing}
                            onChange={(e) => {
                              const newVals = [...formData.values];
                              newVals[i] = { ...newVals[i], value: e.target.value };
                              setFormData({ ...formData, values: newVals });
                            }}
                            placeholder="Attribute value (e.g. 50g)"
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${isRowEditing ? '#2d6a4f' : '#cbd5e1'}`,
                              fontWeight: 700,
                              color: isRowEditing ? '#2d6a4f' : '#334155',
                              background: isRowEditing ? '#ffffff' : '#f1f5f9',
                              cursor: isRowEditing ? 'text' : 'not-allowed',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingRowIndices((prev) => ({
                                ...prev,
                                [i]: !prev[i],
                              }))
                            }
                            style={{
                              background: isRowEditing ? '#e6f4ea' : '#ffffff',
                              border: `1px solid ${isRowEditing ? '#2d6a4f' : '#cbd5e1'}`,
                              color: isRowEditing ? '#2d6a4f' : '#475569',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={isRowEditing ? 'Click to finish editing this value' : 'Click Update to enable editing for this value'}
                          >
                            {isRowEditing ? 'Editing' : 'Update'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveValTag(i)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fca5a5',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                            title="Remove Value"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {formErrors.values && <span className="hiyaghar-field-error" style={{ marginTop: '8px' }}>{formErrors.values}</span>}
            </div>

            <div className="hiyaghar-modal-footer" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button type="submit" className="hiyaghar-btn-submit">
                {editingItem ? 'Update Attribute Master' : 'Save Attribute Master'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
