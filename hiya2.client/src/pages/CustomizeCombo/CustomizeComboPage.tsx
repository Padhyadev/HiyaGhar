import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { CartService } from '../../cart';
import { ProductService, type Product as ApiProduct } from '../../services/productService';
import { CategoryService, type ApiCategory } from '../../services/categoryService';
import { ComboSettingsService, type ComboPackConfig, DEFAULT_COMBO_PACKS } from '../../services/comboSettingsService';
import { navigateTo } from '../../utils/navigation';
import { formatVariantLabel } from '../../utils/productFormat';
import './CustomizeComboPage.css';

// One real, pickable variant of a product (e.g. "100 g" vs "200 g").
export interface ComboVariantOption {
  id: number;
  label: string;
  price: number;
  originalPrice?: number;
  isDefault: boolean;
  attributes: { attributeName: string; attributeValue: string }[];
}

// Real catalog product, mapped down to exactly what the combo builder needs —
// same shape the static comboData.ts used to provide, but now sourced live from
// /api/product via ProductService (mirrors mapApiToTeaMasala/mapApiToMukhwas
// elsewhere: default-variant price, primary image, formatted weight label).
// `price`/`originalPrice`/`weight` reflect the default variant initially, but the
// full `variants` list lets the shopper pick a different one on the card.
export interface ComboProduct {
  id: string;
  name: string;
  categoryId: number;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  priceFormatted: string;
  image: string;
  weight: string;
  badge?: string;
  variants: ComboVariantOption[];
}

interface ComboCategoryOption {
  id: string;
  label: string;
}

function mapApiToComboProduct(p: ApiProduct): ComboProduct {
  const variantOptions: ComboVariantOption[] = (p.variants || []).map((v) => ({
    id: v.id,
    label: formatVariantLabel(v.variantName) || 'Standard',
    price: v.price,
    originalPrice: v.originalPrice,
    isDefault: v.isDefault,
    attributes: v.attributes || [],
  }));

  const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
  const currentPrice = defaultVariant ? defaultVariant.price : (p.discountPrice ?? p.basePrice);
  const originalPrice = defaultVariant?.originalPrice ?? p.basePrice;
  const primaryImage = p.images?.find((i) => i.isPrimary)?.imagePath || p.mainImagePath || '/uploads/Noimage.png';

  return {
    id: p.id.toString(),
    name: p.productName,
    categoryId: p.categoryId,
    categoryLabel: p.category?.categoryName || 'Product',
    price: currentPrice,
    originalPrice: originalPrice > currentPrice ? originalPrice : undefined,
    priceFormatted: `₹${currentPrice}`,
    image: primaryImage,
    weight: defaultVariant ? formatVariantLabel(defaultVariant.variantName) : '',
    badge: p.isFeatured ? 'Bestseller' : undefined,
    variants: variantOptions,
  };
}

interface CustomizeComboPageProps {
  onNavigateHome: () => void;
}

interface FlyingItem {
  id: string;
  image: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  slotIndex: number;
}

