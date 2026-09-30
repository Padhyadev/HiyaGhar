import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError } from '../../utils/alertService';

export interface ProductImageItem {
  id?: number;
  imagePath: string;
  isPrimary: boolean;
}

export interface VariantAttributePair {
  attributeName: string;  // e.g. "Weight", "Colour", "Packaging", "Material"
  attributeValue: string; // e.g. "100g", "Red", "Glass Jar"
}

export interface ProductVariantItem {
  id?: number;
  sku: string;
  attributes: VariantAttributePair[]; // at most one entry per attributeName; empty + isNoVariant below means "No Variant"
  isNoVariant?: boolean;
  originalPrice: number;  // Price (MRP)
  price: number;          // SellPrice
  isDefault: boolean;
}

export interface ProductItem {
  id: number;
  productName: string;
  categoryId?: number;
  categoryName: string;
  basePrice?: number;
  discountPrice?: number;
  mainImagePath?: string;
  images?: ProductImageItem[];
  shortDescription?: string;
  fullDescription?: string;
  rating: number;
  isBestseller: boolean;
  isActive: boolean;
  variants?: ProductVariantItem[];
}

interface AttributeMaster {
  id: number;
  name: string;
  displayName: string;
  values: string[];
}

const DEFAULT_ATTRIBUTE_MASTERS: AttributeMaster[] = [
  {
    id: 0,
    name: 'No Variant',
    displayName: '🚫 No Variant',
    values: ['No Variant'],
  },
  {
    id: 1,
    name: 'Weight',
    displayName: 'Product Weight / Pack Size',
    values: ['100g', '200g', '300g', '400g', '500g', '1kg'],
  },
  {
    id: 2,
    name: 'Colour',
    displayName: 'Colour / Shade',
    values: ['Red', 'Blue', 'Green', 'Golden', 'Natural'],
  },
  {
    id: 3,
    name: 'Packaging',
    displayName: 'Packaging Type',
    values: ['Stand-Up Pouch', 'Glass Jar', 'PET Bottle', 'Gift Box'],
  },
  {
    id: 4,
    name: 'Material',
    displayName: 'Material',
    values: ['Natural Herbal', 'Organic Cotton', 'Eco Glass'],
  },
];

