// The one placeholder shown wherever a product has no photo (or its photo fails to load).
export const NO_IMAGE = '/image/Noimage.png';

// <img onError> handler: swap to the placeholder once (no loop if the placeholder itself fails).
export function showNoImageOnError(e: { currentTarget: HTMLImageElement }): void {
  if (!e.currentTarget.src.endsWith(NO_IMAGE)) {
    e.currentTarget.src = NO_IMAGE;
  }
}

// Product variant names are stored as one or more comma-separated "AttributeName: Value"
// segments (e.g. "Weight: 100 g" or "Weight: 200 g, Packing: Pouch"). Card/selector UIs
// don't repeat the attribute name, so this strips each segment's prefix and joins the
// remaining values (e.g. "100 g" or "200 g • Pouch").
export function formatVariantLabel(raw?: string | null): string {
  if (!raw) return '';

  const clean = raw.trim();
  // Filter out any "No Variant", "Default", "Standard", "N/A" placeholders
  if (
    clean.toLowerCase() === 'no variant' ||
    clean.toLowerCase() === 'no-variant' ||
    clean.toLowerCase() === 'default' ||
    clean.toLowerCase() === 'standard' ||
    clean.toLowerCase() === 'none' ||
    clean.toLowerCase() === 'n/a'
  ) {
    return '';
  }

  const formatted = clean
    .split(',')
    .map((segment) => {
      const trimmed = segment.trim();
      const idx = trimmed.indexOf(':');
      const val = idx === -1 ? trimmed : trimmed.slice(idx + 1).trim();
      if (
        val.toLowerCase() === 'no variant' ||
        val.toLowerCase() === 'default' ||
        val.toLowerCase() === 'standard' ||
        val.toLowerCase() === 'none' ||
        val.toLowerCase() === 'n/a'
      ) {
        return '';
      }
      // If the value is a pure number (e.g. "150"), append 'g' for consistent weight formatting
      if (/^\d+$/.test(val)) {
        return `${val} g`;
      }
      return val;
    })
    .filter((v) => v.length > 0)
    .join(' • ');

  return formatted;
}

export function toProductSlug(name?: string | null, id?: string | number): string {
  if (!name) return id ? String(id) : '';
  const clean = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .trim()
    .replace(/\s+/g, '-'); // replace spaces with hyphens
  return clean || String(id || '');
}

interface ImageLike {
  imagePath: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

const orderImages = (imgs?: ImageLike[] | null): string[] =>
  [...(imgs || [])]
    .filter((i) => i && i.imagePath)
    .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((i) => i.imagePath);

// The gallery a shopper should see for a variant, primary first: the variant's own images
// if it has any, otherwise the product's common images, otherwise the product's main image.
// Once a product's photos are managed per variant (any variant has its own), a variant
// without photos really has none - it returns [] (callers show NO_IMAGE) instead of
// borrowing the main image, which is just a copy of another variant's photo.
export function getVariantImages(
  product: { images?: ImageLike[] | null; mainImagePath?: string | null; variants?: { images?: ImageLike[] | null }[] | null } | null | undefined,
  variant?: { images?: ImageLike[] | null } | null
): string[] {
  const own = orderImages(variant?.images);
  if (own.length > 0) return own;
  const common = orderImages(product?.images);
  if (common.length > 0) return common;
  const hasPerVariantPhotos = (product?.variants || []).some((v) => orderImages(v.images).length > 0);
  if (variant && hasPerVariantPhotos) return [];
  return product?.mainImagePath ? [product.mainImagePath] : [];
}

// The variant a listing card represents: the default variant, else the first one.
export function getDefaultVariant<T extends { isDefault?: boolean }>(variants?: T[] | null): T | undefined {
  return variants?.find((v) => v.isDefault) || variants?.[0];
}
