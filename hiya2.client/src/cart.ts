import { CartApiService } from './services/cartApiService';
import { NO_IMAGE } from './utils/productFormat';
import { trackAddToCart } from './utils/analytics';
import { navigateTo } from './utils/navigation';

export interface CartItem {
  id: string; // Unique composite ID: productId + weight (e.g., 'royal-rose-paan-250g')
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  weight: string;
  quantity: number;
}

const STORAGE_KEY = 'hiya_shopping_cart';
const BUY_NOW_STORAGE_KEY = 'hiya_buy_now_item';

export class CartService {
  private static listeners: Array<() => void> = [];
  private static itemAddedListeners: Array<(item: Omit<CartItem, 'id'>) => void> = [];
  private static cartOpen: boolean = false;
  private static pillVisible: boolean = false;

  public static getItems(): CartItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveItems(items: CartItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }

  public static addItem(item: Omit<CartItem, 'id'>): string {
    const items = this.getItems();
    const itemId = `${item.productId}-${item.weight}`;
    const existingIndex = items.findIndex((i) => i.id === itemId);

    if (existingIndex > -1) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push({
        ...item,
        id: itemId,
      });
    }

    this.saveItems(items);
    this.itemAddedListeners.forEach((listener) => listener(item));
    trackAddToCart({ productId: item.productId, name: item.name, price: item.price, quantity: item.quantity, variant: item.weight });

    const hash = window.location.hash.toLowerCase();
    if (!hash.includes('/cart') && !hash.includes('/checkout')) {
      this.pillVisible = true;
      this.notifyListeners();
    }

