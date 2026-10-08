export interface GiftHamperProductVariant {
  id: number;
  variantName: string;
  sku: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  isInStock: boolean;
  isDefault: boolean;
}

export interface GiftHamperProductImage {
  id: number;
  imagePath: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface GiftHamperProduct {
  id: number;
  categoryId: number;
  productName: string;
  shortDescription?: string;
  mainImagePath?: string;
  basePrice: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  variants: GiftHamperProductVariant[];
  images: GiftHamperProductImage[];
}

export interface GiftHamperOccasion {
  id: number;
  name: string;
  slug: string;
  description?: string;
  bannerImagePath?: string;
  displayOrder: number;
  isActive: boolean;
  products: GiftHamperProduct[];
}

export class GiftHamperService {
  private static cachedOccasions: GiftHamperOccasion[] = [];

  public static async getOccasions(onlyActive: boolean = true): Promise<GiftHamperOccasion[]> {
    try {
      const res = await fetch(`/api/gifthamper/occasions?onlyActive=${onlyActive}`);
      if (res.ok) {
        const data: GiftHamperOccasion[] = await res.json();
        if (Array.isArray(data)) {
          this.cachedOccasions = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch gift hamper occasions:', err);
    }
    return this.cachedOccasions;
  }

  public static async getOccasionBySlug(slug: string): Promise<GiftHamperOccasion | null> {
    try {
      const res = await fetch(`/api/gifthamper/occasions/${encodeURIComponent(slug)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`Failed to fetch gift hamper occasion '${slug}':`, err);
    }
    const fromCache = this.cachedOccasions.find((o) => o.slug === slug);
    return fromCache || null;
  }
}
