import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { ProductService, type Product, type ProductVariant } from '../../services/productService';
import { GiftService, PERSONALISATION_CHARGE_PER_BOX, type GiftQuote } from '../../services/giftService';
import { GiftOptionsPanel } from '../../components/gifting/GiftOptionsPanel';
import { GiftDraftStore, messageHasText, messageLength } from '../../components/gifting/giftDraft';
import { useGiftDraft } from '../../components/gifting/giftCheckout';
import { MAX_MESSAGE_CHARS } from '../../components/gifting/giftFonts';
import { CartService, type CartItem } from '../../cart';
import { CartApiService } from '../../services/cartApiService';
import { isComboCategoryName, isComboProduct } from '../../services/comboService';
import { formatVariantLabel, NO_IMAGE } from '../../utils/productFormat';
import { showToast } from '../../utils/alertService';
import { navigateTo } from '../../utils/navigation';
import { CouponService, type AutoOfferResult } from '../../services/couponService';
import { SHIPPING_CONFIG, ShippingService } from '../../services/shippingService';
import './GiftHampersPage.css';

// Gift builder, in three steps:
//   1. Choose products  - any HIYAGHAR products (no combo packs), sizes and quantities
//   2. Gift type        - Normal (free) or Personalised (+₹100 per box: photo + message on an A4 insert)
//   3. Review           - the items, "gift only these" or "include my cart", totals → checkout
// The gift box is chosen by the server from the products (shown as a fill meter). "Gift only"
// goes to checkout without touching the cart; "include my cart" adds the items to the cart.
// All prices are checked again by the server when the order is placed.

interface GiftHampersPageProps {
  onNavigateHome: () => void;
  onNavigateToDetail: (productId: string) => void;
}

type Step = 1 | 2 | 3;

/** Selected quantity per variant: key = `${productId}:${variantId ?? 0}`. */
type Selection = Record<string, number>;

const SELECTION_KEY = 'hiya_gift_builder_selection';

const STEPS: Array<{ step: Step; label: string; short: string }> = [
  { step: 1, label: 'Choose products', short: 'Products' },
  { step: 2, label: 'Gift type', short: 'Gift type' },
  { step: 3, label: 'Review', short: 'Review' },
];

const lineKey = (productId: number, variantId: number | null) => `${productId}:${variantId ?? 0}`;

