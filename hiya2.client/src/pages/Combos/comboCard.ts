import type { Product as ApiProduct } from '../../services/productService';
import { getComboItems } from '../../services/comboService';
import type { MukhwasProduct } from '../../types/mukhwas';
import { getDefaultVariant, getVariantImages, NO_IMAGE } from '../../utils/productFormat';

export type ComboCard = MukhwasProduct;

/**
 * A combo product as a listing card (MukhwasProductCard): price = combo price, originalPrice =
 * total of the included items (struck through, with the % OFF badge), and "3 × Drakshawati, …"
 * as the description line.
 */
export function comboToCard(p: ApiProduct): ComboCard {
  const variant = getDefaultVariant(p.variants);
  const price = variant ? variant.price : p.discountPrice || p.basePrice;
  const originalPrice = Math.max(variant?.originalPrice || 0, price);
  const discountPercentage = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const includes = getComboItems(p).map((i) => `${i.quantity} × ${i.name}`).join(', ');
  const images = getVariantImages(p, variant);

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'special',
    categoryLabel: 'Combo Pack',
    price,
    originalPrice,
    discountPercentage,
    rating: p.rating || 0,
    reviewsCount: p.reviewCount || 0,
    image: images[0] || p.mainImagePath || NO_IMAGE,
    secondaryImage: images[1],
    shortDescription: includes ? `Includes ${includes}` : p.shortDescription || '',
    longDescription: p.shortDescription || '',
    weightOptions: [],
    variants: p.variants || [],
    isBestSeller: p.isFeatured,
    nutritionalInfo: { energy: '', carbs: '', protein: '', fat: '', fiber: '' },
  };
}
