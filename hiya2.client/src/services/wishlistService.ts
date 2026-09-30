import { WishlistApiService } from './wishlistApiService';

export interface WishlistItem {
  id: string; // composite or product ID
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  weight: string;
  addedAt: string;
}

const WISHLIST_STORAGE_KEY = 'hiya_wishlist_items';

export class WishlistService {
  private static listeners: Array<() => void> = [];

  public static getItems(): WishlistItem[] {
    try {
      const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveItems(items: WishlistItem[]): void {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }

  public static addItem(item: Omit<WishlistItem, 'addedAt'>): boolean {
    const items = this.getItems();
    const existingIndex = items.findIndex((i) => i.productId === item.productId && i.weight === item.weight);

    if (existingIndex > -1) {
      return false; // Already in wishlist
    }

    items.push({
      ...item,
      addedAt: new Date().toISOString(),
    });

    this.saveItems(items);
    WishlistApiService.syncAdd(item.productId, item.weight);
    return true;
  }

  public static removeItem(id: string): void {
    const existing = this.getItems().find((i) => i.id === id || i.productId === id);
    const items = this.getItems().filter((i) => i.id !== id && i.productId !== id);
    this.saveItems(items);
    if (existing) {
      WishlistApiService.syncRemove(existing.productId, existing.weight);
    }
  }

  // Called once after a successful login: pushes the guest wishlist
  // accumulated in localStorage up to the server, then replaces local state
  // with the authoritative server wishlist.
  public static async syncWithServerAfterLogin(): Promise<void> {
    const guestItems = this.getItems();
    if (guestItems.length > 0) {
      await WishlistApiService.mergeGuestWishlistToServer(
        guestItems.map((i) => ({ productId: i.productId, weight: i.weight }))
      );
    }

    const serverItems = await WishlistApiService.fetchServerWishlist();
    if (serverItems) {
      this.saveItems(serverItems);
    }
  }

  public static isInWishlist(productId: string, weight?: string): boolean {
    const items = this.getItems();
    if (weight) {
      return items.some((i) => i.productId === productId && i.weight === weight);
    }
    return items.some((i) => i.productId === productId);
  }

  public static toggleWishlist(item: Omit<WishlistItem, 'addedAt'>): boolean {
    if (this.isInWishlist(item.productId, item.weight)) {
      this.removeItem(item.id || item.productId);
      return false;
    } else {
      this.addItem(item);
      return true;
    }
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}
