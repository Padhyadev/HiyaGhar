import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showToast } from '../../utils/alertService';

interface CategoryItem {
  id: number;
  categoryName: string;
  sku?: string;
  description?: string;
  imagePath?: string;
  isActive: boolean;
}

export const CategoryManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('CATEGORY');
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);

  const [formData, setFormData] = useState({
    categoryName: '',
    sku: '',
    description: '',
    imagePath: '',
    isActive: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/category', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.warn('Error loading categories:', e);
      setCategories([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setImageError(null);
    setFormErrors({});
    setFormData({
      categoryName: '',
      sku: '',
      description: '',
      imagePath: '',
      isActive: true,
    });
    setImageFile(null);
    setImagePreviewUrl('');
    setViewMode('form');
  };

  const handleOpenEdit = (item: CategoryItem) => {
    setEditingItem(item);
    setImageError(null);
    setFormErrors({});
    setFormData({
      categoryName: item.categoryName,
      sku: item.sku || '',
      description: item.description || '',
      imagePath: item.imagePath || '',
      isActive: item.isActive !== false,
    });
    setImageFile(null);
    setImagePreviewUrl(item.imagePath || '/uploads/Noimage.png');
    setViewMode('form');
  };

  const handleDelete = async (item: CategoryItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${item.categoryName}' category?`, 'Delete Category');
    if (!isConfirmed) return;
    try {
      await fetch(`/api/category/${item.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      setCategories((prev) => prev.filter((c) => c.id !== item.id));
      showToastMsg(`Category ${item.categoryName} deleted.`);
    } catch (e) {
      setCategories((prev) => prev.filter((c) => c.id !== item.id));
      showToastMsg(`Category ${item.categoryName} deleted.`);
    }
  };

  const handleSingleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const errMsg = `❌ Error: Photo '${file.name}' (${fileSizeMB} MB) exceeds maximum allowed size of 2 MB!`;
        setImageError(errMsg);
        showToastMsg(errMsg);
        e.target.value = '';
        return;
      }
      setImageError(null);
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreviewUrl(dataUrl);
          setFormData((prev) => ({ ...prev, imagePath: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl('');
    setFormData((prev) => ({ ...prev, imagePath: '' }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.categoryName.trim()) {
      newErrors.categoryName = 'Please enter category name';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    const bodyFormData = new FormData();
    if (editingItem) bodyFormData.append('Id', editingItem.id.toString());
    bodyFormData.append('CategoryName', formData.categoryName.trim());
    bodyFormData.append('SKU', formData.sku.trim() || `CAT-${Date.now()}`);
    bodyFormData.append('Description', formData.description.trim());
    bodyFormData.append('ImagePath', formData.imagePath || (imagePreviewUrl && !imageFile ? imagePreviewUrl : '/uploads/Noimage.png'));
    bodyFormData.append('IsActive', formData.isActive ? 'true' : 'false');

    if (imageFile) {
      bodyFormData.append('imageFile', imageFile);
    }

    try {
      const url = editingItem ? `/api/category/${editingItem.id}` : '/api/category';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: AdminAuthService.getAuthHeadersForFormData(),
        body: bodyFormData,
      });

      if (res.ok) {
        showToastMsg(editingItem ? `Category ${formData.categoryName} updated successfully.` : `Category ${formData.categoryName} created successfully.`);
        await loadCategories();
        setViewMode('list');
      } else {
        let errText = 'Failed to save category.';
        try {
          const errData = await res.json();
          errText = errData.message || JSON.stringify(errData);
        } catch (e) {
          errText = await res.text();
        }
        showToastMsg(errText, 'error');
      }
    } catch (e) {
      showToastMsg('Could not save category. Please check your connection.', 'error');
    }
  };

  const columns: ColumnDef<CategoryItem>[] = [
    {
      key: 'categoryName',
      label: 'Category Name',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={c.imagePath || '/uploads/Noimage.png'}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/uploads/Noimage.png';
            }}
            alt={c.categoryName}
            style={{ width: '44px', height: '44px', objectFit: 'contain', padding: '2px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#F7F3E9' }}
          />
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.categoryName}</div>
        </div>
      ),
    },
    { key: 'sku', label: 'Category Code / SKU' },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      render: (c) => (
        <span className={`hiyaghar-role-badge ${c.isActive ? 'system' : ''}`}>
          {c.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {viewMode === 'list' ? (
        <DataTable<CategoryItem>
          title="Store Categories Management"
          addButtonText="+ Add Category"
          columns={columns}
          data={categories}
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
              {editingItem ? `Update Category: ${editingItem.categoryName}` : 'Add New Category'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Category Listing
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Mukhwas"
                  className={formErrors.categoryName ? 'input-error' : ''}
                  value={formData.categoryName}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryName: e.target.value });
                    if (formErrors.categoryName) setFormErrors((prev) => ({ ...prev, categoryName: '' }));
                  }}
                />
                {formErrors.categoryName && <span className="hiyaghar-field-error">{formErrors.categoryName}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>Category Code / SKU</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. MUKHWAS-CAT"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="hiyaghar-form-group">
              <label>Description</label>
              <textarea
                placeholder="Describe category products..."
                maxLength={250}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="hiyaghar-form-group" style={{ marginTop: '16px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                Category Status *
              </label>
              <div
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '30px',
                  border: formData.isActive ? '1px solid #2d6a4f' : '1px solid #dc2626',
                  background: formData.isActive ? '#e8f5e9' : '#fef2f2',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: formData.isActive ? '#2d6a4f' : '#dc2626',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '2px',
                      left: formData.isActive ? '24px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: formData.isActive ? '#1b4332' : '#991b1b',
                  }}
                >
                  {formData.isActive ? 'Active (1)' : 'Inactive (0)'}
                </span>
              </div>
            </div>

            {/* SINGLE CATEGORY IMAGE SELECTION SECTION */}
            <div className="hiyaghar-form-group" style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {imageError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>{imageError}</div>
                  <button
                    type="button"
                    onClick={() => setImageError(null)}
                    style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-image" style={{ color: '#D19A27' }}></i>
                  Category Image (Max 2 MB)
                </label>

                <label
                  className="hiyaghar-add-entity-btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#ffffff',
                  }}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  Select Category Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSingleImageSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {imagePreviewUrl ? (
                <div style={{ display: 'inline-block', position: 'relative', border: '2px solid #2d6a4f', borderRadius: '10px', padding: '10px', background: '#f0fdf4' }}>
                  <img
                    src={imagePreviewUrl}
                    alt="Category Preview"
                    style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/uploads/Noimage.png';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: '#ffffff',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    color: '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <img
                    src="/uploads/Noimage.png"
                    alt="No Category Image Selected"
                    style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: 0.8, borderRadius: '8px' }}
                  />
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155' }}>No Category Image Selected</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Click <strong>Select Category Image</strong> above to choose 1 single photo for this category.
                  </div>
                </div>
              )}
            </div>

            <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button type="submit" className="hiyaghar-btn-submit">
                {editingItem ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

