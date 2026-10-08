export interface ProductCustomMeta {
  ingredients?: string[];
  benefits?: string[];
  servingSize?: string;
  nutritionalInfo?: Record<string, string>;
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
 * <!--HIYA_META: {"ingredients":[...], "benefits":[...], "nutritionalInfo":{...}} -->
 */
export const parseProductFullDescription = (
  fullDescription?: string,
  productId?: string | number,
  categoryName?: string,
  productName?: string
): {
  cleanDescription: string;
  ingredients: string[];
  benefits: string[];
  servingSize: string;
  nutritionalInfo: Record<string, string> | null;
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

  const catLower = (categoryName || '').toLowerCase();
  const nameLower = (productName || '').toLowerCase();

  const isNonFood =
    catLower.includes('oil') ||
    catLower.includes('soap') ||
    catLower.includes('bath') ||
    catLower.includes('skin') ||
    catLower.includes('hair') ||
    nameLower.includes('oil') ||
    nameLower.includes('soap') ||
    nameLower.includes('shampoo');

  const isMasala =
    catLower.includes('masala') ||
    catLower.includes('tea') ||
    catLower.includes('chai') ||
    nameLower.includes('masala') ||
    nameLower.includes('tea');

  // Determine dynamic default ingredients
  let defaultIngredients: string[] = [];
  let defaultBenefits: string[] = [];
  let defaultNutrition: Record<string, string> | null = null;

  if (isNonFood) {
    if (catLower.includes('soap') || nameLower.includes('soap')) {
      defaultIngredients = ['Organic Coconut Oil', 'Pure Neem Extracts', 'Cold-Pressed Aloe Vera', 'Essential Oils', 'Natural Glycerin'];
      defaultBenefits = ['Deeply cleanses & purifies skin', '100% Chemical & Paraben Free', 'Retains natural skin moisture', 'Gentle for everyday use'];
    } else {
      defaultIngredients = ['Cold-Pressed Sesame Oil', 'Pure Coconut Oil', 'Bhringraj & Amla', 'Brahmi & Hibiscus', '14 Rare Ayurvedic Herbs'];
      defaultBenefits = ['Reduces hair fall & strengthens roots', 'Promotes shiny, thick hair growth', 'Deeply nourishes scalp & prevents dandruff', '100% Mineral Oil Free'];
    }
    defaultNutrition = null; // Non-food items do not have nutritional values
  } else if (isMasala) {
    defaultIngredients = ['Green Cardamom (Elaichi)', 'Sun-dried Ginger (Sonth)', 'Cinnamon (Dalchini)', 'Cloves (Laung)', 'Black Pepper & Nutmeg'];
    defaultBenefits = ['Boosts immunity & metabolism', 'Authentic traditional aroma & rich flavor', 'Rich in natural antioxidants', '100% Pure Spices with Zero Preservatives'];
    defaultNutrition = {
      Energy: '280 kcal',
      Carbohydrates: '42.0g',
      Protein: '9.5g',
      'Total Fat': '7.8g',
      'Dietary Fiber': '18.4g',
    };
  } else {
    // Mukhwas / Edible Mouth Freshener default
    defaultIngredients = ['100% Natural Ingredients', 'Sun-dried Rose Gulkand', 'Silver Cardamom', 'Sweet Coconut Flakes', 'Menthol Crystals'];
    defaultBenefits = ['Authentic taste & freshness', 'Instant long-lasting oral freshness', '100% Tobacco & Supari Free', 'Aids post-meal digestive wellness'];
    defaultNutrition = {
      Energy: '385 kcal',
      Carbohydrates: '68.5g',
      Protein: '6.2g',
      'Total Fat': '9.8g',
      'Dietary Fiber': '14.2g',
    };
  }

  const ingredients =
    mergedMeta.ingredients && mergedMeta.ingredients.length > 0
      ? mergedMeta.ingredients
      : defaultIngredients;

  const benefits =
    mergedMeta.benefits && mergedMeta.benefits.length > 0
      ? mergedMeta.benefits
      : defaultBenefits;

  let nutritionalInfo: Record<string, string> | null = null;
  if (mergedMeta.nutritionalInfo && Object.keys(mergedMeta.nutritionalInfo).length > 0) {
    // Filter out empty entries
    const cleanNutrition: Record<string, string> = {};
    Object.entries(mergedMeta.nutritionalInfo).forEach(([k, v]) => {
      if (v && v.trim().length > 0) {
        cleanNutrition[k] = v.trim();
      }
    });
    if (Object.keys(cleanNutrition).length > 0) {
      nutritionalInfo = cleanNutrition;
    }
  } else if (!isNonFood) {
    nutritionalInfo = defaultNutrition;
  }

  return {
    cleanDescription: cleanDescription || (isNonFood ? '100% Pure Ayurvedic & Natural wellness formula handcrafted with organic ingredients.' : 'Handcrafted with pure premium natural ingredients for unmatched taste and wellness.'),
    ingredients,
    benefits,
    servingSize: mergedMeta.servingSize?.trim() || '100g',
    nutritionalInfo,
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
