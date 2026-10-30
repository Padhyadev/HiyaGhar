// Admin-set display order for the product page option rows (Packing, Weight, ...) and
// their value buttons (Pouch, Bottle, ...), from Catalog > Attributes. Variants store
// their options as "Name: Value" text, so lookups are by normalised name/value.

interface AttributeOrderRow {
  name: string;
  displayName?: string | null;
  displayOrder: number;
  values: Array<{ value: string; displayOrder: number }>;
}

export interface AttributeOrder {
  attributeOrder: (name: string) => number | null;
  valueOrder: (attributeName: string, value: string) => number | null;
}

// "100 g", "100g" and "100 G" are the same value.
const normalise = (text: string) => (text || '').toLowerCase().replace(/\s+/g, '');

let cached: Promise<AttributeOrder> | null = null;

const buildOrder = (rows: AttributeOrderRow[]): AttributeOrder => {
  const attrOrders = new Map<string, number>();
  const valueOrders = new Map<string, Map<string, number>>();
  rows.forEach((row) => {
    const values = new Map<string, number>();
    row.values.forEach((v) => {
      if (v.displayOrder > 0) values.set(normalise(v.value), v.displayOrder);
    });
    [row.name, row.displayName].filter(Boolean).forEach((name) => {
      const key = normalise(name as string);
      if (row.displayOrder > 0) attrOrders.set(key, row.displayOrder);
      valueOrders.set(key, values);
    });
  });
  return {
    attributeOrder: (name) => attrOrders.get(normalise(name)) ?? null,
    valueOrder: (attributeName, value) => valueOrders.get(normalise(attributeName))?.get(normalise(value)) ?? null,
  };
};

const EMPTY_ORDER: AttributeOrder = { attributeOrder: () => null, valueOrder: () => null };

export class AttributeOrderService {
  // Loaded once per page load; an error just means "no admin order" (fallback sorting).
  public static getOrder(): Promise<AttributeOrder> {
    if (!cached) {
      cached = fetch('/api/attribute/display-order')
        .then((res) => (res.ok ? res.json() : []))
        .then((rows) => (Array.isArray(rows) ? buildOrder(rows) : EMPTY_ORDER))
        .catch(() => {
          cached = null;
          return EMPTY_ORDER;
        });
    }
    return cached;
  }
}