export const CustomizeComboPage: React.FC<CustomizeComboPageProps> = ({ onNavigateHome }) => {
  const [comboPacks] = useState<ComboPackConfig[]>(() => ComboSettingsService.getActivePacks());
  const [selectedPack, setSelectedPack] = useState<ComboPackConfig>(() => {
    const active = ComboSettingsService.getActivePacks();
    return active[0] || DEFAULT_COMBO_PACKS[0];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<ComboProduct[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live catalog data — replaces the old hardcoded comboData.ts import, so this
  // page always reflects whatever is actually in Admin → Products/Categories.
  const [categories, setCategories] = useState<ComboCategoryOption[]>([{ id: 'all', label: 'All Products' }]);
  const [products, setProducts] = useState<ComboProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Which attribute value is currently picked per group, per product (productId ->
  // { "Weight": "200 g", "Packing": "Bottle" }) — same grouped-attribute approach
  // ProductDetailPage.tsx uses, so "Weight" and "Packing" show as separate rows
  // instead of one long "100 g • Pouch" pill per combination.
  const [selectedAttrsByProduct, setSelectedAttrsByProduct] = useState<Record<string, Record<string, string>>>({});

  // Groups a product's variants by attribute name (e.g. "Weight" -> ["100 g", "200 g"],
  // "Packing" -> ["Pouch", "Bottle"]), sorted alphabetically like ProductDetailPage.
  const getAttributeGroups = (product: ComboProduct): { name: string; values: string[] }[] => {
    const groups: Record<string, string[]> = {};
    product.variants.forEach((v) => {
      v.attributes.forEach((a) => {
        if (!groups[a.attributeName]) groups[a.attributeName] = [];
        if (!groups[a.attributeName].includes(a.attributeValue)) groups[a.attributeName].push(a.attributeValue);
      });
    });
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, values: groups[name] }));
  };

  const getActiveVariant = (product: ComboProduct): ComboVariantOption | null => {
    if (product.variants.length === 0) return null;

    const picked = selectedAttrsByProduct[product.id];
    if (picked) {
      const pickedKeys = Object.keys(picked);
      const matched = product.variants.find((v) => {
        if (v.attributes.length !== pickedKeys.length) return false;
        return v.attributes.every((a) => picked[a.attributeName] === a.attributeValue);
      });
      if (matched) return matched;
    }

    return product.variants.find((v) => v.isDefault) || product.variants[0];
  };

  // Picking a value shouldn't land on a combination that was never saved as a real
  // variant. If the current picks + the new value don't match anything, snap the
  // OTHER groups to whatever a real variant pairs this value with — same fallback
  // ProductDetailPage.tsx uses for its attribute selector.
  const handleSelectAttrValue = (product: ComboProduct, groupName: string, value: string) => {
    const current = selectedAttrsByProduct[product.id] || (() => {
      const active = getActiveVariant(product);
      const seed: Record<string, string> = {};
      active?.attributes.forEach((a) => { seed[a.attributeName] = a.attributeValue; });
      return seed;
    })();

    const candidate = { ...current, [groupName]: value };
    const candidateKeys = Object.keys(candidate);
    const existsAsIs = product.variants.some((v) => (
      v.attributes.length === candidateKeys.length &&
      v.attributes.every((a) => candidate[a.attributeName] === a.attributeValue)
    ));

    if (existsAsIs) {
      setSelectedAttrsByProduct((prev) => ({ ...prev, [product.id]: candidate }));
      return;
    }

    const fallbackVariant = product.variants.find((v) =>
      v.attributes.some((a) => a.attributeName === groupName && a.attributeValue === value)
    );
    if (fallbackVariant) {
      const snapped: Record<string, string> = {};
      fallbackVariant.attributes.forEach((a) => { snapped[a.attributeName] = a.attributeValue; });
      setSelectedAttrsByProduct((prev) => ({ ...prev, [product.id]: snapped }));
    } else {
      setSelectedAttrsByProduct((prev) => ({ ...prev, [product.id]: candidate }));
    }
  };

  useEffect(() => {
    let isMounted = true;

    CategoryService.getCategories().then((apiCategories: ApiCategory[]) => {
      if (!isMounted || !apiCategories || apiCategories.length === 0) return;
      setCategories([
        { id: 'all', label: 'All Products' },
        ...apiCategories.map((c) => ({ id: c.id.toString(), label: c.categoryName })),
      ]);
    });

    ProductService.getProducts().then((apiProducts: ApiProduct[]) => {
      if (!isMounted) return;
      setProducts(apiProducts.map(mapApiToComboProduct));
      setIsLoadingProducts(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Flying image animation states
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [pendingSlots, setPendingSlots] = useState<number[]>([]);
  const [landingSlot, setLandingSlot] = useState<number | null>(null);

  const targetCount = selectedPack.itemCount;

  // Filter products
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.categoryId.toString() === selectedCategory);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectPack = (pack: ComboPackConfig) => {
    setSelectedPack(pack);
    if (selectedProducts.length > pack.itemCount) {
      setSelectedProducts(selectedProducts.slice(0, pack.itemCount));
    }
  };

  const triggerFlyAnimation = (product: ComboProduct, slotIdx: number, event?: React.MouseEvent) => {
    const slotEl = document.getElementById(`combo-slot-${slotIdx}`);
    let srcImgEl: HTMLElement | null = null;

    if (event?.currentTarget) {
      const target = event.currentTarget as HTMLElement;
      srcImgEl = target.querySelector('.hiyaghar-page-prod-img') || (target.classList.contains('hiyaghar-page-prod-img') ? target : null);
    }
    if (!srcImgEl) {
      srcImgEl = document.getElementById(`combo-prod-img-${product.id}`);
    }

    if (srcImgEl && slotEl) {
      const srcRect = srcImgEl.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();

      const flyId = `${product.id}-${Date.now()}-${Math.random()}`;

      const newFlyingItem: FlyingItem = {
        id: flyId,
        image: product.image,
        startX: srcRect.left,
        startY: srcRect.top,
        startWidth: srcRect.width || 120,
        startHeight: srcRect.height || 120,
        targetX: slotRect.left + 12,
        targetY: slotRect.top + Math.max(0, (slotRect.height - 40) / 2),
        targetWidth: 40,
        targetHeight: 40,
        slotIndex: slotIdx,
      };

      setPendingSlots((prev) => [...prev, slotIdx]);
      setFlyingItems((prev) => [...prev, newFlyingItem]);

      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== flyId));
        setPendingSlots((prev) => prev.filter((idx) => idx !== slotIdx));
        setLandingSlot(slotIdx);
        setTimeout(() => {
          setLandingSlot((current) => (current === slotIdx ? null : current));
        }, 500);
      }, 600);
    }
  };

  const handleToggleProduct = (product: ComboProduct, event?: React.MouseEvent) => {
    const isAlreadySelected = selectedProducts.some((p) => p.id === product.id);

    if (isAlreadySelected) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    } else {
      if (selectedProducts.length < targetCount) {
        // Snapshot whichever variant is currently picked on the card (e.g. "200 g")
        // so the combo slot/cart reflect that choice, not always the default variant.
        const activeVariant = getActiveVariant(product);
        const productToAdd: ComboProduct = activeVariant
          ? {
              ...product,
              price: activeVariant.price,
              originalPrice: activeVariant.originalPrice,
              priceFormatted: `₹${activeVariant.price}`,
              weight: activeVariant.label,
            }
          : product;

        const targetSlotIdx = selectedProducts.length;
        triggerFlyAnimation(productToAdd, targetSlotIdx, event);
        setSelectedProducts([...selectedProducts, productToAdd]);
      } else {
        showToast(`You have selected the maximum ${targetCount} products for the ${selectedPack.name}!`);
      }
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  // Calculations
  const rawTotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.round((rawTotal * selectedPack.discountPercentage) / 100);
  const finalPrice = Math.max(0, rawTotal - discountAmount);
  const isComplete = selectedProducts.length === targetCount;

  const handleAddToCart = () => {
    if (!isComplete) {
      showToast(`Please select ${targetCount - selectedProducts.length} more item(s) to complete your combo!`);
      return;
    }

    for (const item of selectedProducts) {
      const itemId = CartService.addItem({
        productId: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        originalPrice: item.originalPrice,
        weight: item.weight,
        quantity: 1,
      });
      // CartService.addItem already shows its own "please login" popup and
      // returns '' when blocked — stop here rather than adding a partial combo.
      if (!itemId) {
        return;
      }
    }

    showToast(`${selectedPack.name} (Total ₹${finalPrice}) added to your cart!`);
    setTimeout(() => navigateTo('/cart'), 900);
  };

  return (
    <div className="hiyaghar-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-combo-page-main">
        {/* Full-Width Edge-to-Edge Hero Banner */}
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          breadcrumbCurrent="Custom Combos"
          title="Customize Combo"
          bgImage="/image/mukhwas_hero_bg.webp"
        />

        {/* Builder Workspace Section */}
        <section className="hiyaghar-combo-workspace-section">
          <div className="hiyaghar-combo-page-container">
            <div className="hiyaghar-combo-workspace-grid">
              {/* Left Column: STEP 1 & STEP 2 */}
              <div className="hiyaghar-combo-workspace-left">
                {/* STEP 1: Pack / Budget Size Selection */}
                <div className="hiyaghar-workspace-step-card">
                  <div className="hiyaghar-step-title-header">
                    <span className="hiyaghar-step-num-pill">1</span>
                    <div>
                      <h2 className="hiyaghar-step-title">Step 1: Choose Combo Pack & Budget</h2>
                      <p className="hiyaghar-step-desc">Select how many products you want in your bundle.</p>
                    </div>
                  </div>

                  <div className="hiyaghar-page-pack-grid">
                    {comboPacks.map((pack) => (
                      <button
                        key={pack.id}
                        type="button"
                        className={`hiyaghar-page-pack-card ${selectedPack.id === pack.id ? 'is-selected' : ''}`}
                        onClick={() => handleSelectPack(pack)}
                      >
                        <div className="hiyaghar-page-pack-header">
                          <h3 className="hiyaghar-page-pack-name">{pack.name}</h3>
                          {pack.badge && <span className="hiyaghar-page-pack-badge">{pack.badge}</span>}
                        </div>
                        <span className="hiyaghar-page-pack-count">{pack.itemCount} Items Box</span>
                        <span className="hiyaghar-page-pack-savings">Save {pack.discountPercentage}% OFF</span>
                        <span className="hiyaghar-page-pack-tagline">{pack.tagline}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STEP 2: Product Selection Grid */}
                <div className="hiyaghar-workspace-step-card">
                  <div className="hiyaghar-step-title-header">
                    <span className="hiyaghar-step-num-pill">2</span>
                    <div>
                      <h2 className="hiyaghar-step-title">
                        Step 2: Pick Your {targetCount} Products ({selectedProducts.length}/{targetCount} Selected)
                      </h2>
                      <p className="hiyaghar-step-desc">Select items across all categories.</p>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="hiyaghar-page-cat-pills">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`hiyaghar-page-cat-pill ${selectedCategory === cat.id ? 'is-active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Product Cards Grid */}
                  {isLoadingProducts ? (
                    <div className="hiyaghar-page-products-grid">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="hiyaghar-page-prod-card-skeleton" aria-hidden="true" />
                      ))}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="hiyaghar-combo-empty-state">
                      <p>No products found in this category yet.</p>
                    </div>
                  ) : (
                  <div className="hiyaghar-page-products-grid">
                    {filteredProducts.map((product, index) => {
                      const isSelected = selectedProducts.some((p) => p.id === product.id);
                      const isDisabled = !isSelected && selectedProducts.length >= targetCount;
                      const activeVariant = getActiveVariant(product);
                      const attributeGroups = product.variants.length > 1 ? getAttributeGroups(product) : [];

                      return (
                        <div
                          key={product.id}
                          id={`combo-prod-card-${product.id}`}
                          className={`hiyaghar-page-prod-card ${index % 2 === 0 ? 'hiyaghar-tone-cream' : 'hiyaghar-tone-mint'} ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                          onClick={(e) => !isDisabled && handleToggleProduct(product, e)}
                        >
                          <div className="hiyaghar-page-prod-img-wrap">
                            <img
                              id={`combo-prod-img-${product.id}`}
                              src={product.image}
                              alt={product.name}
                              className="hiyaghar-page-prod-img"
                            />
                            {isSelected && <span className="hiyaghar-page-check-icon">✓</span>}
                          </div>

                          <div className="hiyaghar-page-prod-info">
                            <h3 className="hiyaghar-page-prod-name">{product.name}</h3>
                            <div className="hiyaghar-page-prod-price-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="hiyaghar-page-prod-price">
                                ₹{activeVariant ? activeVariant.price : product.price}
                              </span>
                              {(activeVariant ? activeVariant.originalPrice : product.originalPrice) && (activeVariant ? activeVariant.originalPrice! > activeVariant.price : product.originalPrice! > product.price) && (
                                <span style={{ fontSize: '12px', color: '#888', textDecoration: 'line-through' }}>
                                  ₹{activeVariant ? activeVariant.originalPrice : product.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          {attributeGroups.length > 0 && (
                            <div
                              className="hiyaghar-page-variant-groups"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {attributeGroups.map((group) => {
                                const activeValue = activeVariant?.attributes.find(
                                  (a) => a.attributeName === group.name
                                )?.attributeValue;

                                return (
                                  <div key={group.name} className="hiyaghar-page-variant-group-row">
                                    <span className="hiyaghar-page-variant-group-label">{group.name}:</span>
                                    <div className="hiyaghar-page-variant-pills">
                                      {group.values.map((value) => (
                                        <button
                                          key={value}
                                          type="button"
                                          className={`hiyaghar-page-variant-pill ${activeValue === value ? 'is-active' : ''}`}
                                          disabled={isSelected}
                                          onClick={() => handleSelectAttrValue(product, group.name, value)}
                                        >
                                          {value}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <button
                            type="button"
                            className={`hiyaghar-page-add-btn ${isSelected ? 'is-selected' : ''}`}
                            disabled={isDisabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProduct(product, e);
                            }}
                          >
                            {isSelected ? '✓ Selected' : isDisabled ? 'Box Full' : '+ Add Item'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </div>

              {/* Right Column: STEP 3 Live Review & Savings Panel */}
              <div className="hiyaghar-combo-workspace-right">
                <div className="hiyaghar-page-summary-sticky-card">
                  <div className="hiyaghar-step-title-header">
                    <span className="hiyaghar-step-num-pill">3</span>
                    <div>
                      <h2 className="hiyaghar-step-title">Step 3: Review & Savings</h2>
                    </div>
                  </div>

                  <div className="hiyaghar-page-summary-pack-header">
                    <strong className="hiyaghar-page-pack-title">{selectedPack.name}</strong>
                    <span className="hiyaghar-page-discount-tag">{selectedPack.discountPercentage}% Discount Active</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="hiyaghar-page-progress-wrap">
                    <div className="hiyaghar-page-progress-info">
                      <span>Combo Capacity</span>
                      <span>{selectedProducts.length} / {targetCount} items</span>
                    </div>
                    <div className="hiyaghar-page-progress-track">
                      <div
                        className="hiyaghar-page-progress-bar"
                        style={{ width: `${(selectedProducts.length / targetCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Slot Items Preview */}
                  <div className="hiyaghar-page-slots-list">
                    {Array.from({ length: targetCount }).map((_, idx) => {
                      const item = selectedProducts[idx];
                      const isPending = pendingSlots.includes(idx);
                      const isLanding = landingSlot === idx;

                      return (
                        <div
                          key={idx}
                          id={`combo-slot-${idx}`}
                          className={`hiyaghar-page-slot-item ${item && !isPending ? 'has-item' : 'is-empty'} ${isPending ? 'is-pending' : ''} ${isLanding ? 'is-landing' : ''}`}
                        >
                          {item && !isPending ? (
                            <>
                              <img src={item.image} alt={item.name} className="hiyaghar-page-slot-thumb" />
                              <div className="hiyaghar-page-slot-details">
                                <span className="hiyaghar-page-slot-name">{item.name}</span>
                                <span className="hiyaghar-page-slot-price">{item.priceFormatted}</span>
                              </div>
                              <button
                                type="button"
                                className="hiyaghar-page-slot-remove"
                                onClick={() => handleRemoveProduct(item.id)}
                                aria-label={`Remove ${item.name}`}
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <div className="hiyaghar-page-slot-empty">
                              <span>{isPending ? 'Receiving item...' : `+ Select Item ${idx + 1}`}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Price Calculation */}
                  <div className="hiyaghar-page-price-breakdown">
                    <div className="hiyaghar-page-price-row">
                      <span>Original Value:</span>
                      <span className="hiyaghar-page-raw-sum">₹{rawTotal}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="hiyaghar-page-price-row hiyaghar-page-savings-row">
                        <span>Combo Discount ({selectedPack.discountPercentage}% OFF):</span>
                        <span className="hiyaghar-page-discount-sum">-₹{discountAmount}</span>
                      </div>
                    )}

                    <div className="hiyaghar-page-price-row hiyaghar-page-final-row">
                      <span>Total Combo Price:</span>
                      <span className="hiyaghar-page-final-val">₹{finalPrice}</span>
                    </div>

                    <p className="hiyaghar-page-savings-disclaimer">
                      This is an estimated combo price. Items are added to your cart at their regular price — the discount shown here isn't applied at checkout yet.
                    </p>
                  </div>

                  {/* CTA Submit Button */}
                  <button
                    type="button"
                    className={`hiyaghar-page-submit-btn ${isComplete ? 'is-ready' : ''}`}
                    onClick={handleAddToCart}
                  >
                    {isComplete ? 'Add Combo to Cart →' : `Select ${targetCount - selectedProducts.length} More Item(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Flying Product Image Clones Overlay */}
        {flyingItems.map((fly) => (
          <div
            key={fly.id}
            className="hiyaghar-flying-combo-item"
            style={
              {
                '--start-x': `${fly.startX}px`,
                '--start-y': `${fly.startY}px`,
                '--start-w': `${fly.startWidth}px`,
                '--start-h': `${fly.startHeight}px`,
                '--target-x': `${fly.targetX}px`,
                '--target-y': `${fly.targetY}px`,
                '--target-w': `${fly.targetWidth}px`,
                '--target-h': `${fly.targetHeight}px`,
              } as React.CSSProperties
            }
          >
            <img src={fly.image} alt="Flying item" />
          </div>
        ))}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="hiyaghar-combo-toast" role="alert">
            {toastMessage}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
