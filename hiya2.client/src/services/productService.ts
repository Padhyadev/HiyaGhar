export interface VariantAttributePair {
  attributeName: string;
  attributeValue: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  variantName: string;
  sku: string;
  attributes?: VariantAttributePair[];
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  reservedStock?: number;
  sellableStock?: number;
  isInStock: boolean;
  isDefault: boolean;
  isActive: boolean;
}

export interface ProductImage {
  id: number;
  productId: number;
  imagePath: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  productName: string;
  shortDescription?: string;
  fullDescription?: string;
  mainImagePath?: string;
  basePrice: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  category?: { id: number; categoryName: string };
}

const defaultProducts: Product[] = [
  {
    id: 1,
    categoryId: 1,
    productName: 'Organic Jamun Mukhwas',
    shortDescription: '100% natural digestive Jamun mouth freshener.',
    fullDescription: 'Handcrafted with pure organic Jamun seeds and natural spices.',
    mainImagePath: '/image/jamunbottole_clean.webp',
    basePrice: 299,
    discountPrice: 249,
    rating: 4.9,
    reviewCount: 184,
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 1, productId: 1, variantName: '200g Jar', sku: 'JM-200', price: 249, originalPrice: 299, stockQuantity: 50, isInStock: true, isDefault: true, isActive: true }
    ],
    images: [{ id: 1, productId: 1, imagePath: '/image/jamunbottole_clean.webp', displayOrder: 1, isPrimary: true }]
  },
  {
    id: 2,
    categoryId: 2,
    productName: 'Royal Spice Tea Masala',
    shortDescription: 'Aromatic traditional spice blend for authentic chai.',
    fullDescription: 'Blend of premium cardamom, ginger, cloves, and cinnamon.',
    mainImagePath: '/image/jamunbottole_clean.webp',
    basePrice: 249,
    discountPrice: 199,
    rating: 4.8,
    reviewCount: 142,
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 2, productId: 2, variantName: '100g Pack', sku: 'TM-100', price: 199, originalPrice: 249, stockQuantity: 40, isInStock: true, isDefault: true, isActive: true }
    ],
    images: [{ id: 2, productId: 2, imagePath: '/image/jamunbottole_clean.webp', displayOrder: 1, isPrimary: true }]
  },
  {
    id: 3,
    categoryId: 3,
    productName: 'Kesar Saffron Handmade Soap',
    shortDescription: 'Nourishing herbal soap enriched with pure saffron.',
    fullDescription: 'Handmade cold-processed herbal soap bar for glowing skin.',
    mainImagePath: '/image/jamunbottole_clean.webp',
    basePrice: 199,
    discountPrice: 149,
    rating: 4.9,
    reviewCount: 96,
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 3, productId: 3, variantName: '125g Bar', sku: 'HS-125', price: 149, originalPrice: 199, stockQuantity: 60, isInStock: true, isDefault: true, isActive: true }
    ],
    images: [{ id: 3, productId: 3, imagePath: '/image/jamunbottole_clean.webp', displayOrder: 1, isPrimary: true }]
  },
  {
    id: 4,
    categoryId: 4,
    productName: 'Botanical Hair Elixir Oil',
    shortDescription: 'Pure Ayurvedic hair oil for strong nourished roots.',
    fullDescription: 'Cold-pressed botanical oil infusion with Bhringraj and Amla.',
    mainImagePath: '/image/jamunbottole_clean.webp',
    basePrice: 399,
    discountPrice: 349,
    rating: 5.0,
    reviewCount: 210,
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 4, productId: 4, variantName: '200ml Bottle', sku: 'HO-200', price: 349, originalPrice: 399, stockQuantity: 30, isInStock: true, isDefault: true, isActive: true }
    ],
    images: [{ id: 4, productId: 4, imagePath: '/image/jamunbottole_clean.webp', displayOrder: 1, isPrimary: true }]
  },
  {
    id: 5,
    categoryId: 5,
    productName: 'Luxury Festive Gift Hamper',
    shortDescription: 'Exclusive celebration gift hamper box.',
    fullDescription: 'Includes Mukhwas jar, Royal Tea Masala, and Handmade Soap bar.',
    mainImagePath: '/image/jamunbottole_clean.webp',
    basePrice: 799,
    discountPrice: 699,
    rating: 5.0,
    reviewCount: 75,
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 5, productId: 5, variantName: 'Grand Box', sku: 'GH-01', price: 699, originalPrice: 799, stockQuantity: 20, isInStock: true, isDefault: true, isActive: true }
    ],
    images: [{ id: 5, productId: 5, imagePath: '/image/jamunbottole_clean.webp', displayOrder: 1, isPrimary: true }]
  }
];

export class ProductService {
  private static cachedProducts: Product[] = [];

  public static async getProducts(categoryId?: number, isFeatured?: boolean): Promise<Product[]> {
    try {
      let url = '/api/product';
      const params: string[] = [];
      if (categoryId && categoryId > 0) params.push(`categoryId=${categoryId}`);
      if (isFeatured !== undefined) params.push(`isFeatured=${isFeatured}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url);
      if (response.ok) {
        const data: Product[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedProducts = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('API fetch error for products, using cached:', err);
    }
    const list = this.cachedProducts.length > 0 ? this.cachedProducts : defaultProducts;
    if (categoryId && categoryId > 0) {
      return list.filter((p) => p.categoryId === categoryId);
    }
    if (isFeatured !== undefined) {
      return list.filter((p) => p.isFeatured === isFeatured);
    }
    return list;
  }

  public static async getProductById(id: number): Promise<Product | null> {
    if (!id || isNaN(id) || id <= 0) return null;

    // Check cached in-memory list first
    if (this.cachedProducts.length > 0) {
      const found = this.cachedProducts.find((p) => p.id === id);
      if (found) return found;
    }

    // Never fall back to defaultProducts here: its demo ids (1-5) collide with real catalog ids.
    try {
      const response = await fetch(`/api/product/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`API fetch error for product ${id}:`, err);
    }

    return this.cachedProducts.find((p) => p.id === id) || null;
  }

  public static async getProductByIdOrSlug(identifier: string): Promise<Product | null> {
    if (!identifier) return null;
    const num = Number(identifier);
    if (!isNaN(num) && num > 0) {
      return this.getProductById(num);
    }

    const cleanSlug = identifier.toLowerCase().trim();
    const allProds = await this.getProducts();
    const match = allProds.find((p) => {
      const slug = p.productName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      return slug === cleanSlug || p.productName.toLowerCase() === cleanSlug;
    });

    return match || null;
  }
}