    CartApiService.syncAdd(item.productId, item.weight, item.quantity);
    return itemId;
  }

  public static updateQuantity(id: string, quantity: number): void {
    let items = this.getItems();
    const existing = items.find((i) => i.id === id);
    if (!existing) return;

    const delta = quantity - existing.quantity;

    if (quantity <= 0) {
      items = items.filter((i) => i.id !== id);
    } else {
      existing.quantity = quantity;
    }
    this.saveItems(items);
    CartApiService.syncQuantityChange(existing.productId, existing.weight, delta);
  }

  public static removeItem(id: string): void {
    const existing = this.getItems().find((i) => i.id === id);
    const items = this.getItems().filter((i) => i.id !== id);
    this.saveItems(items);
    if (existing) {
      CartApiService.syncRemove(existing.productId, existing.weight, existing.quantity);
    }
  }

  public static clearCart(): void {
    this.saveItems([]);
  }

  // Called once after a successful login: pushes the guest cart accumulated
  // in localStorage up to the server, then replaces local state with the
  // authoritative server cart.
  public static async syncWithServerAfterLogin(): Promise<void> {
    const guestItems = this.getItems();
    if (guestItems.length > 0) {
      await CartApiService.mergeGuestCartToServer(
        guestItems.map((i) => ({ productId: i.productId, weight: i.weight, quantity: i.quantity }))
      );
    }

    const serverItems = await CartApiService.fetchServerCart();
    if (serverItems) {
      this.saveItems(serverItems);
    }
  }

  // "Buy Now" goes straight to checkout with just that product. It is kept in
  // sessionStorage, never in the cart, so leaving checkout without paying
  // leaves the cart exactly as it was.
  public static buyNow(item: Omit<CartItem, 'id'>): void {
    try {
      sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify({ ...item, id: `${item.productId}-${item.weight}` }));
    } catch (e) {
      console.error('Failed to save Buy Now item', e);
      return;
    }
    navigateTo('/checkout?buyNow=1');
  }

  public static isBuyNowCheckout(): boolean {
    return new URLSearchParams(window.location.search).has('buyNow');
  }

  private static getBuyNowItem(): CartItem | null {
    try {
      const data = sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Items the current checkout is for: just the Buy Now product, or the whole cart.
  public static getCheckoutItems(): CartItem[] {
    if (!this.isBuyNowCheckout()) return this.getItems();
    const item = this.getBuyNowItem();
    return item ? [item] : [];
  }

  // After an order is placed: a Buy Now order leaves the cart alone.
  public static finishCheckout(): void {
    if (this.isBuyNowCheckout()) {
      try {
        sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }
    this.clearCart();
  }

  public static getTotalCount(): number {
    return this.getItems().reduce((acc, item) => acc + item.quantity, 0);
  }

  public static getSubtotal(): number {
    return this.getItems().reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  // Cart Drawer open/close state
  public static isCartOpen(): boolean {
    return this.cartOpen;
  }

  public static openCart(): void {
    this.cartOpen = true;
    this.hidePill();
    this.notifyListeners();
  }

  public static closeCart(): void {
    this.cartOpen = false;
    this.notifyListeners();
  }

  public static toggleCart(): void {
    this.cartOpen = !this.cartOpen;
    if (this.cartOpen) {
      this.hidePill();
    }
    this.notifyListeners();
  }

  // "View Cart" floating pill visibility — shown once on an explicit Add to
  // Cart click, hidden again on route change or while already on /cart or /checkout.
  public static isPillVisible(): boolean {
    return this.pillVisible;
  }

  public static hidePill(): void {
    if (!this.pillVisible) return;
    this.pillVisible = false;
    this.notifyListeners();
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public static subscribeItemAdded(listener: (item: Omit<CartItem, 'id'>) => void): () => void {
    this.itemAddedListeners.push(listener);
    return () => {
      this.itemAddedListeners = this.itemAddedListeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// Hide the "View Cart" floating pill whenever the route changes, regardless
// of which component (if any) is currently mounted to display it.
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => CartService.hidePill());
  window.addEventListener('popstate', () => CartService.hidePill());
}

/**
 * Original Quickbeam CodePen Bezier Curve Flying Product Animation
 * Implementation based on Filip Danisko's Quickbeam CodePen (https://codepen.io/filipdanisko/full/VadXXq)
 */
export function triggerFlyingProductAnimation(
  sourceImageEl: HTMLElement | null,
  itemId?: string,
  onComplete?: () => void
): void {
  if (!sourceImageEl) {
    if (onComplete) onComplete();
    return;
  }

  let attempts = 0;
  const findDestinationAndAnimate = () => {
    let destinationEl: HTMLElement | null = null;

    if (itemId) {
      destinationEl = document.getElementById(`hiyaghar-pill-avatar-${itemId}`);
    }
    if (!destinationEl) {
      destinationEl =
        document.querySelector('.hiyaghar-pill-avatars-group') ||
        document.querySelector('.hiyaghar-floating-cart-pill') ||
        document.querySelector('.hiyaghar-cart-cyan-pill');
    }

    if (!destinationEl && attempts < 8) {
      attempts++;
      setTimeout(findDestinationAndAnimate, 40);
      return;
    }

    if (!destinationEl) {
      if (onComplete) onComplete();
      return;
    }

    const startRect = sourceImageEl.getBoundingClientRect();
    const destEl: HTMLElement = destinationEl;

    // Create flying image clone container
    const flyingContainer = document.createElement('div');
    flyingContainer.className = 'quickbeam-flying-product';

    const imgClone = document.createElement('img');
    let imgSrc = '';
    if (sourceImageEl instanceof HTMLImageElement) {
      imgSrc = sourceImageEl.src;
    } else {
      const childImg = sourceImageEl.querySelector('img');
      if (childImg) imgSrc = childImg.src;
    }
    if (!imgSrc) {
      imgSrc = sourceImageEl.getAttribute('data-img-src') || '';
    }
    imgClone.src = imgSrc || NO_IMAGE;
    flyingContainer.appendChild(imgClone);

    // Viewport coordinates + position: fixed, because the cart pill itself is
    // fixed — page scrolling mid-flight then doesn't shift the landing point.
    const startX = startRect.left;
    const startY = startRect.top;
    const startWidth = Math.max(40, startRect.width || 100);
    const startHeight = Math.max(40, startRect.height || 100);

    flyingContainer.style.position = 'fixed';
    flyingContainer.style.width = `${startWidth}px`;
    flyingContainer.style.height = `${startHeight}px`;
    flyingContainer.style.left = `0px`;
    flyingContainer.style.top = `0px`;
    flyingContainer.style.transform = `translate(${startX}px, ${startY}px)`;

    document.body.appendChild(flyingContainer);

    // Target position: exact center of avatar circle inside the pill button.
    // Re-measured every frame, since the pill is usually still running its
    // slide-in animation (translateY + scale) when the flight starts.
    const getFinal = () => {
      const endRect = destEl.getBoundingClientRect();
      const targetCenterX = endRect.left + (endRect.width < 80 ? endRect.width / 2 : 30);
      const targetCenterY = endRect.top + endRect.height / 2;
      return { x: targetCenterX - startWidth / 2, y: targetCenterY - startHeight / 2 };
    };

    const P1 = { x: startX, y: startY };

    const bezier = (t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
      const cX = 3 * (p1.x - p0.x);
      const bX = 3 * (p2.x - p1.x) - cX;
      const aX = p3.x - p0.x - cX - bX;

      const cY = 3 * (p1.y - p0.y);
      const bY = 3 * (p2.y - p1.y) - cY;
      const aY = p3.y - p0.y - cY - bY;

      const x = aX * Math.pow(t, 3) + bX * Math.pow(t, 2) + cX * t + p0.x;
      const y = aY * Math.pow(t, 3) + bY * Math.pow(t, 2) + cY * t + p0.y;

      return { x, y };
    };

    const duration = 750;
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const P4 = getFinal();
      const P2 = { x: startX + (P4.x - startX) * 0.35, y: Math.min(startY, P4.y) - 90 };
      const P3 = { x: startX + (P4.x - startX) * 0.75, y: P4.y - 40 };
      const curpos = bezier(progress, P1, P2, P3, P4);

      let scale = 1;
      let opacity = 1;
      let borderRadius = '16px';

      if (progress < 0.75) {
        scale = 1 - (progress / 0.75) * 0.55;
        opacity = 1;
        borderRadius = `${16 + (progress / 0.75) * 34}%`;
      } else {
        const endProgress = (progress - 0.75) / 0.25;
        scale = 0.45 * Math.pow(1 - endProgress, 2);
        opacity = 1 - Math.pow(endProgress, 1.5);
        borderRadius = '50%';
      }

      flyingContainer.style.transform = `translate(${Math.round(curpos.x)}px, ${Math.round(curpos.y)}px) scale(${Math.max(0.01, scale)})`;
      flyingContainer.style.opacity = Math.max(0, opacity).toString();
      flyingContainer.style.borderRadius = borderRadius;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (document.body.contains(flyingContainer)) {
          document.body.removeChild(flyingContainer);
        }

        // Pulse bounce effect on floating cart pill
        const pillBtn = document.querySelector('.hiyaghar-floating-cart-pill') || destEl;
        pillBtn?.classList.add('quickbeam-cart-bounce');
        setTimeout(() => {
          pillBtn?.classList.remove('quickbeam-cart-bounce');
        }, 500);

        if (onComplete) onComplete();
      }
    }

    requestAnimationFrame(step);
  };

  setTimeout(findDestinationAndAnimate, 30);
}
