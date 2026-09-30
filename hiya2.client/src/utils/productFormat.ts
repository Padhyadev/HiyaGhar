// Product variant names are stored as one or more comma-separated "AttributeName: Value"
// segments (e.g. "Weight: 100 g" or "Weight: 200 g, Packing: Pouch"). Card/selector UIs
// don't repeat the attribute name, so this strips each segment's prefix and joins the
// remaining values (e.g. "100 g" or "200 g • Pouch").
export function formatVariantLabel(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .split(',')
    .map((segment) => {
      const trimmed = segment.trim();
      const idx = trimmed.indexOf(':');
      return idx === -1 ? trimmed : trimmed.slice(idx + 1).trim();
    })
    .filter((v) => v.length > 0)
    .join(' • ');
}
