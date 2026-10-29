export interface ProductFaq {
  question: string;
  answer: string;
}

/**
 * One product line inside a combo (admin: Catalog > Combos). name/variant are a snapshot for
 * display; the struck-through combo price is re-totalled on the server from the live variant
 * prices (Hiya2.Server/Services/ComboPricing.cs).
 */
export interface ComboItem {
  productId: number;
  variantId: number;
  quantity: number;
  name: string;
  variant: string;
}

export interface ProductCustomMeta {
  ingredients?: string[];
  benefits?: string[];
  servingSize?: string;
  nutritionalInfo?: Record<string, string>;
  /** e.g. "6 months from the date of manufacture" */
  shelfLife?: string;
  /** Plain text; line breaks are kept on the product page. */
  howToUse?: string;
  faqs?: ProductFaq[];
  /** Present only on combo products. */
  comboItems?: ComboItem[];
  crossSellProductIds?: number[];
  highlights?: Array<{
    title: string;
    description: string;
  }>;
}

const STORAGE_KEY = 'hiyaghar_product_custom_meta';

export const getStoredProductMeta = (productId: string | number): ProductCustomMeta | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[productId.toString()] || null;
  } catch (e) {
    console.warn('Failed to load product meta from storage:', e);
    return null;
  }
};

export const saveStoredProductMeta = (productId: string | number, meta: ProductCustomMeta): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[productId.toString()] = meta;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to save product meta to storage:', e);
  }
};

/**
 * Parses embedded JSON block or standard text from fullDescription.
 * Format inside fullDescription can be standard text, or can embed:
 * <!--HIYA_META: {"ingredients":[...], "benefits":[...], "nutritionalInfo":{...}, "shelfLife":"...", "howToUse":"...", "faqs":[{"question":"...","answer":"..."}]} -->
 *
 * Only values saved by the admin are returned. There are no per-category placeholder
 * ingredients, benefits, nutrition values or descriptions: empty means "not entered" and the
 * product page hides that section. The server reads the same block (SeoMarkup.ProductMeta).
 */
export const parseProductFullDescription = (
  fullDescription?: string,
  productId?: string | number,
  _categoryName?: string,
  _productName?: string
): {
  cleanDescription: string;
  ingredients: string[];
  benefits: string[];
  servingSize: string;
  nutritionalInfo: Record<string, string> | null;
  shelfLife: string;
  howToUse: string;
  faqs: ProductFaq[];
  comboItems: ComboItem[];
  crossSellProductIds?: number[];
  highlights?: Array<{ title: string; description: string }>;
} => {
  let cleanDescription = (fullDescription || '').trim();
  let embeddedMeta: ProductCustomMeta | null = null;

  // Check for embedded meta tag
  const metaMatch = cleanDescription.match(/<!--HIYA_META:\s*([\s\S]*?)\s*-->/);
  if (metaMatch) {
    try {
      embeddedMeta = JSON.parse(metaMatch[1]);
      cleanDescription = cleanDescription.replace(metaMatch[0], '').trim();
    } catch (e) {
      console.warn('Failed to parse embedded HIYA_META JSON:', e);
    }
  }

  // Also check local storage overrides
  const localMeta = productId ? getStoredProductMeta(productId) : null;
  const mergedMeta: ProductCustomMeta = {
    ...(embeddedMeta || {}),
    ...(localMeta || {}),
    nutritionalInfo: {
      ...(embeddedMeta?.nutritionalInfo || {}),
      ...(localMeta?.nutritionalInfo || {}),
    },
  };

  const cleanList = (list?: string[]) =>
    Array.isArray(list) ? list.map((x) => String(x ?? '').trim()).filter((x) => x.length > 0) : [];

  // Filter out empty entries
  let nutritionalInfo: Record<string, string> | null = null;
  const cleanNutrition: Record<string, string> = {};
  Object.entries(mergedMeta.nutritionalInfo || {}).forEach(([k, v]) => {
    if (k.trim() && v && String(v).trim().length > 0) {
      cleanNutrition[k.trim()] = String(v).trim();
    }
  });
  if (Object.keys(cleanNutrition).length > 0) {
    nutritionalInfo = cleanNutrition;
  }

  const faqs = Array.isArray(mergedMeta.faqs)
    ? mergedMeta.faqs
        .map((f) => ({ question: String(f?.question ?? '').trim(), answer: String(f?.answer ?? '').trim() }))
        .filter((f) => f.question.length > 0 && f.answer.length > 0)
    : [];

  return {
    cleanDescription,
    ingredients: cleanList(mergedMeta.ingredients),
    benefits: cleanList(mergedMeta.benefits),
    servingSize: mergedMeta.servingSize?.trim() || '100g',
    nutritionalInfo,
    shelfLife: (mergedMeta.shelfLife || '').trim(),
    howToUse: (mergedMeta.howToUse || '').trim(),
    faqs,
    comboItems: Array.isArray(mergedMeta.comboItems)
      ? mergedMeta.comboItems.filter((i) => i && i.productId > 0 && i.variantId > 0 && i.quantity > 0)
      : [],
    crossSellProductIds: mergedMeta.crossSellProductIds,
    highlights: mergedMeta.highlights,
  };
};

/**
 * Helper to construct fullDescription with embedded metadata so backend DB stores it
 * and it persists across sessions and all devices!
 */
export const buildFullDescriptionWithMeta = (
  descriptionText: string,
  meta: ProductCustomMeta
): string => {
  const clean = descriptionText.replace(/<!--HIYA_META:\s*[\s\S]*?\s*-->/g, '').trim();
  const metaJson = JSON.stringify(meta);
  return `${clean}\n\n<!--HIYA_META: ${metaJson} -->`.trim();
};
