import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError, extractApiErrorMessage } from '../../utils/alertService';

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
  const [toast, setToast] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<AttributeItem | null>(null);

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

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
        showToastMsg(`Attribute '${item.name}' deleted.`);
      } else {
        setAttributes((prev) => prev.filter((a) => a.id !== item.id));
        showToastMsg(`Attribute '${item.name}' deleted.`);
      }
    } catch (e) {
      setAttributes((prev) => prev.filter((a) => a.id !== item.id));
      showToastMsg(`Attribute '${item.name}' deleted.`);
    }
  };

  const handleAddValTag = (valToAdd?: string) => {
    const targetVal = (valToAdd || formData.newValue).trim();
    if (!targetVal) return;
    if (formData.values.some((v) => v.value.toLowerCase() === targetVal.toLowerCase())) return;

    const newIndex = formData.values.length;
    setEditingRowIndices((prev) => ({ ...prev, [newIndex]: true }));
    setFormData((prev) => ({
      ...prev,
      values: [...prev.values, { id: 0, value: targetVal }],
      newValue: '',
    }));
  };

  const handleRemoveValTag = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      values: prev.values.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const validValues = formData.values.filter((v) => v.value.trim() !== '');
    if (validValues.length === 0) {
      await showError('Please add at least ONE Attribute Value to the list before saving!', 'Validation Error');
      return;
    }

    if (editingItem) {
      const confirmUpdate = await showConfirm(`Are you sure you want to update all listed attribute values together for '${formData.name}'?`, 'Update Attribute Master');
      if (!confirmUpdate) return;
    }

    const payload = {
      id: editingItem ? editingItem.id : 0,
      name: formData.name.trim(),
      displayName: formData.name.trim(),
      isActive: true,
      values: formData.values
        .filter((v) => v.value.trim() !== '')
        .map((v) => ({
          id: v.id || 0,
          value: v.value.trim(),
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
        const message = await extractApiErrorMessage(res, `Failed to save Attribute Master '${formData.name}'. Please try again.`);
        await showError(message, 'Save Error');
        return;
      }

      showToastMsg(`Attribute Master '${formData.name}' saved successfully!`);
      await loadAttributes();
    } catch (e) {
      await showError(`Failed to save Attribute Master '${formData.name}'. Please check your connection and try again.`, 'Save Error');
      return;
    }

    setViewMode('list');
  };

  const columns: ColumnDef<AttributeItem>[] = [
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
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

      {viewMode === 'list' ? (
        <DataTable<AttributeItem>
          title="Product Attribute Masters Management"
          addButtonText="+ Add Attribute Master"
          columns={columns}
          data={attributes}
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

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            <div className="hiyaghar-form-group">
              <label>Attribute Name *</label>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. Weight, Packaging, Colour"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Values Builder - One by one, each on a separate line/row */}
            <div className="hiyaghar-form-group" style={{ marginTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                🏷️ Attribute Values List (Manage Values for this Attribute) *
              </label>
              <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#64748b' }}>
                Each value record is displayed on its own line below. Click <strong>✏️ Update</strong> next to any row to edit it, then click <strong>Update Attribute Master</strong> at the bottom to bulk save all records together.
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
                            {isRowEditing ? '✔️ Editing' : '✏️ Update'}
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
                              gap: '4px',
                            }}
                            title="Remove Value"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Update Action Button after listing */}
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

