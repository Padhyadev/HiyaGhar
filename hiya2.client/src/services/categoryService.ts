export interface ApiCategory {
  id: number;
  categoryName: string;
  parentCategoryId: number;
  imagePath?: string;
  sku?: string;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
}

// Shown only when /api/category can't be reached (server down, bad connection). Same ids and
// names as the live categories (Combos is left out: it has its own section), each with its own
// photo from public/image/categories, so the fallback still looks like the real site.
const defaultCategories: ApiCategory[] = [
  { id: 1, categoryName: 'Mukhwas', parentCategoryId: 0, description: 'Handcrafted Organic Mouth Freshness & Digestives', imagePath: '/image/categories/mukhwash.webp', isActive: true, isDeleted: false },
  { id: 2, categoryName: 'Tea Masala', parentCategoryId: 0, description: 'Aromatic Royal Spices for Rich Authentic Chai', imagePath: '/image/categories/Tea-masala.webp', isActive: true, isDeleted: false },
  { id: 3, categoryName: 'Handmade Soap', parentCategoryId: 0, description: '100% Pure Herbal Skincare Bath Bars', imagePath: '/image/categories/Soap.webp', isActive: true, isDeleted: false },
  { id: 4, categoryName: 'Hair Oil', parentCategoryId: 0, description: 'Cold-Pressed Botanical Elixir for Healthy Hair', imagePath: '/image/categories/Hair_Oil.webp', isActive: true, isDeleted: false },
];

export class CategoryService {
  private static cachedCategories: ApiCategory[] = [];

  public static async getCategories(): Promise<ApiCategory[]> {
    try {
      const response = await fetch('/api/category');
      if (response.ok) {
        const data: ApiCategory[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedCategories = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('API fetch error for categories, using fallback cache:', err);
    }
    return this.cachedCategories.length > 0 ? this.cachedCategories : defaultCategories;
  }
}
