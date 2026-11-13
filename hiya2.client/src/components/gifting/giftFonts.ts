// Fonts, sizes, colours and A4 layout for the personalised gift insert.
// Mirrors Hiya2.Server/Services/Gifting/GiftSettings.cs - keep the two in step, so the live
// preview matches the printed PDF. Font files are served by the server at /gift-fonts/
// (the same files are embedded in the PDF); see Hiya2.Server/Assets/GiftFonts/README.md.

export interface GiftFont {
  key: string;
  label: string;
  /** CSS font-family value; the first name is the bundled @font-face in gifting.css. */
  css: string;
}

export const GIFT_FONTS: GiftFont[] = [
  { key: 'poppins', label: 'Poppins', css: "'Gift Poppins', sans-serif" },
  { key: 'arial', label: 'Arial', css: "'Gift Arimo', Arial, sans-serif" },
  { key: 'georgia', label: 'Georgia', css: "'Gift Gelasio', Georgia, serif" },
  { key: 'times', label: 'Times New Roman', css: "'Gift Tinos', 'Times New Roman', serif" },
  { key: 'playfair', label: 'Playfair Display', css: "'Gift Playfair Display', serif" },
  { key: 'dancing', label: 'Dancing Script', css: "'Gift Dancing Script', cursive" },
];

export const DEFAULT_FONT_KEY = 'poppins';
export const DEFAULT_FONT_SIZE_PX = 24;
export const DEFAULT_COLOR = '#11223A';
export const DEFAULT_ALIGN: GiftAlign = 'center';
export const MIN_FONT_SIZE_PX = 10;
export const MAX_FONT_SIZE_PX = 96;
export const MAX_MESSAGE_CHARS = 600;

export type GiftAlign = 'left' | 'center' | 'right';

export const GIFT_FONT_SIZES = [
  { label: 'Small', px: 18 },
  { label: 'Medium', px: 24 },
  { label: 'Large', px: 32 },
  { label: 'Extra Large', px: 44 },
];

export const GIFT_COLORS = [
  { label: 'Black', hex: '#000000' },
  { label: 'Navy', hex: '#11223A' },
  { label: 'Red', hex: '#D62828' },
  { label: 'Blue', hex: '#1D4ED8' },
  { label: 'Yellow', hex: '#E0A800' },
  { label: 'Green', hex: '#15803D' },
  { label: 'Purple', hex: '#7B2D8E' },
  { label: 'Gold', hex: '#B8862B' },
];

export const fontByKey = (key?: string | null): GiftFont =>
  GIFT_FONTS.find((f) => f.key === key) || GIFT_FONTS.find((f) => f.key === DEFAULT_FONT_KEY)!;

/** Maps a pasted CSS font-family list to one of our fonts, or null. */
export function matchFontKey(cssFamily?: string | null): string | null {
  if (!cssFamily) return null;
  const names = cssFamily.split(',').map((n) => n.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
  for (const name of names) {
    const direct = GIFT_FONTS.find((f) => f.key === name || f.label.toLowerCase() === name);
    if (direct) return direct.key;
    if (name === 'gift poppins') return 'poppins';
    if (name === 'arimo' || name === 'gift arimo' || name === 'helvetica') return 'arial';
    if (name === 'gelasio' || name === 'gift gelasio') return 'georgia';
    if (name === 'tinos' || name === 'gift tinos' || name === 'times') return 'times';
    if (name === 'gift playfair display') return 'playfair';
    if (name === 'gift dancing script') return 'dancing';
  }
  return null;
}

/** Normalises a CSS colour (#hex or rgb()) to #RRGGBB, or null. */
export function normaliseColor(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    return `#${h.toUpperCase()}`;
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(v);
  if (rgb) {
    return `#${[rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, Number(n)).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }
  return null;
}

/** Normalises a CSS font size (px or pt) to a clamped px string, or null. */
export function normaliseFontSize(value?: string | null): string | null {
  if (!value) return null;
  const m = /^(\d+(?:\.\d+)?)(px|pt)$/i.exec(value.trim());
  if (!m) return null;
  const px = m[2].toLowerCase() === 'pt' ? Number(m[1]) / 0.75 : Number(m[1]);
  return `${Math.round(Math.min(MAX_FONT_SIZE_PX, Math.max(MIN_FONT_SIZE_PX, px)))}px`;
}

// A4 insert layout in millimetres (same numbers as GiftSettings.cs).
export const A4 = {
  widthMm: 210,
  heightMm: 297,
  marginMm: 15,
  usableWidthMm: 180,
  usableHeightMm: 267,
  photoBoxHeightMm: 133.5, // exactly 50% of the usable printable area
  gapMm: 8,
  messageBoxHeightMm: 125.5,
};
