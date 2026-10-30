import { AdminAuthService } from './adminAuthService';
import { CategoryService } from './categoryService';
import { ProductService, type Product } from './productService';
import { parseProductFullDescription, type ComboItem } from '../utils/productMetaStore';

// Combos are ordinary products in the "Combos" category with one hidden variant ("No Variant"):
// variant price = combo selling price (what the customer pays), variant originalPrice = total of the
// included items (shown struck through, kept up to date by the server: Services/ComboPricing.cs).
// The included items are stored in the product's HIYA_META block as `comboItems`.
export const COMBO_CATEGORY_NAME = 'Combos';

export const isComboCategoryName = (name?: string) => (name || '').trim().toLowerCase() === COMBO_CATEGORY_NAME.toLowerCase();

export const getComboItems = (product: Pick<Product, 'id' | 'fullDescription'>): ComboItem[] =>
  parseProductFullDescription(product.fullDescription, product.id).comboItems;

export const isComboProduct = (product: Pick<Product, 'id' | 'fullDescription'>) => getComboItems(product).length > 0;

export class ComboService {
  /** Id of the Combos category, or null until the admin saves the first combo. */
  public static async getCategoryId(): Promise<number | null> {
    const categories = await CategoryService.getCategories();
    return categories.find((c) => !c.isDeleted && isComboCategoryName(c.categoryName))?.id ?? null;
  }

  /** Admin only: the Combos category id, creating the category on the first save. */
  public static async ensureCategoryId(): Promise<number> {
    const existing = await this.getCategoryId();
    if (existing) return existing;

    const body = new FormData();
    body.append('CategoryName', COMBO_CATEGORY_NAME);
    body.append('SKU', 'COMBOS');
    body.append('Description', 'Ready-made combo packs at one combo price');
    body.append('IsActive', 'true');
    body.append('ParentCategoryId', '0');
    const res = await fetch('/api/category', { method: 'POST', headers: AdminAuthService.getAuthHeadersForFormData(), body });
    if (!res.ok) throw new Error('Could not create the Combos category.');
    const created = await res.json();
    return created.id;
  }

  /** Active combos for the storefront (empty list until the first combo exists). */
  public static async getActiveCombos(): Promise<{ combos: Product[]; failed: boolean }> {
    const categoryId = await this.getCategoryId();
    if (!categoryId) return { combos: [], failed: false };
    const { products, failed } = await ProductService.getProductsWithStatus(categoryId);
    return { combos: products.filter((p) => p.isActive !== false && p.categoryId === categoryId), failed };
  }
}
