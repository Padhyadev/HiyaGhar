import { toProductSlug } from '../utils/productFormat';

export interface VariantAttributePair {
  attributeName: string;
  attributeValue: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  variantName: string;
  sku: string;
  attributes?: VariantAttributePair[];
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  reservedStock?: number;
  sellableStock?: number;
  isInStock: boolean;
  isDefault: boolean;
  isActive: boolean;
  // The variant's own gallery (primary first). Empty when it only uses the common images.
  primaryImage?: string | null;
  images?: ProductImage[];
}

export interface ProductImage {
  id: number;
  productId: number;
  imagePath: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  productName: string;
  shortDescription?: string;
  fullDescription?: string;
  mainImagePath?: string;
  basePrice: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  category?: { id: number; categoryName: string };
}

export class ProductService {
  private static cachedProducts: Product[] = [];

  public static async getProducts(categoryId?: number, isFeatured?: boolean): Promise<Product[]> {
    return (await this.getProductsWithStatus(categoryId, isFeatured)).products;
  }

  // Same as getProducts, plus whether the API could not be reached ("failed") - as opposed to an
  // empty result, e.g. every product in a category is inactive. Pages use it to decide on static
  // fallbacks; it's per call, so concurrent requests from other components can't affect it.
  public static async getProductsWithStatus(categoryId?: number, isFeatured?: boolean): Promise<{ products: Product[]; failed: boolean }> {
    try {
      let url = '/api/product';
      // Storefront only ever lists active products (admin pages call the API directly).
      const params: string[] = ['onlyActive=true'];
      if (categoryId && categoryId > 0) params.push(`categoryId=${categoryId}`);
      if (isFeatured !== undefined) params.push(`isFeatured=${isFeatured}`);
      url += `?${params.join('&')}`;

      const response = await fetch(url);
      if (response.ok) {
        const data: Product[] = await response.json();
        if (Array.isArray(data)) {
          if (data.length > 0) this.cachedProducts = data;
          return { products: data, failed: false };
        }
      }
    } catch (err) {
      console.warn('API fetch error for products, using cached:', err);
    }
    let list = this.cachedProducts;
    if (categoryId && categoryId > 0) {
      list = list.filter((p) => p.categoryId === categoryId);
    } else if (isFeatured !== undefined) {
      list = list.filter((p) => p.isFeatured === isFeatured);
    }
    return { products: list, failed: true };
  }

  public static async getProductById(id: number): Promise<Product | null> {
    if (!id || isNaN(id) || id <= 0) return null;

    // Check cached in-memory list first
    if (this.cachedProducts.length > 0) {
      const found = this.cachedProducts.find((p) => p.id === id);
      if (found) return found;
    }

    try {
      const response = await fetch(`/api/product/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`API fetch error for product ${id}:`, err);
    }

    return this.cachedProducts.find((p) => p.id === id) || null;
  }

  public static async getProductByIdOrSlug(identifier: string): Promise<Product | null> {
    if (!identifier) return null;
    const num = Number(identifier);
    if (!isNaN(num) && num > 0) {
      return this.getProductById(num);
    }

    // Lowest id wins when two products share a slug (same rule as the server).
    const cleanSlug = identifier.toLowerCase().trim();
    const allProds = await this.getProducts();
    const match = [...allProds]
      .sort((a, b) => a.id - b.id)
      .find((p) => toProductSlug(p.productName) === cleanSlug || p.productName.toLowerCase() === cleanSlug);

    return match || null;
  }

  /**
   * Canonical URL path for a product, as the server computes it (SeoMarkup.ProductPaths):
   * /product/{slug}, or /product/{id} when a lower-id product already has the same slug.
   */
  public static async getCanonicalPath(product: Pick<Product, 'id' | 'productName'>): Promise<string> {
    const slug = toProductSlug(product.productName);
    if (!slug) return `/product/${product.id}`;
    const all = await this.getProducts();
    const taken = all.some((p) => p.id < product.id && p.isActive !== false && toProductSlug(p.productName) === slug);
    return `/product/${taken ? product.id : slug}`;
  }
}
