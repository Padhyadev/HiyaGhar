import { CustomerAuthService } from './customerAuthService';
import { ProductService } from './productService';

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
    variants.find((v) => v.variantName === weight) ||
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
  if (!CustomerAuthService.isLoggedIn() || quantityDelta === 0) return;

  try {
    const line = await resolveLine(productIdRaw, weight);
    if (!line) return;

    await fetch('/api/cart/items', {
      method: 'POST',
      headers: CustomerAuthService.getAuthHeaders(),
      body: JSON.stringify({
        productId: line.productId,
        variantId: line.variantId,
        packingType: line.packingType,
        quantity: quantityDelta,
      }),
    });
  } catch (err) {
    console.warn('Cart server sync failed (will retry on next mutation):', err);
  }
}

export class CartApiService {
  // Fire-and-forget sync calls, mirroring CartService's synchronous mutations.
  public static syncAdd(productId: string | number, weight: string, quantity: number): void {
    void postDelta(productId, weight, quantity);
  }

  public static syncQuantityChange(productId: string | number, weight: string, delta: number): void {
    void postDelta(productId, weight, delta);
  }

  public static syncRemove(productId: string | number, weight: string, quantity: number): void {
    void postDelta(productId, weight, -quantity);
  }

  // Push every item currently in the guest (localStorage) cart onto the
  // server cart. Called once, right after login.
  public static async mergeGuestCartToServer(items: Array<{ productId: string; weight: string; quantity: number }>): Promise<void> {
    if (!CustomerAuthService.isLoggedIn() || items.length === 0) return;

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
    if (!CustomerAuthService.isLoggedIn()) return null;

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
