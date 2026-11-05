import { CustomerAuthService } from './customerAuthService';
import { ProductService, type Product, type ProductVariant } from './productService';
import { formatVariantLabel, getVariantImages } from '../utils/productFormat';

// Bridges the client's guest cart (keyed by productId + a display "weight"
// label) to the server-persisted cart (keyed by numeric productId + variantId).
// Resolution is best-effort: match the weight label to a variant name, falling
// back to the product's default/first variant so the item still syncs.

interface ResolvedLine {
  productId: number;
  variantId: number | null;
  packingType: string | null;
}

const variantResolutionCache = new Map<string, ResolvedLine>();

// The variant whose name matches a cart line's weight label, or undefined.
export function findVariantByLabel(variants: ProductVariant[], weight: string): ProductVariant | undefined {
  const cleanWeight = (weight || '').toLowerCase().replace(/[\s\-\>:]+/g, '');
  return (
    variants.find((v) => v.variantName === weight) ||
    variants.find((v) => formatVariantLabel(v.variantName) === weight) ||
    variants.find((v) => cleanWeight && ((v.variantName || '').toLowerCase().replace(/[\s\-\>:]+/g, '').includes(cleanWeight) || cleanWeight.includes((v.variantName || '').toLowerCase().replace(/[\s\-\>:]+/g, ''))))
  );
}

async function resolveLine(productIdRaw: string | number, weight: string): Promise<ResolvedLine | null> {
  const productId = Number(productIdRaw);
  if (!productId || Number.isNaN(productId)) return null;

  const cacheKey = `${productId}::${weight}`;
  const cached = variantResolutionCache.get(cacheKey);
  if (cached) return cached;

  const product = await ProductService.getProductById(productId);
  if (!product) return null;

  const variants = product.variants || [];
  const matched =
    findVariantByLabel(variants, weight) ||
    variants.find((v) => (v.sellableStock !== undefined ? v.sellableStock > 0 : (v.stockQuantity !== undefined ? v.stockQuantity > 0 : true))) ||
    variants.find((v) => v.isDefault) ||
    variants[0] ||
    null;

  const resolved: ResolvedLine = {
    productId,
    variantId: matched ? matched.id : null,
    packingType: matched ? null : weight || null,
  };

  variantResolutionCache.set(cacheKey, resolved);
  return resolved;
}

async function postDelta(productIdRaw: string | number, weight: string, quantityDelta: number): Promise<void> {
  if (!CustomerAuthService.hasSession() || quantityDelta === 0) return;

  try {
    const line = await resolveLine(productIdRaw, weight);
    if (!line) return;

    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: CustomerAuthService.getAuthHeaders(),
      body: JSON.stringify({
        productId: line.productId,
        variantId: line.variantId,
        packingType: line.packingType,
        quantity: quantityDelta,
      }),
    });

    if (res.status === 401) {
      // Expired/invalid token — not a stock problem. Keep the item in the
      // local cart; it merges back to the server after the next login.
      CustomerAuthService.expireSession();
      import('../utils/alertService').then(({ showToast }) => {
        showToast('Your session has expired. Please log in again.', 'info');
      });
      return;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (!errData.message) {
        // Server/proxy failure with no business reason — don't blame stock
        // or drop the item; the next mutation will resync.
        console.warn(`Cart server sync failed (HTTP ${res.status}).`);
        return;
      }
      const msg = errData.message;
      if (quantityDelta > 0) {
        import('../cart').then(({ CartService }) => {
          CartService.removeItem(`${productIdRaw}-${weight}`);
        });
      }
      import('../utils/alertService').then(({ showError }) => {
        showError(msg, 'Stock Alert');
      });
    }
  } catch (err) {
    console.warn('Cart server sync failed (will retry on next mutation):', err);
  }
}

// Cart changes are sent one at a time, in click order. Sent in parallel (fast +/- taps), the
// server read the same old quantity for several requests and some changes were lost, leaving the
// cart quantity out of step with the stock it holds for the cart.
let syncQueue: Promise<void> = Promise.resolve();
function enqueueDelta(productIdRaw: string | number, weight: string, quantityDelta: number): void {
  syncQueue = syncQueue.then(() => postDelta(productIdRaw, weight, quantityDelta)).catch(() => undefined);
}

export class CartApiService {
  // Fire-and-forget sync calls, mirroring CartService's synchronous mutations.
  public static syncAdd(productId: string | number, weight: string, quantity: number): void {
    enqueueDelta(productId, weight, quantity);
  }

  public static syncQuantityChange(productId: string | number, weight: string, delta: number): void {
    enqueueDelta(productId, weight, delta);
  }

