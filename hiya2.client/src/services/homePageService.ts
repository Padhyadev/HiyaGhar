export interface HomePageComponentItem {
  id: number;
  componentId: number;
  title?: string;
  subtitle?: string;
  description?: string;
  refId?: string;
  refType?: string;
  displayOrder?: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy?: number;
}

export interface HomePageComponent {
  id: number;
  key: string;
  name: string;
  type: string;
  displayOrder: number;
  isActive: boolean;
  items: HomePageComponentItem[];
}

export class HomePageService {
  private static cachedComponents: HomePageComponent[] = [];

  public static async getComponents(): Promise<HomePageComponent[]> {
    try {
      const response = await fetch('/api/homepagecomponent');
      if (response.ok) {
        const data: HomePageComponent[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedComponents = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('API fetch error for home page components:', err);
    }
    return this.cachedComponents;
  }

  public static async getComponentByKey(key: string): Promise<HomePageComponent | null> {
    try {
      const response = await fetch(`/api/homepagecomponent/${key}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`API fetch error for home page component '${key}':`, err);
    }
    return null;
  }

  public static parseProductVariantRefIds(refIdStr?: string): Array<{ productId: number; variantId?: number }> {
    if (!refIdStr) return [];
    return refIdStr
      .split(',')
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .map((pair) => {
        if (pair.includes('-')) {
          const [prodId, varId] = pair.split('-');
          return { productId: Number(prodId), variantId: Number(varId) };
        }
        return { productId: Number(pair), variantId: undefined };
      })
      .filter((item) => !isNaN(item.productId));
  }
}

