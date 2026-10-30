import React, { useEffect, useMemo, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showToast } from '../../utils/alertService';
import { COMBO_CATEGORY_NAME, ComboService, getComboItems } from '../../services/comboService';
import type { Product as ApiProduct, ProductVariant as ApiVariant } from '../../services/productService';
import { buildFullDescriptionWithMeta, parseProductFullDescription, type ComboItem } from '../../utils/productMetaStore';
import { compressImageFile } from '../../utils/imageCompress';
import { formatVariantLabel, NO_IMAGE } from '../../utils/productFormat';
import './OrderManagementPage.css';

// Admin: Catalog > Combos (route /admin/combo-packs, permission COMBOPACK).
// A combo is saved as a product in the "Combos" category with one hidden variant: price = the combo
// price entered here, original price = total of the items (see services/comboService.ts).
// Stock is the combo's own stock, added on Stock & Inventory (only shown here).

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB, same as products
const MAX_IMAGES = 6; // server limit per variant

interface ComboImage {
  imagePath: string;
  isPrimary: boolean;
}

interface ComboRow {
  id: number;
  name: string;
  image: string;
  itemCount: number;
  itemsText: string;
  total: number;
  price: number;
  stock: number;
  isActive: boolean;
  product: ApiProduct;
}

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const stockOf = (v?: ApiVariant) => (v ? (typeof v.sellableStock === 'number' ? v.sellableStock : (v.stockQuantity || 0) - (v.reservedStock || 0)) : 0);
const variantLabel = (v?: ApiVariant) => (v ? formatVariantLabel(v.variantName) : '');
const comboVariant = (p: ApiProduct) => p.variants?.find((v) => v.isDefault) || p.variants?.[0];

const emptyForm = {
  name: '',
  shortDescription: '',
  description: '',
  images: [] as ComboImage[],
  items: [] as ComboItem[],
  price: '',
  isActive: true,
};