  public static syncRemove(productId: string | number, weight: string, quantity: number): void {
    enqueueDelta(productId, weight, -quantity);
  }

  /**
   * How much of a cart quantity still has to come off a product's shown stock. For a signed-in
   * (or guest-session) shopper the server already holds their cart's units, and the stock the API
   * sends ("sellableStock") excludes them - subtracting the cart again counted it twice. Only a
   * cart that isn't synced to the server (no session) still needs subtracting.
   */
  public static cartQtyNotHeldByServer(quantity: number): number {
    return CustomerAuthService.hasSession() ? 0 : quantity;
  }

  // Push every item currently in the guest (localStorage) cart onto the
  // server cart. Called once, right after login.
  public static async mergeGuestCartToServer(items: Array<{ productId: string; weight: string; quantity: number }>): Promise<void> {
    if (!CustomerAuthService.hasSession() || items.length === 0) return;

    const resolvedItems = (
      await Promise.all(
        items.map(async (item) => {
          const line = await resolveLine(item.productId, item.weight);
          if (!line) return null;
          return {
            productId: line.productId,
            variantId: line.variantId,
            packingType: line.packingType,
            quantity: item.quantity,
          };
        })
      )
    ).filter((x): x is NonNullable<typeof x> => x !== null);

    if (resolvedItems.length === 0) return;

    try {
      await fetch('/api/cart/merge', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({ items: resolvedItems }),
      });
    } catch (err) {
      console.warn('Failed to merge guest cart into server cart:', err);
    }
  }

  // The server cart line a "Buy Now" checkout is for (sent with the order request).
  public static async resolveBuyNowItem(productId: string | number, weight: string): Promise<ResolvedLine | null> {
    return resolveLine(productId, weight);
  }

  // Today's price, name and photo of each cart line, keyed `${productId}::${weight}`, read fresh
  // from the catalog (not ProductService's in-memory list) so a price or photo changed in admin
  // shows without a reload. Priced the same way the server prices an order
  // (CartRepository.ResolveUnitPrice). Lines that can't be matched to a variant by name, or whose
  // product can't be loaded, are left out.
  public static async fetchCurrentPrices(
    items: Array<{ productId: string; weight: string }>
  ): Promise<Map<string, { price: number; originalPrice?: number; name?: string; image?: string }>> {
    const prices = new Map<string, { price: number; originalPrice?: number; name?: string; image?: string }>();
    const productIds = [...new Set(items.map((i) => Number(i.productId)).filter((id) => id > 0))];

    const products = await Promise.all(
      productIds.map(async (id) => {
        try {
          const res = await fetch(`/api/product/${id}`, { cache: 'no-store' });
          return res.ok ? ((await res.json()) as Product) : null;
        } catch {
          return null;
        }
      })
    );

    for (const item of items) {
      const product = products.find((p) => p && p.id === Number(item.productId));
      if (!product) continue;
      const variants = product.variants || [];
      if (variants.length > 0) {
        const variant = findVariantByLabel(variants, item.weight);
        if (variant) {
          prices.set(`${item.productId}::${item.weight}`, {
            price: variant.price,
            originalPrice: variant.originalPrice ?? undefined,
            name: product.productName,
            image: getVariantImages(product, variant)[0],
          });
        }
      } else {
        const price = product.discountPrice ?? product.basePrice;
        if (typeof price === 'number') {
          prices.set(`${item.productId}::${item.weight}`, {
            price,
            originalPrice: product.discountPrice != null ? product.basePrice : undefined,
            name: product.productName,
            image: getVariantImages(product)[0],
          });
        }
      }
    }
    return prices;
  }

  // Fetch the authoritative server cart, shaped to match the local CartItem type.
  public static async fetchServerCart(): Promise<Array<{
    id: string;
    productId: string;
    name: string;
    image: string;
    price: number;
    weight: string;
    quantity: number;
  }> | null> {
    if (!CustomerAuthService.hasSession()) return null;

    try {
      const res = await fetch('/api/cart', { headers: CustomerAuthService.getAuthHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.isSuccess || !Array.isArray(data.items)) return null;

      return data.items.map((line: any) => ({
        id: `${line.productId}-${line.variantName || line.packingType || 'default'}`,
        productId: String(line.productId),
        name: line.productName,
        image: line.imagePath || '',
        price: line.unitPrice,
        weight: line.variantName || line.packingType || '',
        quantity: line.quantity,
      }));
    } catch (err) {
      console.warn('Failed to fetch server cart:', err);
      return null;
    }
  }
}
