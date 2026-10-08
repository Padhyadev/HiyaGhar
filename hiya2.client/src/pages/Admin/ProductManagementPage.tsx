import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showToast } from '../../utils/alertService';
import {
  parseProductFullDescription,
  buildFullDescriptionWithMeta,
  saveStoredProductMeta,
  type ProductCustomMeta,
} from '../../utils/productMetaStore';

export interface ProductImageItem {
  id?: number;
  imagePath: string;
  isPrimary: boolean;
}

export interface VariantAttributePair {
  attributeName: string;  // e.g. "Weight", "Colour", "Packaging", "Material"
  attributeValue: string; // e.g. "100g", "Red", "Glass Jar"
}

export interface NutritionFactRow {
  id?: string;
  name: string;
  value: string;
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
  const [imageError, setImageError] = useState<string | null>(null);
  const [openAttributePickerIndex, setOpenAttributePickerIndex] = useState<number | null>(null);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    productName: '',
    categoryName: '',
    shortDescription: '',
    fullDescription: '',
    ingredientsText: '',
    benefitsText: '',
    servingSize: '100g',
    nutritionItems: [] as NutritionFactRow[],
    crossSellProductIds: [] as number[],
    isBestseller: true,
    isActive: true,
    hasVariantsMode: true,
    images: [] as ProductImageItem[],
    newImageUrl: '',
    variants: [] as ProductVariantItem[],
  });

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
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
      const headers = AdminAuthService.getAuthHeaders();
      const [prodRes, stockRes] = await Promise.allSettled([
        fetch('/api/product', { headers }),
        fetch('/api/stock', { headers }),
      ]);

      let productList: any[] = [];
      const stockMap: Record<number, number> = {};

      if (stockRes.status === 'fulfilled' && stockRes.value.ok) {
        const stockData = await stockRes.value.json();
        const items = stockData.items || [];
        items.forEach((s: any) => {
          stockMap[s.productId] = (stockMap[s.productId] || 0) + (s.availableStock ?? 0);
        });
      }

      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
        const data = await prodRes.value.json();
        if (Array.isArray(data)) {
          productList = data.map((p: any) => ({
            ...p,
            stockQuantity: stockMap[p.id] !== undefined ? stockMap[p.id] : (p.stockQuantity ?? 0),
          }));
        }
      }

      setProducts(productList);
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

  const defaultNutritionRows: NutritionFactRow[] = [
    { id: '1', name: 'Energy', value: '385 kcal' },
    { id: '2', name: 'Carbohydrates', value: '68.5g' },
    { id: '3', name: 'Protein', value: '6.2g' },
    { id: '4', name: 'Total Fat', value: '9.8g' },
    { id: '5', name: 'Dietary Fiber', value: '14.2g' },
  ];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setImageError(null);
    setFormErrors({});
    const defaultCat = categories.length > 0 ? categories[0].categoryName : '';
    setFormData({
      productName: '',
      categoryName: defaultCat,
      shortDescription: '',
      fullDescription: '',
      ingredientsText: '',
      benefitsText: '',
      servingSize: '100g',
      nutritionItems: [...defaultNutritionRows],
      crossSellProductIds: [],
      isBestseller: false,
      isActive: true,
      hasVariantsMode: false,
      images: [],
      newImageUrl: '',
      variants: [
        {
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          attributes: [],
          isNoVariant: true,
          originalPrice: 0,
          price: 0,
          isDefault: true,
        },
      ],
    });
    setViewMode('form');
  };

  const handleOpenEdit = (item: ProductItem) => {
    setEditingItem(item);
    setImageError(null);
    setFormErrors({});

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
          originalPrice: v.originalPrice ?? item.basePrice ?? 0,
          price: v.price ?? item.discountPrice ?? item.basePrice ?? 0,
          isDefault: v.isDefault,
        };
      })
      : [
          {
            sku: `SKU-${Date.now().toString().slice(-4)}`,
            attributes: [],
            isNoVariant: true,
            originalPrice: item.basePrice || 0,
            price: item.discountPrice || item.basePrice || 0,
            isDefault: true,
          },
        ];

    if (loadedVariants.length === 0) {
      loadedVariants.push({
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        attributes: [],
        isNoVariant: true,
        originalPrice: item.basePrice || 0,
        price: item.discountPrice || item.basePrice || 0,
        isDefault: true,
      });
    }

    const hasVars = loadedVariants.length > 0 && !loadedVariants.every((v) => v.isNoVariant);

    const catName = item.categoryName || (item.categoryId ? categories.find(c => c.id === item.categoryId)?.categoryName : '') || '';

    // Parse any metadata from description or storage
    const parsed = parseProductFullDescription(item.fullDescription, item.id, catName, item.productName);

    const nutritionRows: NutritionFactRow[] = parsed.nutritionalInfo
      ? Object.entries(parsed.nutritionalInfo).map(([name, value], idx) => ({
          id: `nut_${Date.now()}_${idx}`,
          name,
          value,
        }))
      : [];

    setFormData({
      productName: item.productName,
      categoryName: catName,
      shortDescription: item.shortDescription || '',
      fullDescription: parsed.cleanDescription || item.fullDescription || '',
      ingredientsText: parsed.ingredients?.join('\n') || '',
      benefitsText: parsed.benefits?.join('\n') || '',
      servingSize: parsed.servingSize || '100g',
      nutritionItems: nutritionRows,
      crossSellProductIds: Array.isArray(parsed.crossSellProductIds) ? parsed.crossSellProductIds : [],
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
    const isConfirmed = await showConfirm(`Are you sure you want to delete ${item.productName}?`, 'Delete Product');
    if (!isConfirmed) return;
    try {
      await fetch(`/api/product/${item.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      setProducts((prev) => prev.filter((p) => p.id !== item.id));
      showToastMsg(`Product ${item.productName} deleted.`);
    } catch (e) {
      setProducts((prev) => prev.filter((p) => p.id !== item.id));
      showToastMsg(`Product ${item.productName} deleted.`);
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
          const rawDataUrl = event.target?.result as string;
          if (rawDataUrl) {
            // Compress Image client-side using HTML5 Canvas to optimize Base64 size and improve browser/server speed
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_DIM = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height && width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Keep PNG/WebP transparency intact, only use JPEG for standard jpeg/jpg uploads
                const isPngOrWebp = file.type === 'image/png' || file.type === 'image/webp' || file.name.endsWith('.png') || file.name.endsWith('.webp');
                const compressedDataUrl = isPngOrWebp ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
                setFormData((prev) => {
                  const isFirst = prev.images.length === 0;
                  return {
                    ...prev,
                    images: [...prev.images, { imagePath: compressedDataUrl, isPrimary: isFirst }],
                  };
                });
              } else {
                setFormData((prev) => {
                  const isFirst = prev.images.length === 0;
                  return {
                    ...prev,
                    images: [...prev.images, { imagePath: rawDataUrl, isPrimary: isFirst }],
                  };
                });
              }
            };
            img.src = rawDataUrl;
          }
        };
        reader.readAsDataURL(file);
      });
      if (oversizedFiles.length === 0) {
        showToastMsg(`Uploaded & optimized ${validFiles.length} photo(s) to product gallery!`);
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
      return { ...prev, variants: filtered };
    });
  };

  const handleAddNutritionRow = () => {
    setFormData((prev) => ({
      ...prev,
      nutritionItems: [
        ...prev.nutritionItems,
        { id: `nut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: '', value: '' },
      ],
    }));
  };

  const handleUpdateNutritionRow = (index: number, field: 'name' | 'value', val: string) => {
    setFormData((prev) => {
      const updated = [...prev.nutritionItems];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, nutritionItems: updated };
    });
  };

  const handleRemoveNutritionRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      nutritionItems: prev.nutritionItems.filter((_, i) => i !== index),
    }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Please enter product title';
    }

    if (!formData.variants || formData.variants.length === 0) {
      newErrors.variants = 'Please add at least one product variant';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    const primaryImg = formData.images.find((img) => img.isPrimary)?.imagePath || formData.images[0]?.imagePath || '';

    const defaultVar = formData.variants.find((v) => v.isDefault) || formData.variants[0];
    const defaultBasePrice = defaultVar ? (defaultVar.originalPrice || defaultVar.price || 0) : 0;
    const defaultDiscountPrice = defaultVar ? (defaultVar.price || defaultVar.originalPrice || 0) : 0;

    const selectedCat = categories.find(
      (c) => c.categoryName.trim().toLowerCase() === formData.categoryName.trim().toLowerCase()
    );
    const catId = selectedCat ? selectedCat.id : (editingItem?.categoryId && editingItem.categoryId > 0 ? editingItem.categoryId : 1);

    const cleanIngredients = formData.ingredientsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const cleanBenefits = formData.benefitsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const nutritionMap: Record<string, string> = {};
    formData.nutritionItems.forEach((row) => {
      const k = row.name.trim();
      const v = row.value.trim();
      if (k && v) {
        nutritionMap[k] = v;
      }
    });

    const customMeta: ProductCustomMeta = {
      ingredients: cleanIngredients.length > 0 ? cleanIngredients : undefined,
      benefits: cleanBenefits.length > 0 ? cleanBenefits : undefined,
      servingSize: formData.servingSize?.trim() || '100g',
      nutritionalInfo: Object.keys(nutritionMap).length > 0 ? nutritionMap : undefined,
      crossSellProductIds: formData.crossSellProductIds && formData.crossSellProductIds.length > 0 ? formData.crossSellProductIds : undefined,
    };

    const finalFullDescription = buildFullDescriptionWithMeta(formData.fullDescription.trim(), customMeta);

    const bodyFormData = new FormData();
    if (editingItem) bodyFormData.append('Id', editingItem.id.toString());
    bodyFormData.append('ProductName', formData.productName.trim());
    bodyFormData.append('CategoryId', catId.toString());
    bodyFormData.append('CategoryName', formData.categoryName.trim());
    bodyFormData.append('ShortDescription', formData.shortDescription.trim());
    bodyFormData.append('FullDescription', finalFullDescription);
    bodyFormData.append('MainImagePath', primaryImg || '/uploads/Noimage.png');
    bodyFormData.append('IsBestseller', formData.isBestseller ? 'true' : 'false');
    bodyFormData.append('IsActive', formData.isActive ? 'true' : 'false');
    bodyFormData.append('BasePrice', defaultBasePrice.toString());
    bodyFormData.append('DiscountPrice', defaultDiscountPrice.toString());

    if (formData.variants && formData.variants.length > 0) {
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
        const savedData = await res.json().catch(() => null);
        const savedId = savedData?.id || editingItem?.id;
        if (savedId) {
          saveStoredProductMeta(savedId, customMeta);
        }
        showToastMsg(editingItem ? `Product ${formData.productName} updated successfully.` : `Product ${formData.productName} created successfully.`);
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
        showToastMsg(errText, 'error');
      }
    } catch (e) {
      showToastMsg('Could not save product. Please check your connection.', 'error');
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
      key: 'stock',
      label: 'Stock Level',
      render: (p) => {
        const qty = (p as any).stockQuantity ?? 0;
        const isLow = qty <= 5;
        const isOut = qty === 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isOut ? '#b42318' : isLow ? '#b45309' : '#166534' }}>
              {qty} Units
            </span>
            <span
              className="hiyaghar-role-badge"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                color: isOut ? '#b42318' : isLow ? '#b45309' : '#166534',
                border: `1px solid ${isOut ? '#fca5a5' : isLow ? '#fde68a' : '#86efac'}`,
                padding: '2px 6px',
                width: 'fit-content',
              }}
            >
              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
            </span>
          </div>
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

  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'IN'>('ALL');

  // Check URL query on mount for direct deep-linking from dashboard
  useEffect(() => {
    if (window.location.hash.includes('filter=low-stock')) {
      setStockFilter('LOW');
    }
  }, []);

  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Category Filter
      if (selectedCategoryFilter && selectedCategoryFilter !== 'ALL') {
        const pCat = p.categoryName || (p.categoryId ? categories.find(c => c.id === p.categoryId)?.categoryName : '') || '';
        const matchedCat = categories.find(c => c.categoryName.trim().toLowerCase() === selectedCategoryFilter.trim().toLowerCase());
        const matchByName = pCat.trim().toLowerCase() === selectedCategoryFilter.trim().toLowerCase();
        const matchById = matchedCat && p.categoryId === matchedCat.id;
        if (!matchByName && !matchById) return false;
      }

      // 2. Stock Filter
      const qty = (p as any).stockQuantity ?? 0;
      if (stockFilter === 'LOW' && qty > 5) return false;
      if (stockFilter === 'OUT' && qty !== 0) return false;
      if (stockFilter === 'IN' && qty <= 5) return false;

      return true;
    });
  }, [products, selectedCategoryFilter, categories, stockFilter]);

  const categoryFilterControl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      {/* Category Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Category:</label>
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="hiyaghar-select-pagesize"
          style={{ padding: '6px 12px', minWidth: '150px', fontWeight: 700, color: '#2d6a4f', borderColor: '#2d6a4f' }}
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

      {/* Stock Quick Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Stock Status:</label>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="hiyaghar-select-pagesize"
          style={{
            padding: '6px 12px',
            minWidth: '150px',
            fontWeight: 700,
            color: stockFilter === 'LOW' ? '#b45309' : '#10243E',
            borderColor: stockFilter === 'LOW' ? '#D19A27' : '#cbd5e1',
            background: stockFilter === 'LOW' ? '#fffbeb' : '#ffffff',
          }}
        >
          <option value="ALL">All Products ({products.length})</option>
          <option value="LOW">Low Stock ({products.filter(p => ((p as any).stockQuantity ?? 0) <= 5).length})</option>
          <option value="IN">In Stock ({products.filter(p => ((p as any).stockQuantity ?? 0) > 5).length})</option>
          <option value="OUT">Out of Stock ({products.filter(p => ((p as any).stockQuantity ?? 0) === 0).length})</option>
        </select>
      </div>
    </div>
  );

  return (
    <div>
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

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
            {/* Preserved Product Title & Category Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Product Title *</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Jamun Digest Paan Mukhwas"
                  className={formErrors.productName ? 'input-error' : ''}
                  value={formData.productName}
                  onChange={(e) => {
                    setFormData({ ...formData, productName: e.target.value });
                    if (formErrors.productName) setFormErrors((prev) => ({ ...prev, productName: '' }));
                  }}
                />
                {formErrors.productName && <span className="hiyaghar-field-error">{formErrors.productName}</span>}
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
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-images" style={{ color: '#D19A27' }}></i>
                Product Images Gallery (Multiple Images)
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
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
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  Select & Upload Multiple Photos (Max 2 MB)
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
                    Click <strong>Select & Upload Multiple Photos</strong> above to add images for this product.
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
                        <label htmlFor={`primaryImg_${index}`} style={{ fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: img.isPrimary ? '#2d6a4f' : '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {img.isPrimary ? (
                            <>
                              <i className="fa-solid fa-star" style={{ color: '#eab308' }}></i>
                              <span>Primary</span>
                            </>
                          ) : (
                            'Set Primary'
                          )}
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
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-boxes-stacked" style={{ color: '#D19A27' }}></i>
                    Product Variants & Pricing Table (ProductVariantMapping & Details) *
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    All SKU codes, MRP prices, Selling prices, and Discount savings are configured per Variant below. Stock is managed from the Stock Management page.
                  </p>
                  {formErrors.variants && <span className="hiyaghar-field-error" style={{ marginTop: '6px' }}>{formErrors.variants}</span>}
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

              {/* Table or No-Variant Message with Pricing Inputs */}
              {!formData.hasVariantsMode ? (
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        <i className="fa-solid fa-tag"></i>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                          Standard Single Product Pricing & SKU
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          This product has no multiple variants (size/weight). Set its single selling price and MRP below.
                        </p>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const singleVar = formData.variants[0] || {
                      sku: `SKU-${Date.now().toString().slice(-4)}`,
                      originalPrice: 0,
                      price: 0,
                      isDefault: true,
                      isNoVariant: true,
                      attributes: [],
                    };
                    const origP = typeof singleVar.originalPrice === 'number' ? singleVar.originalPrice : (parseFloat(singleVar.originalPrice) || 0);
                    const sellP = typeof singleVar.price === 'number' ? singleVar.price : (parseFloat(singleVar.price) || 0);
                    const savings = Math.max(0, origP - sellP);
                    const discountPct = origP > 0 ? Math.round((savings / origP) * 100) : 0;

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            SKU Code *
                          </label>
                          <input
                            type="text"
                            className="hiyaghar-form-input"
                            value={singleVar.sku || ''}
                            onChange={(e) => handleUpdateVariantField(0, 'sku', e.target.value)}
                            placeholder="e.g. SKU-1001"
                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            MRP / Original Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="hiyaghar-form-input"
                            value={singleVar.originalPrice ?? 0}
                            onChange={(e) => handleUpdateVariantField(0, 'originalPrice', parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 250"
                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Selling / Discount Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="hiyaghar-form-input"
                            value={singleVar.price ?? 0}
                            onChange={(e) => handleUpdateVariantField(0, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 209"
                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Discount Savings
                          </label>
                          <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.85rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', height: '38px', boxSizing: 'border-box' }}>
                            {savings > 0 ? (
                              <span>₹{savings} OFF ({discountPct}%)</span>
                            ) : (
                              <span style={{ color: '#64748b' }}>No Discount</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
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

            {/* PRODUCT DESCRIPTION & CONTENT SECTION */}
            <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-align-left" style={{ color: '#D19A27' }}></i>
                Product Descriptions & Details
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
                Customize the lead short description and the detailed product description shown on the product page.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div className="hiyaghar-form-group">
                  <label>Short Description (Tagline / Lead Summary)</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% natural Kathiawadi digestive mouth freshener made with organic gulkand."
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  />
                </div>

                <div className="hiyaghar-form-group">
                  <label>Detailed Full Description (Shown in Product Description Tab)</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the product background, flavor notes, crafting process, and purity standards..."
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC INGREDIENTS & BENEFITS SECTION */}
            <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-leaf" style={{ color: '#2d6a4f' }}></i>
                Ingredients & Health Benefits (Dynamic Per Product)
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
                Enter one item per line. These will render dynamically as interactive pill badges & checklist items on the product page.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="hiyaghar-form-group">
                  <label>
                    <i className="fa-solid fa-seedling" style={{ color: '#2d6a4f', marginRight: '6px' }}></i>
                    Key Ingredients (1 item per line)
                  </label>
                  <textarea
                    rows={5}
                    placeholder={`e.g.\n100% Natural Ingredients\nSun-dried Rose Gulkand\nSilver Cardamom\nSweet Coconut Flakes`}
                    value={formData.ingredientsText}
                    onChange={(e) => setFormData({ ...formData, ingredientsText: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    Tip: Enter each ingredient on a new line.
                  </div>
                </div>

                <div className="hiyaghar-form-group">
                  <label>
                    <i className="fa-solid fa-circle-check" style={{ color: '#2d6a4f', marginRight: '6px' }}></i>
                    Health & Wellness Benefits (1 item per line)
                  </label>
                  <textarea
                    rows={5}
                    placeholder={`e.g.\nAuthentic paan taste & aroma\nInstant long-lasting freshness\n100% Tobacco & Supari free\nAids post-meal digestion`}
                    value={formData.benefitsText}
                    onChange={(e) => setFormData({ ...formData, benefitsText: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    Tip: Enter each wellness benefit on a new line.
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC NUTRITIONAL FACTS SECTION */}
            <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-apple-whole" style={{ color: '#D19A27' }}></i>
                    Nutritional Facts Table
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Add or customize any nutrient parameter and specify the serving size (e.g. per 50g, 100g, 250g serving).
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.78rem', background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                    Optional (Leave blank for Non-Food / Soaps / Oils)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNutritionRow}
                    style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1.5px solid #86efac',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    title="Add another custom nutritional item"
                  >
                    <i className="fa-solid fa-plus"></i>
                    + Add Nutrient Item
                  </button>
                </div>
              </div>

              {/* Serving Size / Base Quantity selector directly from configured variant attributes */}
              {(() => {
                // Extract unique weight attributes from the Variants Table above
                const variantWeights: string[] = [];
                formData.variants.forEach((v) => {
                  v.attributes?.forEach((a) => {
                    if (
                      (a.attributeName.toLowerCase().includes('weight') ||
                        a.attributeName.toLowerCase().includes('size') ||
                        a.attributeName.toLowerCase().includes('gram') ||
                        a.attributeName.toLowerCase().includes('qty')) &&
                      !variantWeights.includes(a.attributeValue.trim())
                    ) {
                      variantWeights.push(a.attributeValue.trim());
                    }
                  });
                });

                const displayWeights = variantWeights.length > 0 ? variantWeights : ['50g', '100g', '150g', '250g', '500g'];

                return (
                  <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      <i className="fa-solid fa-scale-balanced" style={{ color: '#2d6a4f', marginRight: '6px' }}></i>
                      Nutritional Base Serving Size:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {displayWeights.map((sz) => {
                        const isSelected = formData.servingSize.trim().toLowerCase() === sz.trim().toLowerCase();
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFormData({ ...formData, servingSize: sz })}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              border: isSelected ? '1.5px solid #2d6a4f' : '1px solid #cbd5e1',
                              background: isSelected ? '#2d6a4f' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#334155',
                              boxShadow: isSelected ? '0 2px 6px rgba(45,106,79,0.2)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isSelected && <span>✓</span>}
                            <span>{sz}</span>
                          </button>
                        );
                      })}
                      <input
                        type="text"
                        placeholder="Custom (e.g. 50g)"
                        value={formData.servingSize}
                        onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                        style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#2d6a4f' }}
                      />
                    </div>
                    {variantWeights.length > 0 && (
                      <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                        (Auto-synced from your Product Attributes above: {variantWeights.join(', ')})
                      </span>
                    )}
                  </div>
                );
              })()}

              {formData.nutritionItems.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.88rem' }}>
                  No nutritional items added. Click <strong>+ Add Nutrient Item</strong> above if this is an edible product.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {formData.nutritionItems.map((item, index) => (
                    <div
                      key={item.id || index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 40px',
                        gap: '12px',
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div className="hiyaghar-form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.78rem', marginBottom: '3px', fontWeight: 700, color: '#334155' }}>
                          Nutrient / Parameter Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Energy, Protein, Added Sugar, Sodium, Calcium"
                          value={item.name}
                          onChange={(e) => handleUpdateNutritionRow(index, 'name', e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}
                        />
                      </div>

                      <div className="hiyaghar-form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.78rem', marginBottom: '3px', fontWeight: 700, color: '#334155' }}>
                          Value / Quantity (per {formData.servingSize || '100g'})
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 385 kcal, 6.2g, 15 mg, 0%"
                          value={item.value}
                          onChange={(e) => handleUpdateNutritionRow(index, 'value', e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '0.88rem', fontWeight: 600, color: '#2d6a4f' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveNutritionRow(index)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                          title="Delete Nutrient Row"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FREQUENTLY BOUGHT TOGETHER / CROSS-SELL PRODUCT SELECTOR */}
            <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-layer-group" style={{ color: '#D19A27' }}></i>
                    Frequently Bought Together (Cross-Sell Bundle)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Choose specific products to showcase in the 1-Click Bundle on this product's page. (If none selected, system will auto-recommend relevant products).
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                    {formData.crossSellProductIds.length > 0 ? `${formData.crossSellProductIds.length} Products Selected (Custom)` : 'Auto-Recommend Mode (Smart)'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '14px', maxHeight: '260px', overflowY: 'auto', padding: '4px' }}>
                {products
                  .filter((p) => !editingItem || p.id !== editingItem.id)
                  .map((p) => {
                    const isSelected = formData.crossSellProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setFormData((prev) => {
                            const exists = prev.crossSellProductIds.includes(p.id);
                            const updated = exists
                              ? prev.crossSellProductIds.filter((id) => id !== p.id)
                              : [...prev.crossSellProductIds, p.id];
                            return { ...prev, crossSellProductIds: updated };
                          });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #D19A27' : '1px solid #e2e8f0',
                          background: isSelected ? '#fffdf7' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(209, 154, 39, 0.15)' : 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent onClick
                          style={{ width: '16px', height: '16px', accentColor: '#D19A27', cursor: 'pointer' }}
                        />
                        <img
                          src={p.mainImagePath || '/uploads/Noimage.png'}
                          alt={p.productName}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/Noimage.png';
                          }}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.productName}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {p.categoryName || 'Product'} • ₹{p.discountPrice || p.basePrice || 0}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
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