export const ProductManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('PRODUCT');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; categoryName: string }[]>([]);
  const [attributeMasters, setAttributeMasters] = useState<AttributeMaster[]>(DEFAULT_ATTRIBUTE_MASTERS);
  const [toast, setToast] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [openAttributePickerIndex, setOpenAttributePickerIndex] = useState<number | null>(null);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    productName: '',
    categoryName: '',
    shortDescription: '',
    fullDescription: '',
    isBestseller: true,
    isActive: true,
    hasVariantsMode: true,
    images: [] as ProductImageItem[],
    newImageUrl: '',
    variants: [] as ProductVariantItem[],
  });

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadAttributes();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/category', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data.filter((c: any) => c.isActive !== false));
        }
      }
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/product', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.warn('Error loading products:', e);
      setProducts([]);
    }
  };

  const loadAttributes = async () => {
    try {
      const res = await fetch('/api/attribute', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: AttributeMaster[] = [
            DEFAULT_ATTRIBUTE_MASTERS[0],
            ...data.map((a: any) => ({
              id: a.id,
              name: a.name,
              displayName: a.displayName || a.name,
              values: a.values ? a.values.map((v: any) => v.value) : [],
            })),
          ];
          setAttributeMasters(mapped);
        }
      }
    } catch (e) {
      console.warn('Using default attributes:', e);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setImageError(null);
    const defaultCat = categories.length > 0 ? categories[0].categoryName : '';
    setFormData({
      productName: '',
      categoryName: defaultCat,
      shortDescription: '',
      fullDescription: '',
      isBestseller: false,
      isActive: true,
      hasVariantsMode: true,
      images: [],
      newImageUrl: '',
      variants: [],
    });
    setViewMode('form');
  };

  const handleOpenEdit = (item: ProductItem) => {
    setEditingItem(item);
    setImageError(null);

    const loadedImages: ProductImageItem[] = item.images && item.images.length > 0
      ? [...item.images]
      : (item.mainImagePath && !item.mainImagePath.includes('unsplash')
        ? [{ imagePath: item.mainImagePath, isPrimary: true }]
        : []);

    if (loadedImages.length > 0 && !loadedImages.some((img) => img.isPrimary)) {
      loadedImages[0].isPrimary = true;
    }

    const loadedVariants: ProductVariantItem[] = item.variants && item.variants.length > 0
      ? item.variants.map((v: any) => {
        const attrs: VariantAttributePair[] = Array.isArray(v.attributes) && v.attributes.length > 0
          ? v.attributes
          : (v.attributeName ? [{ attributeName: v.attributeName, attributeValue: v.attributeValue }] : []);
        const isNoVariant = (v.variantName || '') === 'No Variant' || attrs.some((a) => a.attributeName === 'No Variant' || a.attributeName === 'NONE');
        return {
          id: v.id,
          sku: v.sku || `SKU-${Date.now()}`,
          attributes: isNoVariant ? [] : attrs,
          isNoVariant,
          originalPrice: v.originalPrice,
          price: v.price,
          isDefault: v.isDefault,
        };
      })
      : [];

    const hasVars = loadedVariants.length > 0 && !loadedVariants.every((v) => v.isNoVariant);

    const catName = item.categoryName || (item.categoryId ? categories.find(c => c.id === item.categoryId)?.categoryName : '') || '';

    setFormData({
      productName: item.productName,
      categoryName: catName,
      shortDescription: item.shortDescription || '',
      fullDescription: item.fullDescription || '',
      isBestseller: item.isBestseller,
      isActive: item.isActive !== false,
      hasVariantsMode: hasVars,
      images: loadedImages,
      newImageUrl: '',
      variants: loadedVariants,
    });
    setViewMode('form');
  };

  const handleDelete = async (item: ProductItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${item.productName}' product?`, 'Delete Product');
    if (!isConfirmed) return;
    try {
      await fetch(`/api/product/${item.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      setProducts((prev) => prev.filter((p) => p.id !== item.id));
      showToastMsg(`Product '${item.productName}' deleted.`);
    } catch (e) {
      setProducts((prev) => prev.filter((p) => p.id !== item.id));
      showToastMsg(`Product '${item.productName}' deleted.`);
    }
  };

  // --- IMAGE MANAGEMENT ---
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB Limit

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageError(null);

    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        oversizedFiles.push(`"${file.name}" (${fileSizeMB} MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      const errMsg = `❌ Upload Error: Photo size exceeds maximum allowed limit of 2 MB! ${oversizedFiles.join(', ')} cannot be uploaded. Please upload photos under 2 MB.`;
      setImageError(errMsg);
    }

    if (validFiles.length > 0) {
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setFormData((prev) => {
              const isFirst = prev.images.length === 0;
              return {
                ...prev,
                images: [...prev.images, { imagePath: dataUrl, isPrimary: isFirst }],
              };
            });
          }
        };
        reader.readAsDataURL(file);
      });
      if (oversizedFiles.length === 0) {
        showToastMsg(`Uploaded ${validFiles.length} photo(s) to product gallery!`);
      } else {
        showToastMsg(`Uploaded ${validFiles.length} valid photo(s). ${oversizedFiles.length} photo(s) rejected (> 2 MB).`);
      }
    }

    e.target.value = '';
  };



  const handleSetPrimaryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return { ...prev, images: filtered };
    });
  };



  const isLastVariantRowValid = () => {
    if (!formData.hasVariantsMode) return false;
    if (formData.variants.length === 0) return true;

    if (formData.variants.some((v) => v.isNoVariant)) {
      return false;
    }

    const lastRow = formData.variants[formData.variants.length - 1];
    return lastRow.attributes.length > 0 && lastRow.price > 0;
  };

  const handleAddVariantRow = () => {
    if (!formData.hasVariantsMode) {
      // Coming from "No Variant" mode: there's no other control that can get back into
      // variant mode (the per-row "Switch back to Has Variants" toggle only renders inside
      // the variant table, which is itself hidden while hasVariantsMode is false — a dead
      // end). Flip into variant mode here, carrying over the existing single-SKU row's
      // SKU/price/stock as the first real variant row instead of discarding it.
      setFormData((prev) => {
        const existing = prev.variants[0];
        const firstRow: ProductVariantItem = existing
          ? { ...existing, isNoVariant: false }
          : {
              sku: `SKU-${Date.now().toString().slice(-4)}`,
              attributes: [],
              originalPrice: 0,
              price: 0,
              isDefault: true,
            };
        return { ...prev, hasVariantsMode: true, variants: [firstRow] };
      });
      return;
    }

    if (!isLastVariantRowValid()) {
      showToastMsg('Cannot add new row. Please complete current row correctly before adding new row.');
      return;
    }

    const newVar: ProductVariantItem = {
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      attributes: [],
      originalPrice: 0,
      price: 0,
      isDefault: formData.variants.length === 0,
    };

    setFormData((prev) => ({ ...prev, variants: [...prev.variants, newVar] }));
  };

  const attributeKey = (a: VariantAttributePair) => `${a.attributeName}:::${a.attributeValue}`;

  const attributesEqual = (a: VariantAttributePair[], b: VariantAttributePair[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].map(attributeKey).sort();
    const sortedB = [...b].map(attributeKey).sort();
    return sortedA.every((k, i) => k === sortedB[i]);
  };

  const handleToggleNoVariant = (index: number) => {
    setFormData((prev) => {
      const existing = prev.variants[index];
      if (!existing.isNoVariant) {
        // Switching this row to "No Variant" collapses the whole table to just this row.
        const updatedRow: ProductVariantItem = {
          sku: existing.sku || `SKU-${Date.now().toString().slice(-4)}`,
          attributes: [],
          isNoVariant: true,
          originalPrice: existing.originalPrice || 0,
          price: existing.price || 0,
          isDefault: true,
        };
        return { ...prev, variants: [updatedRow] };
      }
      const newVariants = [...prev.variants];
      newVariants[index] = { ...existing, isNoVariant: false };
      return { ...prev, variants: newVariants };
    });
  };

  // Dual list-box: the left box lists every available "Attribute → Value" combo that
  // isn't already picked; clicking one moves it into the right box (the row's current
  // attributes). Picking a new value for an attribute already present replaces the old
  // one (so the old combo reappears on the left) rather than allowing two values for the
  // same attribute at once. Clicking an item in the right box removes it (moves it back left).
  const handleAddAttributePair = (index: number, name: string, value: string) => {
    const row = formData.variants[index];
    const newAttributes = [...row.attributes.filter((a) => a.attributeName !== name), { attributeName: name, attributeValue: value }];

    const isDuplicate = formData.variants.some((v, idx) => idx !== index && !v.isNoVariant && attributesEqual(v.attributes, newAttributes));
    if (isDuplicate) {
      showToastMsg('This exact attribute combination already exists in another row!');
      return;
    }

    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], attributes: newAttributes };
      return { ...prev, variants: newVariants };
    });
  };

  const handleRemoveAttributePair = (index: number, attributeName: string) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], attributes: newVariants[index].attributes.filter((a) => a.attributeName !== attributeName) };
      return { ...prev, variants: newVariants };
    });
  };

  const handleUpdateVariantField = (index: number, field: keyof ProductVariantItem, value: any) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = {
        ...newVariants[index],
        [field]: value,
      };
      if (field === 'isDefault' && value === true) {
        newVariants.forEach((v, idx) => {
          if (idx !== index) v.isDefault = false;
        });
      }
      return { ...prev, variants: newVariants };
    });
  };

  const handleRemoveVariantRow = (index: number) => {
    setFormData((prev) => {
      const filtered = prev.variants.filter((_, idx) => idx !== index);
      if (filtered.length === 0) {
        return { ...prev, hasVariantsMode: false, variants: [] };
      }
      if (!filtered.some((v) => v.isDefault)) {
        filtered[0].isDefault = true;
      }
      return { ...prev, variants: filtered };
    });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName) return;

    if (!formData.variants || formData.variants.length === 0) {
      await showError('Please add at least ONE Product Variant to the pricing table before saving!', 'Validation Error');
      return;
    }

    const primaryImg = formData.images.find((img) => img.isPrimary)?.imagePath || formData.images[0]?.imagePath || '';

    const defaultVar = formData.variants.find((v) => v.isDefault) || formData.variants[0];
    const defaultBasePrice = defaultVar ? defaultVar.originalPrice : 199;
    const defaultDiscountPrice = defaultVar ? defaultVar.price : 149;

    const selectedCat = categories.find(
      (c) => c.categoryName.trim().toLowerCase() === formData.categoryName.trim().toLowerCase()
    );
    const catId = selectedCat ? selectedCat.id : (editingItem?.categoryId && editingItem.categoryId > 0 ? editingItem.categoryId : 1);

    const bodyFormData = new FormData();
    if (editingItem) bodyFormData.append('Id', editingItem.id.toString());
    bodyFormData.append('ProductName', formData.productName.trim());
    bodyFormData.append('CategoryId', catId.toString());
    bodyFormData.append('CategoryName', formData.categoryName.trim());
    bodyFormData.append('ShortDescription', formData.shortDescription.trim());
    bodyFormData.append('FullDescription', formData.fullDescription.trim());
    bodyFormData.append('MainImagePath', primaryImg || '/uploads/Noimage.png');
    bodyFormData.append('IsBestseller', formData.isBestseller ? 'true' : 'false');
    bodyFormData.append('IsActive', formData.isActive ? 'true' : 'false');
    bodyFormData.append('BasePrice', defaultBasePrice.toString());
    bodyFormData.append('DiscountPrice', defaultDiscountPrice.toString());

    if (formData.hasVariantsMode && formData.variants.length > 0) {
      bodyFormData.append('VariantsJson', JSON.stringify(formData.variants));
    }

    if (formData.images.length > 0) {
      bodyFormData.append('ImagesJson', JSON.stringify(
        formData.images.map((img) => ({ id: img.id, imagePath: img.imagePath, isPrimary: img.isPrimary }))
      ));
    }

    try {
      const url = editingItem ? `/api/product/${editingItem.id}` : '/api/product';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: AdminAuthService.getAuthHeadersForFormData(),
        body: bodyFormData,
      });

      if (res.ok) {
        showToastMsg(`Product '${formData.productName}' saved successfully to database!`);
        await loadProducts();
        setViewMode('list');
      } else {
        let errText = 'Failed to save product.';
        try {
          const errData = await res.json();
          errText = errData.message || JSON.stringify(errData);
        } catch (e) {
          errText = await res.text();
        }
        showToastMsg(`❌ Error: ${errText}`);
      }
    } catch (e) {
      showToastMsg(`❌ Network Error: Could not save product to database.`);
    }
  };

  const columns: ColumnDef<ProductItem>[] = [
    {
      key: 'productName',
      label: 'Product Name',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={p.mainImagePath || '/uploads/Noimage.png'}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/uploads/Noimage.png';
            }}
            alt={p.productName}
            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.productName}</div>
        </div>
      ),
    },
    {
      key: 'categoryName',
      label: 'Category Name',
      render: (p) => {
        let catName = 'Mukhwas';
        if (typeof p.categoryName === 'string' && p.categoryName) {
          catName = p.categoryName;
        } else if ((p as any).category) {
          const c = (p as any).category;
          catName = typeof c === 'string' ? c : (c.categoryName || c.name || 'Mukhwas');
        } else if (typeof (p as any).categoryTitle === 'string') {
          catName = (p as any).categoryTitle;
        } else if (typeof (p as any).category_name === 'string') {
          catName = (p as any).category_name;
        }

        return (
          <span className="hiyaghar-role-badge system" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d6a4f', background: '#e6f4ea', border: '1px solid #2d6a4f' }}>
            {catName}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (p) => (
        <span className={`hiyaghar-role-badge ${p.isActive !== false ? 'system' : ''}`} style={{
          background: p.isActive !== false ? '#e6f4ea' : '#fee2e2',
          color: p.isActive !== false ? '#2d6a4f' : '#dc2626',
          border: `1px solid ${p.isActive !== false ? '#2d6a4f' : '#dc2626'}`
        }}>
          {p.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const displayedProducts = useMemo(() => {
    if (!selectedCategoryFilter || selectedCategoryFilter === 'ALL') {
      return products;
    }
    return products.filter((p) => {
      const pCat = p.categoryName || (p.categoryId ? categories.find(c => c.id === p.categoryId)?.categoryName : '') || '';
      if (pCat.trim().toLowerCase() === selectedCategoryFilter.trim().toLowerCase()) {
        return true;
      }
      const matchedCat = categories.find(c => c.categoryName.trim().toLowerCase() === selectedCategoryFilter.trim().toLowerCase());
      if (matchedCat && p.categoryId === matchedCat.id) {
        return true;
      }
      return false;
    });
  }, [products, selectedCategoryFilter, categories]);

  const categoryFilterControl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Filter Category:</label>
      <select
        value={selectedCategoryFilter}
        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
        className="hiyaghar-select-pagesize"
        style={{ padding: '6px 12px', minWidth: '170px', fontWeight: 700, color: '#2d6a4f', borderColor: '#2d6a4f' }}
      >
        <option value="ALL">All Categories ({products.length})</option>
        {categories.map((cat) => {
          const count = products.filter((p) => {
            if (p.categoryId === cat.id) return true;
            const pCat = p.categoryName || (p as any).category?.categoryName || '';
            return pCat.trim().toLowerCase() === cat.categoryName.trim().toLowerCase();
          }).length;
          return (
            <option key={cat.id} value={cat.categoryName}>
              {cat.categoryName} ({count})
            </option>
          );
        })}
      </select>
    </div>
  );

  return (
    <div>
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

      {viewMode === 'list' ? (
        <DataTable<ProductItem>
          title="Products Catalog Management"
          addButtonText="+ Add Product"
          columns={columns}
          data={displayedProducts}
          extraControls={categoryFilterControl}
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
              {editingItem ? `Update Product: ${editingItem.productName}` : 'Add New Product'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Catalog
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            {/* Preserved Product Title & Category Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Product Title *</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Jamun Digest Paan Mukhwas"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  required
                />
              </div>

              <div className="hiyaghar-form-group">
                <label>Category *</label>
                <select
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  className="hiyaghar-select-pagesize"
                  style={{ padding: '10px 14px' }}
                >
                  {categories.length === 0 ? (
                    <option value="">No Categories Found in Database (Add Category First)</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.categoryName}>
                        {cat.categoryName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="hiyaghar-form-group">
                <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                  Product Status *
                </label>
                <div style={{ display: 'inline-flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: true })}
                    style={{
                      padding: '8px 18px',
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
                      padding: '8px 18px',
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
            </div>

            {/* MULTIPLE IMAGES GALLERY SECTION */}
            <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                🖼️ Product Images Gallery (Multiple Images)
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
                Select and upload multiple photos for this product gallery (<strong>Max allowed size: 2 MB per photo</strong>). Select <strong>Primary</strong> for the cover image.
              </p>

              {imageError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: '#991b1b',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(239, 68, 68, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                    <span>{imageError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageError(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#991b1b',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '1rem',
                      marginLeft: '12px',
                    }}
                    title="Dismiss Error"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                {/* File Upload Button */}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#2d6a4f',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(45, 106, 79, 0.2)',
                  }}
                >
                  📁 Select & Upload Multiple Photos (Max 2 MB)
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {formData.images.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: '#f8fafc',
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
                    alt="No Photo Selected"
                    style={{ width: '90px', height: '90px', objectFit: 'contain', opacity: 0.8, borderRadius: '8px' }}
                  />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>No Photo Selected</div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Click <strong>📁 Select & Upload Multiple Photos</strong> above to add images for this product.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                  {formData.images.map((img, index) => (
                    <div
                      key={index}
                      style={{
                        border: img.isPrimary ? '2px solid #2d6a4f' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '10px',
                        background: img.isPrimary ? '#f0fdf4' : '#ffffff',
                        position: 'relative',
                        textAlign: 'center',
                      }}
                    >
                      <img
                        src={img.imagePath}
                        alt={`Product Image ${index + 1}`}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <input
                          type="radio"
                          name="primaryImageRadio"
                          id={`primaryImg_${index}`}
                          checked={img.isPrimary}
                          onChange={() => handleSetPrimaryImage(index)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor={`primaryImg_${index}`} style={{ fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: img.isPrimary ? '#2d6a4f' : '#475569' }}>
                          {img.isPrimary ? '⭐ Primary' : 'Set Primary'}
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          fontSize: '0.75rem',
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
                  ))}
                </div>
              )}
            </div>

            {/* PRODUCT VARIANT MAPPING SECTION (SKU, MRP, SellPrice, Discount Savings per Variant) */}
            <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    📦 Product Variants & Pricing Table (ProductVariantMapping & Details) *
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    All SKU codes, MRP prices, Selling prices, and Discount savings are configured per Variant below. Stock is managed from the Stock Management page.
                  </p>
                </div>
              </div>

              {/* Add Variant Row Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                  type="button"
                  className="hiyaghar-add-entity-btn"
                  onClick={handleAddVariantRow}
                  disabled={formData.hasVariantsMode && !isLastVariantRowValid()}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    opacity: !formData.hasVariantsMode || isLastVariantRowValid() ? 1 : 0.4,
                    cursor: !formData.hasVariantsMode || isLastVariantRowValid() ? 'pointer' : 'not-allowed',
                  }}
                  title={
                    !formData.hasVariantsMode
                      ? 'Switch this product to Has Product Variants and add the first variant row'
                      : !isLastVariantRowValid()
                        ? 'Complete the current row or change No Variant selection before adding new row'
                        : 'Add new variant row'
                  }
                >
                  + Add Variant Row
                </button>
              </div>

              {/* Table or No-Variant Message */}
              {!formData.hasVariantsMode ? (
                <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px border-dashed #cbd5e1' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📦</div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    No Variant Selected (Standard Single Product)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    This product has <strong>No Variant</strong>. It sells as a single product. No extra variant rows needed!
                  </p>
                </div>
              ) : (
                <div className="hiyaghar-table-responsive">
                  <table className="hiyaghar-datatable">
                    <thead>
                      <tr>
                        <th style={{ width: '34%' }}>Attributes</th>
                        <th style={{ width: '14%' }}>SKU Code</th>
                        <th style={{ width: '12%' }}>MRP Price (₹)</th>
                        <th style={{ width: '14%' }}>SellPrice (₹)</th>
                        <th style={{ width: '18%' }}>Discount Savings</th>
                        <th style={{ textAlign: 'center', width: '4%' }}>Def</th>
                        <th style={{ textAlign: 'center', width: '4%' }}>Del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                            No variants added yet. Click <strong>+ Add Variant Row</strong> to add options.
                          </td>
                        </tr>
                      ) : (
                        formData.variants.map((variant, index) => {
                          const isNoVariantRow = !!variant.isNoVariant;
                          const selectedKeys = new Set(variant.attributes.map(attributeKey));
                          const availableCombos = attributeMasters
                            .filter((attr) => attr.name !== 'No Variant' && attr.name !== 'NONE')
                            .flatMap((attr) => attr.values.map((val) => ({ attributeName: attr.name, attributeValue: val })))
                            .filter((c) => !selectedKeys.has(attributeKey(c)));

                          const rowSavings = Math.max(0, variant.originalPrice - variant.price);
                          const rowPct = variant.originalPrice > 0 ? Math.round((rowSavings / variant.originalPrice) * 100) : 0;

                          return (
                            <tr key={index} style={{ background: isNoVariantRow ? '#fef2f2' : '#ffffff' }}>
                              {/* Attributes: left is a click-to-open dropdown of available combos; right always shows what's selected. */}
                              <td>
                                {isNoVariantRow ? (
                                  <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.85rem' }}>🚫 No Variant</div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                      <div
                                        onClick={() => setOpenAttributePickerIndex(openAttributePickerIndex === index ? null : index)}
                                        style={{
                                          padding: '5px 8px',
                                          borderRadius: '6px',
                                          border: '1px solid #cbd5e1',
                                          background: '#ffffff',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          color: '#2d6a4f',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                        }}
                                      >
                                        <span>Select Attribute</span>
                                        <span>{openAttributePickerIndex === index ? '▲' : '▼'}</span>
                                      </div>
                                      {openAttributePickerIndex === index && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '2px',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            maxHeight: '140px',
                                            overflowY: 'auto',
                                            background: '#ffffff',
                                            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)',
                                            zIndex: 20,
                                          }}
                                        >
                                          {availableCombos.length === 0 ? (
                                            <div style={{ padding: '8px', fontSize: '0.7rem', color: '#94a3b8' }}>All options selected</div>
                                          ) : (
                                            availableCombos.map((c) => (
                                              <div
                                                key={attributeKey(c)}
                                                onClick={() => {
                                                  handleAddAttributePair(index, c.attributeName, c.attributeValue);
                                                  setOpenAttributePickerIndex(null);
                                                }}
                                                title="Click to add"
                                                style={{ padding: '5px 8px', fontSize: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                              >
                                                {c.attributeName} → {c.attributeValue}
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ alignSelf: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>⇄</div>
                                    <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', maxHeight: '110px', overflowY: 'auto', background: '#f8fafc' }}>
                                      {variant.attributes.length === 0 ? (
                                        <div style={{ padding: '8px', fontSize: '0.7rem', color: '#94a3b8' }}>No attributes selected yet</div>
                                      ) : (
                                        variant.attributes.map((a) => (
                                          <div
                                            key={a.attributeName}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '4px 6px 4px 8px', fontSize: '0.75rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                          >
                                            <span>{a.attributeName} → {a.attributeValue}</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveAttributePair(index, a.attributeName)}
                                              title={`Remove ${a.attributeName}`}
                                              style={{
                                                flexShrink: 0,
                                                width: '18px',
                                                height: '18px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                border: 'none',
                                                background: '#fee2e2',
                                                color: '#dc2626',
                                                fontSize: '0.75rem',
                                                fontWeight: 900,
                                                lineHeight: 1,
                                                cursor: 'pointer',
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                                {formData.variants.length <= 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleNoVariant(index)}
                                    style={{ marginTop: '6px', fontSize: '0.72rem', fontWeight: 700, color: isNoVariantRow ? '#2d6a4f' : '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  >
                                    {isNoVariantRow ? '↩ Switch back to Has Variants' : '🚫 Mark as No Variant instead'}
                                  </button>
                                )}
                              </td>

                              {/* SKU Code */}
                              <td>
                                <input
                                  type="text"
                                  placeholder="e.g. MUKH-STD"
                                  value={variant.sku}
                                  onChange={(e) => handleUpdateVariantField(index, 'sku', e.target.value)}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                />
                              </td>

                              {/* Base / MRP Price */}
                              <td>
                                <input
                                  type="number"
                                  value={variant.originalPrice === 0 ? '' : variant.originalPrice}
                                  placeholder="0"
                                  onChange={(e) => handleUpdateVariantField(index, 'originalPrice', Number(e.target.value))}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                              </td>

                              {/* Selling Price / SellPrice */}
                              <td>
                                <input
                                  type="number"
                                  value={variant.price === 0 ? '' : variant.price}
                                  placeholder="0"
                                  onChange={(e) => handleUpdateVariantField(index, 'price', Number(e.target.value))}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#2d6a4f' }}
                                  required
                                />
                              </td>

                              {/* Discount Savings Calculated */}
                              <td>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2d6a4f', padding: '6px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                  ₹{rowSavings} ({rowPct}%)
                                </div>
                              </td>

                              {/* Default Radio */}
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="radio"
                                  name="defaultVariant"
                                  checked={variant.isDefault}
                                  onChange={() => handleUpdateVariantField(index, 'isDefault', true)}
                                />
                              </td>

                              {/* Delete Action */}
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="hiyaghar-action-delete-btn"
                                  onClick={() => handleRemoveVariantRow(index)}
                                  title="Remove Row"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="hiyaghar-modal-footer" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button type="submit" className="hiyaghar-btn-submit">
                {editingItem ? 'Update Product Catalog' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