export const ComboManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('COMBOPACK');
  const [combos, setCombos] = useState<ApiProduct[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<ApiProduct | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickProductId, setPickProductId] = useState('');
  const [pickVariantId, setPickVariantId] = useState('');
  const [pickQty, setPickQty] = useState('1');

  const load = async () => {
    setLoading(true);
    try {
      const comboCategoryId = await ComboService.getCategoryId();
      const res = await fetch('/api/product', { headers: AdminAuthService.getAuthHeaders(), cache: 'no-store' });
      const all: ApiProduct[] = res.ok ? await res.json() : [];
      setCombos(comboCategoryId ? all.filter((p) => p.categoryId === comboCategoryId) : []);
      // Items for a combo: active, non-combo products.
      setProducts(all.filter((p) => p.isActive !== false && p.categoryId !== comboCategoryId && (p.variants?.length || 0) > 0));
    } catch {
      showToast('Could not load combos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  /** Current selling price of a combo line (live product data), else 0 if it no longer exists. */
  const linePrice = (item: ComboItem) => {
    const v = productById.get(item.productId)?.variants?.find((x) => x.id === item.variantId);
    return v ? v.price : 0;
  };
  const itemsTotal = form.items.reduce((sum, i) => sum + linePrice(i) * i.quantity, 0);
  const missingItems = form.items.filter((i) => linePrice(i) === 0);
  const comboPrice = Number(form.price) || 0;
  const saving$ = itemsTotal - comboPrice;

  const rows: ComboRow[] = combos.map((p) => {
    const v = comboVariant(p);
    const items = getComboItems(p);
    return {
      id: p.id,
      name: p.productName,
      image: p.mainImagePath || NO_IMAGE,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      itemsText: items.map((i) => `${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', '),
      total: v?.originalPrice || 0,
      price: v?.price || 0,
      stock: stockOf(v),
      isActive: p.isActive !== false,
      product: p,
    };
  });

  const columns: ColumnDef<ComboRow>[] = [
    {
      key: 'name',
      label: 'Combo',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={r.image} alt={r.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <div>
            <div style={{ fontWeight: 700 }}>{r.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 360 }}>{r.itemsText || 'No items'}</div>
          </div>
        </div>
      ),
    },
    { key: 'itemCount', label: 'Items', render: (r) => r.itemCount },
    {
      key: 'price',
      label: 'Price',
      render: (r) => (
        <span>
          {r.total > r.price && <s style={{ color: '#94a3b8', marginRight: 6 }}>{money(r.total)}</s>}
          <strong>{money(r.price)}</strong>
          {r.total > 0 && r.price >= r.total && (
            <div style={{ color: '#dc2626', fontSize: '0.75rem' }}>Not lower than item total</div>
          )}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (r) => <span style={{ color: r.stock > 0 ? '#166534' : '#dc2626', fontWeight: 700 }}>{r.stock > 0 ? r.stock : 'Out of stock'}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <span className={`hiyaghar-status-badge ${r.isActive ? 'active' : 'inactive'}`}>{r.isActive ? 'Active' : 'Inactive'}</span>,
    },
  ];

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setViewMode('form');
  };

  const openEdit = (row: ComboRow) => {
    const p = row.product;
    const v = comboVariant(p);
    const parsed = parseProductFullDescription(p.fullDescription, p.id);
    const images = (v?.images?.length ? v.images : p.images || []).map((img) => ({ imagePath: img.imagePath, isPrimary: !!img.isPrimary }));
    setEditing(p);
    setForm({
      name: p.productName,
      shortDescription: p.shortDescription || '',
      description: parsed.cleanDescription,
      images,
      items: parsed.comboItems,
      price: v ? String(v.price) : '',
      isActive: p.isActive !== false,
    });
    setErrors({});
    setViewMode('form');
  };

  const handleDelete = async (row: ComboRow) => {
    const ok = await showConfirm(`Delete combo "${row.name}"? It will no longer be shown or sold.`, 'Delete Combo');
    if (!ok) return;
    const res = await fetch(`/api/product/${row.id}`, { method: 'DELETE', headers: AdminAuthService.getAuthHeaders() });
    if (res.ok || res.status === 204) {
      showToast(`Combo ${row.name} deleted.`, 'success');
      await load();
    } else {
      showToast('Could not delete the combo.', 'error');
    }
  };

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_IMAGES - form.images.length;
    const list = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > list.length) showToast(`A combo can have at most ${MAX_IMAGES} images.`, 'info');
    const added: ComboImage[] = [];
    for (const file of list) {
      if (file.size > MAX_FILE_SIZE * 5) {
        showToast(`${file.name} is too large.`, 'error');
        continue;
      }
      added.push({ imagePath: await compressImageFile(file), isPrimary: false });
    }
    setForm((prev) => {
      const images = [...prev.images, ...added];
      if (!images.some((i) => i.isPrimary) && images.length > 0) images[0] = { ...images[0], isPrimary: true };
      return { ...prev, images };
    });
    if (errors.images) setErrors((e) => ({ ...e, images: '' }));
  };

  const removeImage = (index: number) =>
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      if (images.length > 0 && !images.some((i) => i.isPrimary)) images[0] = { ...images[0], isPrimary: true };
      return { ...prev, images };
    });

  const setPrimary = (index: number) =>
    setForm((prev) => ({ ...prev, images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index })) }));

  const pickProduct = productById.get(Number(pickProductId));

  const addItem = () => {
    const p = pickProduct;
    const variantId = Number(pickVariantId) || (p?.variants?.length === 1 ? p.variants[0].id : 0);
    const v = p?.variants?.find((x) => x.id === variantId);
    const qty = Math.max(1, Math.floor(Number(pickQty) || 1));
    if (!p || !v) {
      showToast('Select a product and its size/variant.', 'info');
      return;
    }
    setForm((prev) => {
      const existing = prev.items.find((i) => i.productId === p.id && i.variantId === v.id);
      const items = existing
        ? prev.items.map((i) => (i === existing ? { ...i, quantity: i.quantity + qty } : i))
        : [...prev.items, { productId: p.id, variantId: v.id, quantity: qty, name: p.productName, variant: variantLabel(v) }];
      return { ...prev, items };
    });
    setPickProductId('');
    setPickVariantId('');
    setPickQty('1');
    if (errors.items) setErrors((e) => ({ ...e, items: '' }));
  };

  const updateQty = (index: number, qty: number) =>
    setForm((prev) => ({ ...prev, items: prev.items.map((i, idx) => (idx === index ? { ...i, quantity: Math.max(1, qty) } : i)) }));

  const removeItem = (index: number) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Please enter the combo name';
    if (form.items.length === 0) next.items = 'Add at least one product to the combo';
    else if (form.items.reduce((s, i) => s + i.quantity, 0) < 2) next.items = 'A combo needs at least 2 items in total';
    else if (missingItems.length > 0) next.items = 'Remove products that are no longer available';
    if (!(comboPrice > 0)) next.price = 'Please enter the combo selling price';
    else if (comboPrice >= itemsTotal) next.price = `Combo price must be lower than the item total (${money(itemsTotal)})`;
    if (form.images.length === 0) next.images = 'Add at least one image';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const categoryId = await ComboService.ensureCategoryId();
      const existingVariant = editing ? comboVariant(editing) : undefined;
      const oldMeta = editing ? parseProductFullDescription(editing.fullDescription, editing.id) : null;
      const meta = {
        ...(oldMeta?.faqs.length ? { faqs: oldMeta.faqs } : {}),
        ...(oldMeta?.howToUse ? { howToUse: oldMeta.howToUse } : {}),
        ...(oldMeta?.shelfLife ? { shelfLife: oldMeta.shelfLife } : {}),
        comboItems: form.items.map((i) => ({ ...i, name: productById.get(i.productId)?.productName || i.name })),
      };
      const images = form.images.some((i) => i.isPrimary) ? form.images : form.images.map((img, i) => ({ ...img, isPrimary: i === 0 }));
      const primary = images.find((i) => i.isPrimary)?.imagePath || images[0]?.imagePath || '';

      const body = new FormData();
      if (editing) body.append('Id', String(editing.id));
      body.append('ProductName', form.name.trim());
      body.append('CategoryId', String(categoryId));
      body.append('CategoryName', COMBO_CATEGORY_NAME);
      body.append('ShortDescription', form.shortDescription.trim());
      body.append('FullDescription', buildFullDescriptionWithMeta(form.description.trim(), meta));
      body.append('MainImagePath', primary.startsWith('data:') ? '' : primary);
      body.append('IsBestseller', editing?.isFeatured ? 'true' : 'false');
      body.append('IsActive', form.isActive ? 'true' : 'false');
      body.append('BasePrice', String(itemsTotal));
      body.append('DiscountPrice', String(comboPrice));
      body.append('VariantsJson', JSON.stringify([{
        id: existingVariant?.id || 0,
        sku: existingVariant?.sku || `COMBO-${Date.now().toString(36).toUpperCase()}`,
        attributes: [],
        isNoVariant: true,
        originalPrice: itemsTotal,
        price: comboPrice,
        isDefault: true,
        images,
      }]));
      body.append('ImagesJson', '[]');

      const res = await fetch(editing ? `/api/product/${editing.id}` : '/api/product', {
        method: editing ? 'PUT' : 'POST',
        headers: AdminAuthService.getAuthHeadersForFormData(),
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast(err?.message || 'Could not save the combo.', 'error');
        return;
      }
      showToast(editing ? `Combo ${form.name} updated.` : `Combo ${form.name} created.`, 'success');
      await load();
      setViewMode('list');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the combo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <DataTable<ComboRow>
        title="Combos"
        addButtonText="+ Add Combo"
        columns={columns}
        data={rows}
        loading={loading}
        onAddClick={openAdd}
        onEditClick={openEdit}
        onDeleteClick={handleDelete}
        canAdd={currentMenuPermission.canAdd}
        canEdit={currentMenuPermission.canEdit}
        canDelete={currentMenuPermission.canDelete}
      />
    );
  }

  const currentStock = editing ? stockOf(comboVariant(editing)) : 0;
  const card: React.CSSProperties = { marginTop: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' };
  const input: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' };

  return (
    <div className="hiyaghar-datatable-card">
      <div className="hiyaghar-datatable-top-header">
        <h2 className="hiyaghar-datatable-title">{editing ? `Update Combo: ${editing.productName}` : 'Add New Combo'}</h2>
        <button type="button" className="hiyaghar-export-btn" onClick={() => setViewMode('list')}>← Back to Combos</button>
      </div>

      <form onSubmit={handleSave} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
        {/* NAME & TEXT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="hiyaghar-form-group">
            <label>Combo Name *</label>
            <input
              type="text"
              maxLength={200}
              placeholder="e.g. Pack of 3 Drakshawati"
              className={errors.name ? 'input-error' : ''}
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }}
            />
            {errors.name && <span className="hiyaghar-field-error">{errors.name}</span>}
          </div>
          <div className="hiyaghar-form-group">
            <label>Short Description</label>
            <input
              type="text"
              maxLength={300}
              placeholder="e.g. Three bottles of our best-selling raisin mukhwas"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            />
          </div>
        </div>
        <div className="hiyaghar-form-group">
          <label>Description</label>
          <textarea rows={3} style={{ ...input, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        {/* IMAGES */}
        <div style={card}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>Images * <span style={{ fontWeight: 500, color: '#64748b', fontSize: '0.85rem' }}>(up to {MAX_IMAGES}; ★ = main image)</span></h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
            {form.images.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: 110, height: 110, borderRadius: 10, overflow: 'hidden', border: img.isPrimary ? '3px solid #D19A27' : '1px solid #e2e8f0' }}>
                <img src={img.imagePath} alt={`Combo image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" title="Set as main image" onClick={() => setPrimary(i)}
                  style={{ position: 'absolute', left: 4, top: 4, border: 'none', borderRadius: 6, background: img.isPrimary ? '#D19A27' : 'rgba(255,255,255,0.9)', color: img.isPrimary ? '#fff' : '#334155', cursor: 'pointer', padding: '2px 6px' }}>★</button>
                <button type="button" title="Remove image" onClick={() => removeImage(i)}
                  style={{ position: 'absolute', right: 4, top: 4, border: 'none', borderRadius: 6, background: 'rgba(255,255,255,0.9)', color: '#ef4444', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
              </div>
            ))}
            {form.images.length < MAX_IMAGES && (
              <label style={{ width: 110, height: 110, borderRadius: 10, border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontWeight: 700, textAlign: 'center', fontSize: '0.85rem' }}>
                + Add Images
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { addImages(e.target.files); e.target.value = ''; }} />
              </label>
            )}
          </div>
          {errors.images && <span className="hiyaghar-field-error">{errors.images}</span>}
        </div>

        {/* ITEMS */}
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', fontWeight: 800 }}>Products in this Combo *</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 0.7fr auto', gap: '10px', alignItems: 'end' }}>
            <div className="hiyaghar-form-group" style={{ margin: 0 }}>
              <label>Product</label>
              <select value={pickProductId} onChange={(e) => { setPickProductId(e.target.value); setPickVariantId(''); }} style={input}>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.productName}</option>)}
              </select>
            </div>
            <div className="hiyaghar-form-group" style={{ margin: 0 }}>
              <label>Size / Variant</label>
              <select value={pickVariantId} onChange={(e) => setPickVariantId(e.target.value)} style={input} disabled={!pickProduct}>
                <option value="">{pickProduct && pickProduct.variants.length === 1 ? (variantLabel(pickProduct.variants[0]) || 'Standard') + ` – ${money(pickProduct.variants[0].price)}` : 'Select…'}</option>
                {pickProduct && pickProduct.variants.length > 1 && pickProduct.variants.map((v) => (
                  <option key={v.id} value={v.id}>{(variantLabel(v) || 'Standard')} – {money(v.price)}</option>
                ))}
              </select>
            </div>
            <div className="hiyaghar-form-group" style={{ margin: 0 }}>
              <label>Qty</label>
              <input type="number" min={1} value={pickQty} onChange={(e) => setPickQty(e.target.value)} style={input} />
            </div>
            <button type="button" className="hiyaghar-btn-submit" onClick={addItem} style={{ height: 42 }}>+ Add</button>
          </div>

          {form.items.length > 0 && (
            <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px' }}>Product</th>
                  <th style={{ padding: '8px' }}>Unit price</th>
                  <th style={{ padding: '8px', width: 90 }}>Qty</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Line total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, i) => {
                  const price = linePrice(item);
                  return (
                    <tr key={`${item.productId}-${item.variantId}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>
                        <strong>{productById.get(item.productId)?.productName || item.name}</strong>
                        {item.variant && <span style={{ color: '#64748b' }}> ({item.variant})</span>}
                        {price === 0 && <div style={{ color: '#dc2626', fontSize: '0.78rem' }}>No longer available – remove it</div>}
                      </td>
                      <td style={{ padding: '8px' }}>{money(price)}</td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateQty(i, Math.floor(Number(e.target.value) || 1))} style={{ ...input, padding: '6px 8px' }} />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{money(price * item.quantity)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button type="button" onClick={() => removeItem(i)} title="Remove" style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {errors.items && <span className="hiyaghar-field-error">{errors.items}</span>}
        </div>

        {/* PRICE, STOCK, STATUS */}
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'start' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Total of items (auto)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{money(itemsTotal)}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Shown struck through to customers</div>
            </div>
            <div className="hiyaghar-form-group" style={{ margin: 0 }}>
              <label>Combo Selling Price (₹) *</label>
              <input
                type="number"
                min={1}
                placeholder={itemsTotal > 0 ? `less than ${itemsTotal}` : ''}
                className={errors.price ? 'input-error' : ''}
                value={form.price}
                onChange={(e) => { setForm({ ...form, price: e.target.value }); if (errors.price) setErrors({ ...errors, price: '' }); }}
              />
              {errors.price && <span className="hiyaghar-field-error">{errors.price}</span>}
              {comboPrice > 0 && itemsTotal > 0 && comboPrice < itemsTotal && (
                <div style={{ color: '#166534', fontSize: '0.82rem', fontWeight: 700, marginTop: 4 }}>
                  Customer saves {money(saving$)} ({Math.round((saving$ / itemsTotal) * 100)}%)
                </div>
              )}
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>Stock</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: currentStock > 0 ? '#166534' : '#dc2626' }}>{currentStock}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                {editing ? 'Add stock on Stock & Inventory.' : 'After saving, add stock on Stock & Inventory.'}
              </div>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontWeight: 700, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (shown on the website)
          </label>
        </div>

        <div className="hiyaghar-modal-footer" style={{ marginTop: '24px' }}>
          <button type="button" className="hiyaghar-btn-cancel" onClick={() => setViewMode('list')}>Cancel</button>
          <button type="submit" className="hiyaghar-btn-submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update Combo' : 'Save Combo'}
          </button>
        </div>
      </form>
    </div>
  );
};
