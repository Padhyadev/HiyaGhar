import { CustomerAuthService } from './customerAuthService';
import { ProductService } from './productService';

// Bridges the client's guest wishlist (keyed by productId + a display "weight"
// label) to the server-persisted wishlist (keyed by numeric productId + variantId).
// Mirrors cartApiService.ts's resolution strategy.

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

async function postLine(endpoint: 'add' | 'remove', productIdRaw: string | number, weight: string): Promise<void> {
  if (!CustomerAuthService.isLoggedIn()) return;

  try {
    const line = await resolveLine(productIdRaw, weight);
    if (!line) return;

    await fetch(`/api/wishlist/${endpoint}`, {
      method: 'POST',
      headers: CustomerAuthService.getAuthHeaders(),
      body: JSON.stringify({
        productId: line.productId,
        variantId: line.variantId,
        packingType: line.packingType,
      }),
    });
  } catch (err) {
    console.warn(`Wishlist server sync (${endpoint}) failed:`, err);
  }
}

export class WishlistApiService {
  public static syncAdd(productId: string | number, weight: string): void {
    void postLine('add', productId, weight);
  }

  public static syncRemove(productId: string | number, weight: string): void {
    void postLine('remove', productId, weight);
  }

  // Push every item currently in the guest (localStorage) wishlist onto the
  // server wishlist. Called once, right after login.
  public static async mergeGuestWishlistToServer(items: Array<{ productId: string; weight: string }>): Promise<void> {
    if (!CustomerAuthService.isLoggedIn() || items.length === 0) return;

    const resolvedItems = (
      await Promise.all(
        items.map(async (item) => {
          const line = await resolveLine(item.productId, item.weight);
          if (!line) return null;
          return { productId: line.productId, variantId: line.variantId, packingType: line.packingType };
        })
      )
    ).filter((x): x is NonNullable<typeof x> => x !== null);

    if (resolvedItems.length === 0) return;

    try {
      await fetch('/api/wishlist/merge', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({ items: resolvedItems }),
      });
    } catch (err) {
      console.warn('Failed to merge guest wishlist into server wishlist:', err);
    }
  }

  // Fetch the authoritative server wishlist, shaped to match the local WishlistItem type.
  public static async fetchServerWishlist(): Promise<Array<{
    id: string;
    productId: string;
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
    weight: string;
    addedAt: string;
  }> | null> {
    if (!CustomerAuthService.isLoggedIn()) return null;

    try {
      const res = await fetch('/api/wishlist', { headers: CustomerAuthService.getAuthHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.isSuccess || !Array.isArray(data.items)) return null;

      return data.items.map((line: any) => ({
        id: `${line.productId}-${line.variantName || line.packingType || 'default'}`,
        productId: String(line.productId),
        name: line.productName,
        image: line.imagePath || '',
        price: line.price,
        originalPrice: line.originalPrice,
        weight: line.variantName || line.packingType || '',
        addedAt: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Failed to fetch server wishlist:', err);
      return null;
    }
  }
}
