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