function loadSelection(): Selection {
  try {
    const raw = sessionStorage.getItem(SELECTION_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const activeVariants = (p: Product): ProductVariant[] => (p.variants || []).filter((v) => v.isActive !== false);

const sellable = (v: ProductVariant | undefined): number =>
  v ? (v.sellableStock ?? v.stockQuantity ?? 0) : 99;

const defaultVariant = (p: Product): ProductVariant | undefined => {
  const vs = activeVariants(p);
  return vs.find((v) => v.isDefault && sellable(v) > 0) || vs.find((v) => sellable(v) > 0) || vs[0];
};

const productImage = (p: Product, v?: ProductVariant) => v?.primaryImage || p.mainImagePath || NO_IMAGE;

// Whole rupees as "₹389", amounts with paise always with two decimals ("₹38.90").
const formatRupees = (n: number) => {
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
};

/** − qty + control. */
const QtyStepper: React.FC<{ value: number; label: string; max?: number; small?: boolean; onChange: (qty: number) => void }> = ({ value, label, max, small, onChange }) => (
  <span className={`gift-qty ${small ? 'is-small' : ''}`} role="group" aria-label={`Quantity of ${label}`}>
    <button type="button" onClick={() => onChange(value - 1)} aria-label={value === 1 ? `Remove ${label}` : 'Decrease quantity'}>
      −
    </button>
    <span aria-live="polite">{value}</span>
    <button type="button" onClick={() => onChange(value + 1)} aria-label="Increase quantity" disabled={max !== undefined && value >= max}>+</button>
  </span>
);

/** How full each chosen gift box is. */
const BoxMeter: React.FC<{ quote: GiftQuote | null; loading: boolean; empty: boolean }> = ({ quote, loading, empty }) => {
  if (empty) {
    return (
      <div className="gift-box-meter is-empty">
        <i className="fa-solid fa-box-open" aria-hidden="true" />
        <span>Add products and we'll choose the right gift box.</span>
      </div>
    );
  }
  if (!quote?.isSuccess) {
    return (
      <div className="gift-box-meter is-empty" aria-live="polite">
        <i className="fa-solid fa-box-open" aria-hidden="true" />
        <span className={loading ? '' : 'gift-field-error'}>{loading ? 'Choosing your gift box…' : quote?.message || 'Gift box not available.'}</span>
      </div>
    );
  }
  return (
    <div className={`gift-box-meter ${loading ? 'is-loading' : ''}`} aria-live="polite">
      {quote.boxes.map((b, i) => {
        const pct = Math.min(100, Math.round((b.usedUnits / Math.max(1, b.capacity)) * 100));
        return (
          <div key={i} className="gift-box-meter-row">
            <span className="gift-box-meter-label">
              <i className="fa-solid fa-gift" aria-hidden="true" /> {b.name}
            </span>
            <span
              className="gift-box-meter-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={b.capacity}
              aria-valuenow={b.usedUnits}
              aria-label={`${b.name}: ${b.usedUnits} of ${b.capacity} spaces filled`}
            >
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="gift-box-meter-count">{b.usedUnits}/{b.capacity}</span>
          </div>
        );
      })}
    </div>
  );
};

export const GiftHampersPage: React.FC<GiftHampersPageProps> = ({ onNavigateHome, onNavigateToDetail }) => {
  const draft = useGiftDraft();
  const [step, setStep] = useState<Step>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [chosenVariant, setChosenVariant] = useState<Record<number, number>>({});
  const [selection, setSelection] = useState<Selection>(loadSelection);
  const [quote, setQuote] = useState<GiftQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const builderTopRef = useRef<HTMLDivElement>(null);
  // The customer's normal cart: they choose whether it joins this gift (default: no).
  const [cartItems, setCartItems] = useState<CartItem[]>(() => CartService.getItems());
  const [includeCart, setIncludeCart] = useState(false);
  useEffect(() => CartService.subscribe(() => setCartItems(CartService.getItems())), []);
  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const cartTotal = cartItems.reduce((n, i) => n + i.price * i.quantity, 0);
  const withCart = includeCart && cartItems.length > 0;

  // The builder is always a gift: start on Normal gifting unless the customer already chose.
  useEffect(() => {
    if (GiftDraftStore.get().option === 'none') GiftDraftStore.update({ option: 'normal' });
  }, []);

  const loadProducts = () => {
    setLoadState('loading');
    ProductService.getProductsWithStatus().then(({ products: list, failed }) => {
      // Combo packs are not offered in the gift builder.
      const usable = list.filter((p) => p.isActive !== false && !isComboCategoryName(p.category?.categoryName) && !isComboProduct(p));
      setProducts(usable);
      setLoadState(failed && usable.length === 0 ? 'error' : 'ready');
    });
  };
  useEffect(loadProducts, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
    } catch {
      // ignore
    }
  }, [selection]);

  const categories = useMemo(() => {
    const names = new Map<string, string>();
    products.forEach((p) => {
      const name = p.category?.categoryName?.trim();
      if (name) names.set(name.toLowerCase(), name);
    });
    return Array.from(names.values()).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'all' || p.category?.categoryName?.trim().toLowerCase() === category.toLowerCase()) &&
        (!q || p.productName.toLowerCase().includes(q)),
    );
  }, [products, category, search]);

  // Selected lines with their product/variant (lines whose product is gone are skipped).
  const lines = useMemo(() => {
    return Object.entries(selection)
      .filter(([, qty]) => qty > 0)
      .map(([key, quantity]) => {
        const [pid, vid] = key.split(':').map(Number);
        const product = products.find((p) => p.id === pid);
        const variant = vid ? product?.variants?.find((v) => v.id === vid) : undefined;
        return product ? { key, product, variant, quantity, price: variant?.price ?? product.discountPrice ?? product.basePrice } : null;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
  }, [selection, products]);

  const productTotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalItems = itemCount + (withCart ? cartCount : 0);

  // Ask the server which box(es) these products need - plus the cart items when they are
  // included in the gift (debounced while the customer clicks).
  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    const timer = window.setTimeout(async () => {
      const items = lines.map((l) => ({ productId: l.product.id, variantId: l.variant?.id ?? null, quantity: l.quantity }));
      if (withCart) {
        const resolved = await Promise.all(cartItems.map((c) => CartApiService.resolveBuyNowItem(c.productId, c.weight)));
        resolved.forEach((r, i) => {
          if (r) items.push({ productId: r.productId, variantId: r.variantId, quantity: cartItems[i].quantity });
        });
      }
      if (cancelled) return;
      GiftService.quote(items)
        .then((q) => {
          if (!cancelled) setQuote(q);
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lines, withCart, cartItems]);

  // While the phone bottom bar shows, lift the floating WhatsApp / back-to-top buttons above it.
  const showMobileBar = lines.length > 0;
  useEffect(() => {
    document.body.classList.toggle('has-gift-bar', showMobileBar);
    return () => document.body.classList.remove('has-gift-bar');
  }, [showMobileBar]);

  const boxCount = quote?.isSuccess ? quote.boxCount : 0;
  const giftCharge = draft.option === 'personalised' ? PERSONALISATION_CHARGE_PER_BOX * boxCount : 0;

  // Offers, shipping and GST - same rules as the cart page and the server: the automatic offer and
  // the free-shipping threshold are judged on the products only (never on the gift charge).
  const [offer, setOffer] = useState<AutoOfferResult>({ applied: null, next: null });
  const [, setShippingVersion] = useState(0);
  useEffect(() => {
    ShippingService.loadSettingsFromApi().then(() => setShippingVersion((v) => v + 1));
  }, []);
  const goodsSubtotal = productTotal + (withCart ? cartTotal : 0);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      CouponService.getAutoOffer(goodsSubtotal).then((result) => {
        if (!cancelled) setOffer(result);
      });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [goodsSubtotal]);
  const appliedOffer = goodsSubtotal > 0 ? offer.applied : null;
  const nextOffer = goodsSubtotal > 0 ? offer.next : null;
  const discountAmount = appliedOffer ? appliedOffer.discountAmount : 0;
  const amountAfterDiscount = Math.max(0, goodsSubtotal - discountAmount);
  const freeShippingEnabled = ShippingService.getSettings().enableFreeShipping;
  const freeShippingThreshold = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
  const isFreeShipping = ShippingService.qualifiesForFreeShipping(amountAfterDiscount);
  const shippingFee = goodsSubtotal === 0 || isFreeShipping ? 0 : SHIPPING_CONFIG.STANDARD_SHIPPING_PRICE;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - amountAfterDiscount);
  const freeShippingProgress = Math.min(100, Math.round((amountAfterDiscount / Math.max(1, freeShippingThreshold)) * 100));
  const gstPercent = SHIPPING_CONFIG.GST_PERCENT ?? 5;
  const enableGstDisplay = SHIPPING_CONFIG.ENABLE_GST_DISPLAY ?? true;
  const gstLabel = SHIPPING_CONFIG.GST_LABEL || `Estimated GST (${gstPercent}% Included)`;
  const taxAmount = Math.round(amountAfterDiscount * (gstPercent / 100));
  const grandTotal = amountAfterDiscount + shippingFee + giftCharge;
  const canLeaveStep1 = lines.length > 0 && !!quote?.isSuccess && !quoteLoading;

  const setQuantity = (productId: number, variantId: number | null, quantity: number, max: number) => {
    const key = lineKey(productId, variantId);
    const next = Math.max(0, Math.min(quantity, max));
    if (quantity > max && max > 0) showToast(`Only ${max} available.`, 'info');
    setSelection((prev) => {
      const copy = { ...prev };
      if (next === 0) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  };

  const goToStep = (target: Step) => {
    if (target > 1 && lines.length === 0) {
      showToast('Please select at least one product for your gift.', 'error');
      return;
    }
    if (target > 1 && !quote?.isSuccess) {
      showToast(quoteLoading ? 'Please wait while we choose your gift box.' : quote?.message || 'We could not choose a gift box.', 'error');
      return;
    }
    if (target === 3 && draft.option === 'personalised' && messageLength(draft.message) > MAX_MESSAGE_CHARS) {
      showToast(`Your gift message is too long. Please keep it under ${MAX_MESSAGE_CHARS} characters.`, 'error');
      return;
    }
    setStep(target);
    builderTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleContinue = () => {
    if (!canLeaveStep1) {
      goToStep(2); // shows the reason
      return;
    }
    const toCartItem = (l: (typeof lines)[number]) => ({
      productId: String(l.product.id),
      name: l.product.productName,
      image: productImage(l.product, l.variant),
      price: l.price,
      originalPrice: l.variant?.originalPrice,
      weight: l.variant ? formatVariantLabel(l.variant.variantName) : '',
      quantity: l.quantity,
    });
    GiftDraftStore.update({ fromBuilder: true });

    if (withCart) {
      // "Include my cart items": the gift items join the cart and the whole cart is gifted.
      lines.forEach((l) => CartService.addItem(toCartItem(l)));
      CartService.hidePill();
      setSelection({});
      navigateTo('/checkout');
      return;
    }

    // "Gift only these items" (default): straight to checkout; the cart is left as it is and the
    // selection stays here if the customer comes back to edit the gift.
    CartService.startGiftOnlyCheckout(
      lines.map(toCartItem),
      lines.map((l) => ({ productId: l.product.id, variantId: l.variant?.id ?? null, packingType: null, quantity: l.quantity })),
    );
  };

  const primaryAction = step === 1
    ? { label: 'Next: Gift type', onClick: () => goToStep(2), disabled: !canLeaveStep1 }
    : step === 2
      ? { label: 'Next: Review', onClick: () => goToStep(3), disabled: !canLeaveStep1 }
      : { label: 'Continue to checkout', onClick: handleContinue, disabled: !canLeaveStep1 };

  const personalisedBits = draft.option === 'personalised'
    ? [draft.photo || draft.photoToken ? 'photo' : null, messageHasText(draft.message) ? 'message' : null].filter(Boolean)
    : [];

  // ---------- step content ----------

  // Step heading with the live gift status on the right: how full the gift box is and how far
  // the customer is from free shipping (shown on every step).
  const stepHead = (title: string, description?: string) => (
    <div className="gift-step-head">
      <div className="gift-step-title">
        <h2 id="gift-step-heading" className="gift-builder-heading">{title}</h2>
        {description && <p className="gift-builder-muted">{description}</p>}
      </div>
      <div className="gift-step-status" aria-label="Gift status">
        <BoxMeter quote={quote} loading={quoteLoading} empty={lines.length === 0} />
      </div>
    </div>
  );

  const productsStep = (
    <section className="gift-builder-card" aria-labelledby="gift-step-heading">
      {stepHead('Choose products', 'Pick anything you like - we fit it into the right gift box for you.')}

      <div className="gift-builder-tools">
        <label className="gift-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <span className="sr-only">Search products</span>
          <input type="search" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {categories.length > 1 && (
          <div className="gift-builder-filters" role="group" aria-label="Filter by category">
            {['all', ...categories].map((c) => (
              <button key={c} type="button" className={category === c ? 'is-active' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadState === 'loading' && (
        <div className="gift-builder-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="gift-product-card is-skeleton" />)}
        </div>
      )}

      {loadState === 'error' && (
        <div className="gift-builder-empty" role="alert">
          <p>We couldn't load our products right now.</p>
          <button type="button" className="gift-btn-secondary" onClick={loadProducts}>Try again</button>
        </div>
      )}

      {loadState === 'ready' && visibleProducts.length === 0 && (
        <div className="gift-builder-empty"><p>No products match{search ? ` "${search}"` : ' this category'}.</p></div>
      )}

      {loadState === 'ready' && visibleProducts.length > 0 && (
        <div className="gift-builder-grid">
          {visibleProducts.map((p) => {
            const variants = activeVariants(p);
            const variant = variants.find((v) => v.id === chosenVariant[p.id]) || defaultVariant(p);
            const variantId = variant?.id ?? null;
            const qty = selection[lineKey(p.id, variantId)] || 0;
            const stock = sellable(variant);
            const price = variant?.price ?? p.discountPrice ?? p.basePrice;
            const outOfStock = stock <= 0;
            return (
              <article key={p.id} className={`gift-product-card ${qty > 0 ? 'is-selected' : ''}`}>
                <button type="button" className="gift-product-image" onClick={() => onNavigateToDetail(String(p.id))} aria-label={`View ${p.productName}`}>
                  <img src={productImage(p, variant)} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                  {qty > 0 && <span className="gift-product-badge"><i className="fa-solid fa-check" aria-hidden="true" /> {qty}</span>}
                </button>
                <div className="gift-product-body">
                  <h3 className="gift-product-name">{p.productName}</h3>
                  {variants.length > 1 ? (
                    <select
                      className="gift-product-variant"
                      value={variantId ?? ''}
                      onChange={(e) => setChosenVariant((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))}
                      aria-label={`Size of ${p.productName}`}
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={sellable(v) <= 0}>
                          {formatVariantLabel(v.variantName) || v.variantName}{sellable(v) <= 0 ? ' (out of stock)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : variant && formatVariantLabel(variant.variantName) ? (
                    <span className="gift-product-size">{formatVariantLabel(variant.variantName)}</span>
                  ) : null}
                  <div className="gift-product-footer">
                    <span className="gift-product-price">{formatRupees(price)}</span>
                    {outOfStock ? (
                      <span className="gift-product-oos">Out of stock</span>
                    ) : qty === 0 ? (
                      <button type="button" className="gift-add-btn" onClick={() => setQuantity(p.id, variantId, 1, stock)}>
                        <i className="fa-solid fa-plus" aria-hidden="true" /> Add
                      </button>
                    ) : (
                      <QtyStepper value={qty} label={p.productName} max={stock} onChange={(n) => setQuantity(p.id, variantId, n, stock)} />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const giftTypeStep = (
    <section className="gift-builder-card" aria-labelledby="gift-step-heading">
      {stepHead('How should we pack it?', 'Every gift comes in a HIYAGHAR gift box. Add a printed photo and message for a personal touch.')}
      <GiftOptionsPanel allowNone={false} showRecipient={false} quote={quote} quoteLoading={quoteLoading} headingId="gift-step-heading" />
    </section>
  );

  const reviewStep = (
    <section className="gift-builder-card" aria-labelledby="gift-step-heading">
      {stepHead('Review your gift', 'Check your items and packing before checkout.')}

      <div className="gift-review-block">
        <div className="gift-review-head">
          <h3><i className="fa-solid fa-gift" aria-hidden="true" /> In this gift ({itemCount})</h3>
          <button type="button" className="gift-link-btn" onClick={() => goToStep(1)}>Add more</button>
        </div>
        <ul className="gift-review-lines">
          {lines.map((l) => (
            <li key={l.key}>
              <img src={productImage(l.product, l.variant)} alt="" />
              <span className="gift-review-name">
                {l.product.productName}
                {l.variant && formatVariantLabel(l.variant.variantName) && <small>{formatVariantLabel(l.variant.variantName)}</small>}
              </span>
              <QtyStepper small value={l.quantity} label={l.product.productName} max={sellable(l.variant)} onChange={(n) => setQuantity(l.product.id, l.variant?.id ?? null, n, sellable(l.variant))} />
              <span className="gift-review-price">{formatRupees(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      {cartItems.length > 0 && (
        <fieldset className="gift-cart-choice">
          <legend>
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" /> You also have {cartCount} item{cartCount === 1 ? '' : 's'} in your cart
          </legend>
          <div className="gift-cart-choice-options">
            <label className={!includeCart ? 'is-selected' : ''}>
              <input type="radio" name="gift-cart-choice" checked={!includeCart} onChange={() => setIncludeCart(false)} />
              <span>
                <strong>Gift only these items</strong>
                <small>Your cart stays as it is for later</small>
              </span>
            </label>
            <label className={includeCart ? 'is-selected' : ''}>
              <input type="radio" name="gift-cart-choice" checked={includeCart} onChange={() => setIncludeCart(true)} />
              <span>
                <strong>Include my cart items</strong>
                <small>All {itemCount + cartCount} items packed as one gift</small>
              </span>
            </label>
          </div>
        </fieldset>
      )}

      {withCart && (
        <div className="gift-review-block">
          <div className="gift-review-head">
            <h3><i className="fa-solid fa-cart-shopping" aria-hidden="true" /> From your cart ({cartCount})</h3>
          </div>
          <ul className="gift-review-lines">
            {cartItems.map((c) => (
              <li key={c.id}>
                <img src={c.image || NO_IMAGE} alt="" />
                <span className="gift-review-name">
                  {c.name}
                  {formatVariantLabel(c.weight) && <small>{formatVariantLabel(c.weight)}</small>}
                </span>
                <QtyStepper
                  small
                  value={c.quantity}
                  label={c.name}
                  onChange={(n) => (n <= 0 ? CartService.removeItem(c.id) : CartService.updateQuantity(c.id, n))}
                />
                <span className="gift-review-price">{formatRupees(c.price * c.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="gift-review-block">
        <div className="gift-review-head">
          <h3><i className="fa-solid fa-box-open" aria-hidden="true" /> Packing</h3>
          <button type="button" className="gift-link-btn" onClick={() => goToStep(2)}>Change</button>
        </div>
        <p className="gift-review-packing">
          <strong>{draft.option === 'personalised' ? 'Personalised Gifting' : 'Normal Gifting'}</strong>
          {' · '}{quote?.boxSummary}
          {draft.option === 'personalised' && (
            <small>
              {personalisedBits.length > 0 ? `A4 insert with your ${personalisedBits.join(' & ')}` : 'No photo or message added - the insert will be blank'}
            </small>
          )}
        </p>
      </div>
    </section>
  );

  return (
    <div className="hiyaghar-gift-hampers-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-gift-hampers-main">
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          title="Gift Hampers"
          breadcrumbCurrent="Gift Hampers"
          bgImage="/image/Banner_image/Gift_Hampers.webp?v=3"
          textShade="dark"
        />

        <div className="hiyaghar-container" ref={builderTopRef}>
          <div className="gift-builder-intro">
            <p className="gift-builder-eyebrow">Build your own gift</p>
            <ol className="gift-stepper" aria-label="Gift builder steps">
              {STEPS.map((s) => {
                const state = s.step === step ? 'is-current' : s.step < step ? 'is-done' : '';
                const reachable = s.step === 1 || canLeaveStep1;
                return (
                  <li key={s.step} className={state}>
                    <button type="button" onClick={() => goToStep(s.step)} disabled={!reachable} aria-current={s.step === step ? 'step' : undefined}>
                      <span className="gift-stepper-num">{s.step < step ? <i className="fa-solid fa-check" aria-hidden="true" /> : s.step}</span>
                      <span className="gift-stepper-label">{s.label}</span>
                      <span className="gift-stepper-short">{s.short}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Free shipping progress - full width, same as the cart page (hidden when the admin switched free shipping off) */}
          {goodsSubtotal > 0 && freeShippingEnabled && (
            <div className="gift-ship-card" role="status" aria-live="polite">
              <div className="gift-ship-card-head">
                <i className={`fa-solid ${isFreeShipping ? 'fa-circle-check' : 'fa-truck-fast'}`} aria-hidden="true" />
                {isFreeShipping ? (
                  <strong className="is-done">You've unlocked FREE SHIPPING!</strong>
                ) : (
                  <span>You're <strong>{formatRupees(Math.ceil(remainingForFreeShipping))}</strong> away from <strong>FREE SHIPPING</strong></span>
                )}
              </div>
              <div className="gift-ship-card-track">
                <div className={`gift-ship-card-fill ${isFreeShipping ? 'is-complete' : ''}`} style={{ width: `${freeShippingProgress}%` }} />
              </div>
            </div>
          )}

          <div className="gift-builder-layout">
            <div className="gift-builder-main">
              {step === 1 && productsStep}
              {step === 2 && giftTypeStep}
              {step === 3 && reviewStep}
            </div>

            {/* SUMMARY (desktop: sticky side panel; phone: below the step + bottom bar) */}
            <aside className="gift-builder-summary" aria-labelledby="gift-summary-title">
              <div className="gift-builder-card">
                <h2 id="gift-summary-title" className="gift-builder-heading is-plain">Your gift</h2>
                {lines.length === 0 && <p className="gift-builder-muted">No products selected yet.</p>}

                {/* Items in the gift: change quantity (−/+) or remove (✕) right here. */}
                {lines.length > 0 && (
                  <ul className="gift-summary-items" aria-label={`${itemCount} products in this gift`}>
                    {lines.map((l) => {
                      const max = sellable(l.variant);
                      const size = l.variant ? formatVariantLabel(l.variant.variantName) : '';
                      return (
                        <li key={l.key}>
                          <img src={productImage(l.product, l.variant)} alt="" />
                          <div className="gift-summary-item-info">
                            <span className="gift-summary-item-name">{l.product.productName}</span>
                            {size && <small>Pack Size: {size}</small>}
                            <button
                              type="button"
                              className="gift-summary-item-remove"
                              aria-label={`Remove ${l.product.productName}`}
                              onClick={() => setQuantity(l.product.id, l.variant?.id ?? null, 0, 0)}
                            >
                              Remove
                            </button>
                            <div className="gift-summary-item-row">
                              <QtyStepper small value={l.quantity} label={l.product.productName} max={max} onChange={(n) => setQuantity(l.product.id, l.variant?.id ?? null, n, max)} />
                              <span className="gift-summary-item-price">{formatRupees(l.price * l.quantity)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {withCart && cartItems.map((c) => (
                      <li key={`cart-${c.id}`} className="is-cart">
                        <img src={c.image || NO_IMAGE} alt="" />
                        <div className="gift-summary-item-info">
                          <span className="gift-summary-item-name">{c.name}</span>
                          <small>{formatVariantLabel(c.weight) ? `Pack Size: ${formatVariantLabel(c.weight)} · ` : ''}From your cart</small>
                          <button type="button" className="gift-summary-item-remove" aria-label={`Remove ${c.name} from cart`} onClick={() => CartService.removeItem(c.id)}>
                            Remove
                          </button>
                          <div className="gift-summary-item-row">
                            <QtyStepper small value={c.quantity} label={c.name} onChange={(n) => (n <= 0 ? CartService.removeItem(c.id) : CartService.updateQuantity(c.id, n))} />
                            <span className="gift-summary-item-price">{formatRupees(c.price * c.quantity)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Automatic offers (Admin → Coupons & Vouchers), same as the cart page */}
                {(appliedOffer || nextOffer) && (
                  <div className="gift-offers">
                    {appliedOffer && (
                      <p className="gift-offer-applied">
                        <span className="gift-offer-tag"><i className="fa-solid fa-tag" aria-hidden="true" /> {appliedOffer.label}</span>
                        <span>Applied automatically. You save {formatRupees(appliedOffer.discountAmount)}.</span>
                      </p>
                    )}
                    {nextOffer && (
                      <p className="gift-offer-next" role="status" aria-live="polite">
                        <i className="fa-solid fa-gift" aria-hidden="true" />
                        <span>Add <strong>{formatRupees(Math.ceil(nextOffer.amountNeeded))}</strong> more to get <strong>{nextOffer.benefit}</strong></span>
                      </p>
                    )}
                  </div>
                )}

                <dl className="gift-summary-totals">
                  <div><dt>Products ({itemCount})</dt><dd>{formatRupees(productTotal)}</dd></div>
                  {withCart && <div><dt>Cart items ({cartCount})</dt><dd>{formatRupees(cartTotal)}</dd></div>}
                  {discountAmount > 0 && (
                    <div className="is-discount"><dt>Offer discount</dt><dd>−{formatRupees(discountAmount)}</dd></div>
                  )}
                  <div>
                    <dt>Shipping</dt>
                    <dd className={shippingFee === 0 && goodsSubtotal > 0 ? 'is-free' : ''}>{goodsSubtotal === 0 ? '-' : shippingFee === 0 ? 'FREE' : formatRupees(shippingFee)}</dd>
                  </div>
                  <div>
                    <dt>{draft.option === 'personalised' ? `Personalised gifting${boxCount > 1 ? ` (${boxCount} × ₹${PERSONALISATION_CHARGE_PER_BOX})` : ''}` : 'Normal gifting'}</dt>
                    <dd className={giftCharge === 0 ? 'is-free' : ''}>{giftCharge > 0 ? formatRupees(giftCharge) : 'FREE'}</dd>
                  </div>
                  {enableGstDisplay && goodsSubtotal > 0 && (
                    <div className="is-subtle"><dt>{gstLabel}</dt><dd>{formatRupees(taxAmount)}</dd></div>
                  )}
                  <div className="is-total"><dt>Total</dt><dd>{formatRupees(grandTotal)}</dd></div>
                </dl>
                <p className="gift-builder-muted small">Delivery is to selected pin codes around Ghatlodiya, Ahmedabad; your pin code is checked at checkout.</p>

                <button type="button" className="gift-continue-btn" onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
                  {primaryAction.label} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
                {step > 1 && (
                  <button type="button" className="gift-back-btn" onClick={() => goToStep((step - 1) as Step)}>
                    <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Phone: always-visible total + next step; tapping the total jumps to the summary. */}
        {showMobileBar && (
          <div className="gift-builder-mobile-bar">
            {step > 1 && (
              <button type="button" className="gift-mobile-back" onClick={() => goToStep((step - 1) as Step)} aria-label="Back">
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className="gift-mobile-bar-info"
              onClick={() => document.getElementById('gift-summary-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              aria-label="Show gift summary"
            >
              <strong>{formatRupees(grandTotal)} <i className="fa-solid fa-chevron-up" aria-hidden="true" /></strong>
              <small>{totalItems} item{totalItems === 1 ? '' : 's'}{quote?.isSuccess ? ` • ${quote.boxSummary}` : ''}</small>
            </button>
            <button type="button" className="gift-continue-btn" onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
              {step === 3 ? 'Checkout' : 'Next'} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
