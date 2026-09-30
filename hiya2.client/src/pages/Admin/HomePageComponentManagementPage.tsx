import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError, extractApiErrorMessage } from '../../utils/alertService';
import { HomePageService, type HomePageComponent, type HomePageComponentItem } from '../../services/homePageService';

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface VariantOption {
  id: number;
  variantName?: string;
  attributeValue?: string;
  sku?: string;
  price?: number;
}

interface ProductOption {
  id: number;
  productName: string;
  variants?: VariantOption[];
}

interface ProductVariantPair {
  productId: number;
  variantId?: number;
}

interface DraftItem {
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  refType: string;
  selectedCategoryIds: number[];
  selectedProductVariantPairs: ProductVariantPair[];
  tempProductId: string;
  tempVariantId: string;
  displayOrder: number;
  isActive: boolean;
}

export const HomePageComponentManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('HOMEPAGECOMPONENT');
  const [components, setComponents] = useState<HomePageComponent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<HomePageComponent | null>(null);

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    type: 'Carousel',
    displayOrder: 1,
    isActive: true,
  });

  const [itemsDraft, setItemsDraft] = useState<DraftItem[]>([]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadComponents();
    loadLookupData();
  }, []);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const data = await HomePageService.getComponents();
      setComponents(data || []);
    } catch (err) {
      console.warn('Failed to load components:', err);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLookupData = async () => {
    try {
      const catRes = await fetch('/api/category', { headers: AdminAuthService.getAuthHeaders() });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories((catData || []).filter((c: any) => c.isActive !== false));
      }

      const prodRes = await fetch('/api/product?onlyActive=true', { headers: AdminAuthService.getAuthHeaders() });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts((prodData || []).filter((p: any) => p.isActive !== false));
      }
    } catch (err) {
      console.warn('Failed to load lookup data for categories/products:', err);
    }
  };

  const parseItemRefId = (refType?: string, refId?: string) => {
    let categoryIds: number[] = [];
    let pairs: ProductVariantPair[] = [];

    if (!refId) {
      return { categoryIds, pairs };
    }

    if (refType === 'Category') {
      categoryIds = refId
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    } else {
      pairs = HomePageService.parseProductVariantRefIds(refId);
    }

    return { categoryIds, pairs };
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      key: '',
      name: '',
      type: 'Carousel',
      displayOrder: components.length + 1,
      isActive: true,
    });
    setItemsDraft([
      {
        title: '',
        subtitle: '',
        description: '',
        refType: 'Product',
        selectedCategoryIds: [],
        selectedProductVariantPairs: [],
        tempProductId: '',
        tempVariantId: '',
        displayOrder: 1,
        isActive: true,
      },
    ]);
    setViewMode('form');
  };

  const handleOpenEdit = (item: HomePageComponent) => {
    setEditingItem(item);
    setFormData({
      key: item.key,
      name: item.name,
      type: item.type || 'Carousel',
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });

    const parsedItems: DraftItem[] = (item.items || []).map((it) => {
      const { categoryIds, pairs } = parseItemRefId(it.refType, it.refId);
      return {
        id: it.id,
        title: it.title || '',
        subtitle: it.subtitle || '',
        description: it.description || '',
        refType: it.refType || 'Product',
        selectedCategoryIds: categoryIds,
        selectedProductVariantPairs: pairs,
        tempProductId: '',
        tempVariantId: '',
        displayOrder: it.displayOrder || 1,
        isActive: it.isActive !== false,
      };
    });

    if (parsedItems.length === 0) {
      parsedItems.push({
        title: '',
        subtitle: '',
        description: '',
        refType: 'Product',
        selectedCategoryIds: [],
        selectedProductVariantPairs: [],
        tempProductId: '',
        tempVariantId: '',
        displayOrder: 1,
        isActive: true,
      });
    }

    setItemsDraft(parsedItems);
    setViewMode('form');
  };

  const handleDelete = async (item: HomePageComponent) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${item.name}' component?`, 'Delete Component');
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/homepagecomponent/${item.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        setComponents((prev) => prev.filter((c) => c.id !== item.id));
        showToastMsg(`Component '${item.name}' deleted.`);
      } else {
        setComponents((prev) => prev.filter((c) => c.id !== item.id));
        showToastMsg(`Component '${item.name}' removed.`);
      }
    } catch (e) {
      setComponents((prev) => prev.filter((c) => c.id !== item.id));
      showToastMsg(`Component '${item.name}' deleted.`);
    }
  };

  const handleItemChange = (index: number, field: keyof DraftItem, value: any) => {
    setItemsDraft((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'refType') {
        target.selectedCategoryIds = [];
        target.selectedProductVariantPairs = [];
        target.tempProductId = '';
        target.tempVariantId = '';
      }

      if (field === 'tempProductId') {
        target.tempVariantId = '';
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleToggleCategory = (itemIndex: number, catId: number) => {
    setItemsDraft((prev) => {
      const updated = [...prev];
      const target = { ...updated[itemIndex] };
      if (target.selectedCategoryIds.includes(catId)) {
        target.selectedCategoryIds = target.selectedCategoryIds.filter((id) => id !== catId);
      } else {
        target.selectedCategoryIds = [...target.selectedCategoryIds, catId];
      }
      updated[itemIndex] = target;
      return updated;
    });
  };

  const handleAddProductPair = (index: number) => {
    setItemsDraft((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      const pId = Number(target.tempProductId);
      if (!pId) return prev;

      const vId = target.tempVariantId ? Number(target.tempVariantId) : undefined;
      const exists = target.selectedProductVariantPairs.some(
        (pair) => pair.productId === pId && pair.variantId === vId
      );

      if (!exists) {
        target.selectedProductVariantPairs = [
          ...target.selectedProductVariantPairs,
          { productId: pId, variantId: vId },
        ];
      }

      target.tempProductId = '';
      target.tempVariantId = '';
      updated[index] = target;
      return updated;
    });
  };

  const handleRemoveProductPair = (itemIndex: number, pairIndex: number) => {
    setItemsDraft((prev) => {
      const updated = [...prev];
      const target = { ...updated[itemIndex] };
      target.selectedProductVariantPairs = target.selectedProductVariantPairs.filter((_, idx) => idx !== pairIndex);
      updated[itemIndex] = target;
      return updated;
    });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key.trim() || !formData.name.trim()) return;

    const formattedItems: HomePageComponentItem[] = itemsDraft.map((it, idx) => {
      let computedRefId = '';
      if (it.refType === 'Category') {
        computedRefId = (it.selectedCategoryIds || []).join(',');
      } else {
        computedRefId = (it.selectedProductVariantPairs || [])
          .map((pair) => (pair.variantId ? `${pair.productId}-${pair.variantId}` : `${pair.productId}`))
          .join(',');
      }

      return {
        id: it.id || 0,
        componentId: editingItem ? editingItem.id : 0,
        title: it.title,
        subtitle: it.subtitle,
        description: it.description,
        refId: computedRefId,
        refType: it.refType,
        displayOrder: Number(it.displayOrder || idx + 1),
        isActive: it.isActive,
        isDeleted: false,
        createdBy: 1,
      };
    });

    if (editingItem) {
      const updated: HomePageComponent = {
        ...editingItem,
        key: formData.key.trim(),
        name: formData.name.trim(),
        type: formData.type,
        displayOrder: Number(formData.displayOrder),
        isActive: formData.isActive,
        items: formattedItems,
      };

      try {
        const res = await fetch(`/api/homepagecomponent/${editingItem.id}`, {
          method: 'PUT',
          headers: AdminAuthService.getAuthHeaders(),
          body: JSON.stringify(updated),
        });

        if (!res.ok) {
          const message = await extractApiErrorMessage(res, 'Failed to update component. Please try again.');
          await showError(message, 'Save Error');
          return;
        }
      } catch (e) {
        await showError('Failed to update component. Please check your connection and try again.', 'Save Error');
        return;
      }

      await loadComponents();
      showToastMsg(`Component '${formData.name}' updated successfully.`);
    } else {
      const newItemPayload = {
        id: 0,
        key: formData.key.trim(),
        name: formData.name.trim(),
        type: formData.type,
        displayOrder: Number(formData.displayOrder),
        isActive: formData.isActive,
        isDeleted: false,
        createdBy: 1,
        items: formattedItems,
      };

      try {
        const res = await fetch('/api/homepagecomponent', {
          method: 'POST',
          headers: AdminAuthService.getAuthHeaders(),
          body: JSON.stringify(newItemPayload),
        });

        if (!res.ok) {
          const message = await extractApiErrorMessage(res, 'Failed to create component. Please try again.');
          await showError(message, 'Save Error');
          return;
        }
      } catch (e) {
        await showError('Failed to create component. Please check your connection and try again.', 'Save Error');
        return;
      }

      await loadComponents();
      showToastMsg(`Component '${formData.name}' created successfully.`);
    }

    setViewMode('list');
  };

  const columns: ColumnDef<HomePageComponent>[] = [
    { key: 'id', label: 'ID' },
    { key: 'key', label: 'Component Key' },
    { key: 'name', label: 'Component Name' },
    { key: 'displayOrder', label: 'Order' },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) => (
        <span className={`hiyaghar-status-pill ${item.isActive ? 'is-active' : 'is-inactive'}`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="hiyaghar-admin-page-container">
      {toast && <div className="hiyaghar-admin-toast">{toast}</div>}

      {viewMode === 'list' ? (
        <DataTable
          title="Home Page Components Management"
          addButtonText="+ Add Component"
          columns={columns}
          data={components}
          loading={loading}
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
              {editingItem ? `Update Component: ${editingItem.name}` : 'Add New Component'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Component Listing
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            {/* PARENT COMPONENT FIELDS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Component Key *</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. HERO_BANNER"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  required
                  disabled={!!editingItem}
                  style={{ background: editingItem ? '#f1f5f9' : '#ffffff' }}
                />
              </div>

              <div className="hiyaghar-form-group">
                <label>Component Name *</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. Hero Banner Slider"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="hiyaghar-form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="hiyaghar-form-group" style={{ marginTop: '12px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                Component Status *
              </label>
              <div style={{ display: 'inline-flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: true })}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: formData.isActive ? '#2d6a4f' : 'transparent',
                    color: formData.isActive ? '#ffffff' : '#64748b',
                    boxShadow: formData.isActive ? '0 2px 4px rgba(45,106,79,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ✓ Active (1)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: false })}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: !formData.isActive ? '#dc2626' : 'transparent',
                    color: !formData.isActive ? '#ffffff' : '#64748b',
                    boxShadow: !formData.isActive ? '0 2px 4px rgba(220,38,38,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ✕ Inactive (0)
                </button>
              </div>
            </div>

            {/* CHILD ITEMS SECTION */}
            <div className="hiyaghar-form-group" style={{ marginTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>
                  🧩 Child Component Item Details
                </label>
              </div>

              {itemsDraft.map((item, index) => {
                const selectedProd = products.find((p) => String(p.id) === String(item.tempProductId));
                const availableVariants = selectedProd?.variants || [];

                return (
                  <div key={index} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* ROW 1: TITLE, SUBTITLE, REF TYPE */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div className="hiyaghar-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          maxLength={150}
                          placeholder="Item Title"
                          value={item.title}
                          onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                        />
                      </div>

                      <div className="hiyaghar-form-group">
                        <label>Subtitle</label>
                        <input
                          type="text"
                          maxLength={200}
                          placeholder="Item Subtitle"
                          value={item.subtitle}
                          onChange={(e) => handleItemChange(index, 'subtitle', e.target.value)}
                        />
                      </div>

                      <div className="hiyaghar-form-group">
                        <label>Ref Type</label>
                        <select
                          value={item.refType}
                          onChange={(e) => handleItemChange(index, 'refType', e.target.value)}
                          className="hiyaghar-select-pagesize"
                          style={{ padding: '10px 14px', width: '100%' }}
                        >
                          <option value="Product">Product / Variants</option>
                          <option value="Category">Category</option>
                        </select>
                      </div>
                    </div>

                    {/* ROW 2: DYNAMIC MULTI-SELECT SELECTION FOR CATEGORY / PRODUCT & VARIANT */}
                    <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      {item.refType === 'Category' ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                              Select Categories ({item.selectedCategoryIds.length} selected):
                            </label>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '180px', overflowY: 'auto', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            {categories.map((cat) => {
                              const isChecked = item.selectedCategoryIds.includes(cat.id);
                              return (
                                <label
                                  key={cat.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    background: isChecked ? '#e8f5e9' : '#f8fafc',
                                    border: isChecked ? '1px solid #2d6a4f' : '1px solid #cbd5e1',
                                    color: isChecked ? '#2d6a4f' : '#475569',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleCategory(index, cat.id)}
                                    style={{ accentColor: '#2d6a4f' }}
                                  />
                                  {cat.categoryName}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                              Select Products & Variants ({item.selectedProductVariantPairs.length} selected):
                            </label>
                          </div>

                          {/* PAIR SELECTOR CONTROL PANEL */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                            <div className="hiyaghar-form-group">
                              <label style={{ fontSize: '0.8rem', color: '#475569' }}>Select Product</label>
                              <select
                                value={item.tempProductId}
                                onChange={(e) => handleItemChange(index, 'tempProductId', e.target.value)}
                                className="hiyaghar-select-pagesize"
                                style={{ padding: '8px 12px', width: '100%', background: '#ffffff' }}
                              >
                                <option value="">-- Choose Product --</option>
                                {products.map((prod) => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.productName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="hiyaghar-form-group">
                              <label style={{ fontSize: '0.8rem', color: '#475569' }}>Select Variant (Optional)</label>
                              <select
                                value={item.tempVariantId}
                                onChange={(e) => handleItemChange(index, 'tempVariantId', e.target.value)}
                                disabled={!item.tempProductId || availableVariants.length === 0}
                                className="hiyaghar-select-pagesize"
                                style={{
                                  padding: '8px 12px',
                                  width: '100%',
                                  background: (!item.tempProductId || availableVariants.length === 0) ? '#f1f5f9' : '#ffffff',
                                }}
                              >
                                <option value="">
                                  {!item.tempProductId
                                    ? '-- Select Product First --'
                                    : availableVariants.length === 0
                                    ? '-- No Variants Available --'
                                    : '-- All Variants / Default --'}
                                </option>
                                {availableVariants.map((v) => {
                                  const label = v.variantName || v.attributeValue || `Variant #${v.id}`;
                                  return (
                                    <option key={v.id} value={v.id}>
                                      {label} {v.price ? `(₹${v.price})` : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddProductPair(index)}
                              disabled={!item.tempProductId}
                              style={{
                                background: item.tempProductId ? '#2d6a4f' : '#94a3b8',
                                color: '#ffffff',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: item.tempProductId ? 'pointer' : 'not-allowed',
                                height: '40px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              + Add to List
                            </button>
                          </div>

                          {/* SELECTED PRODUCT-VARIANT PILL TAGS */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                            {item.selectedProductVariantPairs.length === 0 ? (
                              <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                                No products selected yet. Select a product above and click "+ Add to List".
                              </span>
                            ) : (
                              item.selectedProductVariantPairs.map((pair, pIdx) => {
                                const prodObj = products.find((p) => p.id === pair.productId);
                                const varObj = pair.variantId ? prodObj?.variants?.find((v) => v.id === pair.variantId) : undefined;

                                const prodName = prodObj ? prodObj.productName : `Product #${pair.productId}`;
                                const varLabel = varObj ? (varObj.variantName || `Var #${pair.variantId}`) : pair.variantId ? `Var #${pair.variantId}` : null;

                                return (
                                  <div
                                    key={pIdx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      background: '#ffffff',
                                      border: '1px solid #2d6a4f',
                                      padding: '6px 12px',
                                      borderRadius: '20px',
                                      fontSize: '0.84rem',
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    }}
                                  >
                                    <span style={{ color: '#2d6a4f' }}>🛍️ {prodName}</span>
                                    {varLabel && (
                                      <span style={{ background: '#e8f5e9', color: '#1b4332', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
                                        {varLabel}
                                      </span>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                                      ({pair.variantId ? `${pair.productId}-${pair.variantId}` : pair.productId})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProductPair(index, pIdx)}
                                      style={{
                                        border: 'none',
                                        background: '#fee2e2',
                                        color: '#ef4444',
                                        borderRadius: '50%',
                                        width: '18px',
                                        height: '18px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        marginLeft: '4px',
                                      }}
                                      title="Remove pair"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ROW 3: DESCRIPTION, ORDER, ACTIVE */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                      <div className="hiyaghar-form-group">
                        <label>Description</label>
                        <input
                          type="text"
                          maxLength={500}
                          placeholder="Optional item description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </div>

                      <div className="hiyaghar-form-group">
                        <label>Item Order</label>
                        <input
                          type="number"
                          value={item.displayOrder}
                          onChange={(e) => handleItemChange(index, 'displayOrder', Number(e.target.value))}
                        />
                      </div>

                      <div className="hiyaghar-form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', marginTop: '22px' }}>
                        <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={item.isActive}
                            onChange={(e) => handleItemChange(index, 'isActive', e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#2d6a4f' }}
                          />
                          Item Active
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MODAL FOOTER ACTIONS MATCHING CATEGORY DESIGN EXACTLY */}
            <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button type="submit" className="hiyaghar-btn-submit">
                {editingItem ? 'Update Component' : 'Save Component'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
