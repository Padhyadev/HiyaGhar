import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError } from '../../utils/alertService';

interface ProductOption {
  id: number;
  productName: string;
}

interface OccasionProduct {
  id: number;
  productName: string;
  mainImagePath?: string;
}

interface OccasionItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  bannerImagePath?: string;
  displayOrder: number;
  isActive: boolean;
  products: OccasionProduct[];
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const GiftHamperManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('GIFTHAMPER');
  const [occasions, setOccasions] = useState<OccasionItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<OccasionItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 1,
    isActive: true,
  });

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [tempProductId, setTempProductId] = useState<string>('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>('');
  const [bannerImagePath, setBannerImagePath] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadOccasions();
    loadProducts();
  }, []);

  const loadOccasions = async () => {
    try {
      const res = await fetch('/api/gifthamper/occasions', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        setOccasions(await res.json());
      } else {
        setOccasions([]);
      }
    } catch (e) {
      console.warn('Error loading gift hamper occasions:', e);
      setOccasions([]);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/product?onlyActive=true', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProducts((data || []).filter((p: any) => p.isActive !== false));
      }
    } catch (e) {
      console.warn('Error loading products:', e);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setImageError(null);
    setFormData({ name: '', slug: '', description: '', displayOrder: occasions.length + 1, isActive: true });
    setSelectedProductIds([]);
    setTempProductId('');
    setBannerFile(null);
    setBannerPreviewUrl('');
    setBannerImagePath('');
    setViewMode('form');
  };

  const handleOpenEdit = (item: OccasionItem) => {
    setEditingItem(item);
    setImageError(null);
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      displayOrder: item.displayOrder,
      isActive: item.isActive !== false,
    });
    setSelectedProductIds(item.products.map((p) => p.id));
    setTempProductId('');
    setBannerFile(null);
    setBannerPreviewUrl(item.bannerImagePath || '/uploads/Noimage.png');
    setBannerImagePath(item.bannerImagePath || '');
    setViewMode('form');
  };

  const handleDelete = async (item: OccasionItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete the '${item.name}' occasion?`, 'Delete Occasion');
    if (!isConfirmed) return;
    try {
      await fetch(`/api/gifthamper/occasions/${item.id}`, { method: 'DELETE', headers: AdminAuthService.getAuthHeaders() });
    } finally {
      setOccasions((prev) => prev.filter((o) => o.id !== item.id));
      showToastMsg(`Occasion '${item.name}' deleted.`);
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const errMsg = `❌ Error: Photo '${file.name}' (${fileSizeMB} MB) exceeds maximum allowed size of 2 MB!`;
      setImageError(errMsg);
      showToastMsg(errMsg);
      e.target.value = '';
      return;
    }
    setImageError(null);
    setBannerFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBannerPreviewUrl(dataUrl);
        setBannerImagePath(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = () => {
    const pId = Number(tempProductId);
    if (!pId || selectedProductIds.includes(pId)) return;
    setSelectedProductIds((prev) => [...prev, pId]);
    setTempProductId('');
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);

    const slug = formData.slug.trim() ? slugify(formData.slug) : slugify(formData.name);

    const bodyFormData = new FormData();
    if (editingItem) bodyFormData.append('Id', editingItem.id.toString());
    bodyFormData.append('Name', formData.name.trim());
    bodyFormData.append('Slug', slug);
    bodyFormData.append('Description', formData.description.trim());
    bodyFormData.append('BannerImagePath', bannerImagePath || (editingItem?.bannerImagePath ?? ''));
    bodyFormData.append('DisplayOrder', String(formData.displayOrder));
    bodyFormData.append('IsActive', formData.isActive ? 'true' : 'false');
    if (bannerFile) {
      bodyFormData.append('bannerImage', bannerFile);
    }

    try {
      const url = editingItem ? `/api/gifthamper/occasions/${editingItem.id}` : '/api/gifthamper/occasions';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: AdminAuthService.getAuthHeadersForFormData(), body: bodyFormData });

      if (!res.ok) {
        let errText = 'Failed to save occasion.';
        try {
          const errData = await res.json();
          errText = errData.message || JSON.stringify(errData);
        } catch {
          errText = await res.text();
        }
        await showError(errText, 'Save Error');
        setIsSaving(false);
        return;
      }

      const saved = await res.json();

      // If a product was picked in the dropdown but never explicitly added
      // via "+ Add to List", include it anyway rather than silently losing
      // the selection on save.
      const pendingId = Number(tempProductId);
      const finalProductIds =
        pendingId && !selectedProductIds.includes(pendingId)
          ? [...selectedProductIds, pendingId]
          : selectedProductIds;

      const productsRes = await fetch(`/api/gifthamper/occasions/${saved.id}/products`, {
        method: 'PUT',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ productIds: finalProductIds }),
      });

      if (!productsRes.ok) {
        await showError('Occasion saved, but updating its product list failed. Please try again.', 'Save Error');
        setIsSaving(false);
        return;
      }

      showToastMsg(`Occasion '${formData.name}' saved successfully!`);
      await loadOccasions();
      setViewMode('list');
    } catch (e) {
      await showError('Network Error: Could not save occasion.', 'Save Error');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: ColumnDef<OccasionItem>[] = [
    {
      key: 'name',
      label: 'Occasion',
      render: (o) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={o.bannerImagePath || '/uploads/Noimage.png'}
            onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/Noimage.png'; }}
            alt={o.name}
            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>/{o.slug}</div>
          </div>
        </div>
      ),
    },
    { key: 'products', label: 'Products', render: (o) => <span>{o.products.length} product{o.products.length === 1 ? '' : 's'}</span> },
    { key: 'displayOrder', label: 'Order' },
    {
      key: 'status',
      label: 'Status',
      render: (o) => (
        <span className={`hiyaghar-role-badge ${o.isActive ? 'system' : ''}`}>{o.isActive ? 'Active' : 'Inactive'}</span>
      ),
    },
  ];

  const availableProducts = products.filter((p) => !selectedProductIds.includes(p.id));

  return (
    <div>
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

      {viewMode === 'list' ? (
        <DataTable<OccasionItem>
          title="Gift Hamper Occasions"
          addButtonText="+ Add Occasion"
          columns={columns}
          data={occasions}
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
              {editingItem ? `Update Occasion: ${editingItem.name}` : 'Add New Gift Hamper Occasion'}
            </h2>
            <button type="button" className="hiyaghar-export-btn" onClick={() => setViewMode('list')}>
              ← Back to Occasion Listing
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Occasion Name *</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Birthday"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: editingItem ? prev.slug : slugify(name),
                    }));
                  }}
                  required
                />
              </div>

              <div className="hiyaghar-form-group">
                <label>URL Slug *</label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g. birthday"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="hiyaghar-form-group">
              <label>Description</label>
              <textarea
                placeholder="Short description shown on the occasion banner..."
                maxLength={250}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="hiyaghar-form-group" style={{ maxWidth: '200px' }}>
              <label>Display Order</label>
              <input
                type="number"
                min={1}
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              />
            </div>

            <div className="hiyaghar-form-group" style={{ marginTop: '16px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                Occasion Status *
              </label>
              <div
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                  padding: '8px 16px', borderRadius: '30px',
                  border: formData.isActive ? '1px solid #2d6a4f' : '1px solid #dc2626',
                  background: formData.isActive ? '#e8f5e9' : '#fef2f2', userSelect: 'none',
                }}
              >
                <div style={{ width: '46px', height: '24px', borderRadius: '12px', background: formData.isActive ? '#2d6a4f' : '#dc2626', position: 'relative' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: formData.isActive ? '24px' : '2px', transition: 'left 0.2s ease' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: formData.isActive ? '#1b4332' : '#991b1b' }}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* BANNER IMAGE */}
            <div className="hiyaghar-form-group" style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {imageError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: '#991b1b', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>{imageError}</div>
                  <button type="button" onClick={() => setImageError(null)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 800 }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>🖼️ Occasion Banner Image (Max 2 MB)</label>
                <label className="hiyaghar-add-entity-btn" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  📁 Select Banner Image
                  <input type="file" accept="image/*" onChange={handleBannerSelect} style={{ display: 'none' }} />
                </label>
              </div>

              {bannerPreviewUrl ? (
                <div style={{ display: 'inline-block', position: 'relative', border: '2px solid #2d6a4f', borderRadius: '10px', padding: '10px', background: '#f0fdf4' }}>
                  <img
                    src={bannerPreviewUrl}
                    alt="Banner Preview"
                    style={{ width: '220px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/Noimage.png'; }}
                  />
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#64748b' }}>
                  No banner image selected yet.
                </div>
              )}
            </div>

            {/* PRODUCT PICKER */}
            <div className="hiyaghar-form-group" style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '12px', display: 'block' }}>
                🎁 Products in this Occasion ({selectedProductIds.length} selected)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end', marginBottom: '14px' }}>
                <div className="hiyaghar-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: '#475569' }}>Select Product</label>
                  <select
                    value={tempProductId}
                    onChange={(e) => setTempProductId(e.target.value)}
                    className="hiyaghar-select-pagesize"
                    style={{ padding: '8px 12px', width: '100%', background: '#ffffff' }}
                  >
                    <option value="">-- Choose Product --</option>
                    {availableProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>{prod.productName}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!tempProductId}
                  style={{
                    background: tempProductId ? '#2d6a4f' : '#94a3b8', color: '#ffffff', border: 'none',
                    padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
                    cursor: tempProductId ? 'pointer' : 'not-allowed', height: '40px',
                  }}
                >
                  + Add to List
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedProductIds.length === 0 ? (
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                    No products selected yet. Choose a product above and click "+ Add to List".
                  </span>
                ) : (
                  selectedProductIds.map((pid) => {
                    const prod = products.find((p) => p.id === pid);
                    return (
                      <div
                        key={pid}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ffffff',
                          border: '1px solid #2d6a4f', padding: '6px 12px', borderRadius: '20px',
                          fontSize: '0.84rem', fontWeight: 600, color: '#1e293b',
                        }}
                      >
                        <span style={{ color: '#2d6a4f' }}>🛍️ {prod ? prod.productName : `Product #${pid}`}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(pid)}
                          style={{
                            border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '50%',
                            width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800,
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="hiyaghar-btn-cancel" onClick={() => setViewMode('list')}>Cancel</button>
              <button type="submit" className="hiyaghar-btn-submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingItem ? 'Update Occasion' : 'Save Occasion'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
