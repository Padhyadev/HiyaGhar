import React, { useEffect, useState } from 'react';
import { ComboSettingsService, type ComboPackConfig, DEFAULT_COMBO_PACKS } from '../../services/comboSettingsService';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { showConfirm, showToast } from '../../utils/alertService';
import { usePermission } from '../../context/PermissionContext';
import './OrderManagementPage.css';

interface ComboPackFormData {
  id?: string;
  name: string;
  itemCount: number;
  discountPercentage: number;
  badge: string;
  tagline: string;
  isActive: boolean;
}

export const ComboPackManagementPage: React.FC = () => {
  const [packs, setPacks] = useState<ComboPackConfig[]>(DEFAULT_COMBO_PACKS);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComboPackFormData>({
    name: '',
    itemCount: 3,
    discountPercentage: 10,
    badge: '',
    tagline: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('COMBOPACK', 'canAdd');
  const canEdit = hasPermission('COMBOPACK', 'canEdit');
  const canDelete = hasPermission('COMBOPACK', 'canDelete');

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = () => {
    setPacks(ComboSettingsService.getPacks());
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      itemCount: 3,
      discountPercentage: 10,
      badge: '',
      tagline: 'Pick 3 items & save 10%',
      isActive: true,
    });
    setErrors({});
    setViewMode('form');
  };

  const handleOpenEdit = (pack: ComboPackConfig) => {
    setEditingId(pack.id);
    setFormData({
      id: pack.id,
      name: pack.name,
      itemCount: pack.itemCount,
      discountPercentage: pack.discountPercentage,
      badge: pack.badge || '',
      tagline: pack.tagline || `Pick ${pack.itemCount} items & save ${pack.discountPercentage}%`,
      isActive: pack.isActive,
    });
    setErrors({});
    setViewMode('form');
  };

  const handleDelete = async (pack: ComboPackConfig) => {
    if (packs.length <= 1) {
      showToast('At least one combo pack must remain available.', 'error');
      return;
    }

    const confirmed = await showConfirm(
      `Are you sure you want to delete '${pack.name}'?`,
      'Delete Combo Pack'
    );
    if (!confirmed) return;

    const updated = packs.filter((p) => p.id !== pack.id);
    setPacks(updated);
    ComboSettingsService.savePacks(updated);
    showToast(`Combo pack '${pack.name}' deleted successfully!`, 'success');
  };

  const handleToggleActive = (pack: ComboPackConfig) => {
    const updated = packs.map((p) => (p.id === pack.id ? { ...p, isActive: !p.isActive } : p));
    setPacks(updated);
    ComboSettingsService.savePacks(updated);
    showToast(`Status updated for '${pack.name}'`, 'info');
  };

  const handleFormChange = (field: keyof ComboPackFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'itemCount' || field === 'discountPercentage') {
        const count = field === 'itemCount' ? value : updated.itemCount;
        const discount = field === 'discountPercentage' ? value : updated.discountPercentage;
        updated.tagline = `Pick ${count} items & save ${discount}%`;
      }
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter combo pack name';
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = 'Pack name must be between 2 and 50 characters.';
    }

    if (!formData.itemCount || Number(formData.itemCount) < 2 || Number(formData.itemCount) > 20) {
      newErrors.itemCount = 'Item capacity must be between 2 and 20 items.';
    }

    if (formData.discountPercentage === undefined || formData.discountPercentage === null || Number(formData.discountPercentage) < 0 || Number(formData.discountPercentage) > 90) {
      newErrors.discountPercentage = 'Discount percentage must be between 0% and 90%.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    let updatedPacks: ComboPackConfig[];
    if (editingId) {
      // Edit mode
      updatedPacks = packs.map((p) =>
        p.id === editingId
          ? {
            ...p,
            name: formData.name.trim(),
            itemCount: Number(formData.itemCount),
            discountPercentage: Number(formData.discountPercentage),
            badge: formData.badge.trim() || undefined,
            tagline: formData.tagline.trim() || `Pick ${formData.itemCount} items & save ${formData.discountPercentage}%`,
            isActive: formData.isActive,
          }
          : p
      );
      showToast(`Combo pack '${formData.name}' updated successfully!`, 'success');
    } else {
      // Add mode
      const newPack: ComboPackConfig = {
        id: `pack-${Date.now()}`,
        name: formData.name.trim(),
        itemCount: Number(formData.itemCount),
        discountPercentage: Number(formData.discountPercentage),
        badge: formData.badge.trim() || undefined,
        tagline: formData.tagline.trim() || `Pick ${formData.itemCount} items & save ${formData.discountPercentage}%`,
        isActive: formData.isActive,
      };
      updatedPacks = [...packs, newPack];
      showToast(`New combo pack '${formData.name}' created successfully!`, 'success');
    }

    setPacks(updatedPacks);
    ComboSettingsService.savePacks(updatedPacks);
    setViewMode('list');
  };

  const columns: ColumnDef<ComboPackConfig>[] = [
    {
      key: 'name',
      label: 'Pack Name & Details',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--hiya-navy, #11223A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{item.name}</span>
            {item.badge && (
              <span style={{ fontSize: '12px', padding: '2px 8px', background: '#FDF3E3', color: '#B37D14', borderRadius: '12px', border: '1px solid #E8CD96', fontWeight: 800 }}>
                {item.badge}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
            {item.tagline}
          </div>
        </div>
      ),
    },
    {
      key: 'itemCount',
      label: 'Capacity (Items)',
      render: (item) => (
        <span style={{ fontWeight: 700, fontSize: '13.5px', background: '#EBF4FF', color: '#1E40AF', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-boxes-packing"></i>
          <span>{item.itemCount} Products</span>
        </span>
      ),
    },
    {
      key: 'discountPercentage',
      label: 'Discount',
      render: (item) => (
        <span style={{ fontWeight: 800, fontSize: '14px', color: '#047857', background: '#ECFDF5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
          {item.discountPercentage}% OFF
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) => (
        <button
          type="button"
          onClick={() => handleToggleActive(item)}
          style={{
            background: item.isActive ? '#E6F4EA' : '#FCE8E6',
            color: item.isActive ? '#137333' : '#C5221F',
            border: `1px solid ${item.isActive ? '#CEEAD6' : '#FAD2CF'}`,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Click to toggle status"
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.isActive ? '#137333' : '#C5221F' }}></span>
          {item.isActive ? 'Active on Store' : 'Disabled'}
        </button>
      ),
    },
  ];

  return (
    <div className="hiyaghar-admin-page">
      {viewMode === 'list' ? (
        <DataTable<ComboPackConfig>
          title="Combo Packs & Tier Discounts"
          addButtonText="+ Add New Combo Pack"
          columns={columns}
          data={packs}
          onAddClick={handleOpenAdd}
          onEditClick={handleOpenEdit}
          onDeleteClick={handleDelete}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
          canExport={false}
        />
      ) : (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-circle-plus'}`} style={{ color: '#D19A27', fontSize: '1.2rem' }}></i>
              {editingId ? 'Edit Combo Pack' : 'Add New Combo Pack'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Combo Packs
            </button>
          </div>

          <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="hiyaghar-form-group">
                <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                  Combo Pack Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Starter Trio Box, Value Quad, Ultimate Family"
                  className={`hiyaghar-search-input ${errors.name ? 'input-error' : ''}`}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                {errors.name && <span className="hiyaghar-field-error">{errors.name}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Item Capacity (Number of Products) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={formData.itemCount}
                    onChange={(e) => handleFormChange('itemCount', Number(e.target.value))}
                    className={`hiyaghar-search-input ${errors.itemCount ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    How many items customer must select for this combo box.
                  </small>
                  {errors.itemCount && <span className="hiyaghar-field-error">{errors.itemCount}</span>}
                </div>

                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Combo Discount (% OFF) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.discountPercentage}
                    onChange={(e) => handleFormChange('discountPercentage', Number(e.target.value))}
                    className={`hiyaghar-search-input ${errors.discountPercentage ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Percentage deducted from the sum total of items.
                  </small>
                  {errors.discountPercentage && <span className="hiyaghar-field-error">{errors.discountPercentage}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={formData.badge}
                    onChange={(e) => handleFormChange('badge', e.target.value)}
                    placeholder="e.g. Most Popular, Best Value, Festive Special"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Custom Tagline (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.tagline}
                    onChange={(e) => handleFormChange('tagline', e.target.value)}
                    placeholder="e.g. Pick 3 items & save 10%"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  id="comboIsActive"
                  checked={formData.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#D19A27' }}
                />
                <label htmlFor="comboIsActive" style={{ fontWeight: 700, fontSize: '14px', cursor: 'pointer', margin: 0, color: '#10243E' }}>
                  Show this Combo Pack to Customers on the Store
                </label>
              </div>
            </div>

            {/* Standard Modal/Form Footer with properly styled Submit & Cancel buttons */}
            <div className="hiyaghar-modal-footer" style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="hiyaghar-btn-submit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-floppy-disk"></i>
                {editingId ? 'Update Combo Pack' : 'Save New Combo Pack'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
