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
  // True when the last getProducts() call could not reach the API (as opposed to an empty result,
  // e.g. every product in a category is inactive). Pages use it to decide on static fallbacks.
  public static lastFetchFailed = false;

  public static async getProducts(categoryId?: number, isFeatured?: boolean): Promise<Product[]> {
    this.lastFetchFailed = false;
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
          return data;
        }
      }
    } catch (err) {
      console.warn('API fetch error for products, using cached:', err);
    }
    this.lastFetchFailed = true;
    const list = this.cachedProducts;
    if (categoryId && categoryId > 0) {
      return list.filter((p) => p.categoryId === categoryId);
    }
    if (isFeatured !== undefined) {
      return list.filter((p) => p.isFeatured === isFeatured);
    }
    return list;
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

    const cleanSlug = identifier.toLowerCase().trim();
    const allProds = await this.getProducts();
    const match = allProds.find((p) => {
      const slug = p.productName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      return slug === cleanSlug || p.productName.toLowerCase() === cleanSlug;
    });

    return match || null;
  }
}
