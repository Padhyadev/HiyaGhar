export interface CustomerProfile {
  customerId: number;
  firstName: string;
  lastName?: string;
  email: string;
  mobileNo: string;
  gender?: string;
  dateOfBirth?: string;
  username?: string;
  isLoggedIn?: boolean;
  referralCode?: string;
  rewardCoins?: number;
  isGuest?: boolean;
}

const CUSTOMER_AUTH_KEY = 'hiya_customer_auth';
const CUSTOMER_TOKEN_KEY = 'hiya_customer_jwt_token';

// Guest checkout session: a short-lived customer token for a password-less guest
// account. Kept in sessionStorage (this tab only) and apart from the login keys,
// so the shopper never appears "logged in" - API calls just carry the token.
const GUEST_AUTH_KEY = 'hiya_guest_checkout_auth';
const GUEST_TOKEN_KEY = 'hiya_guest_checkout_token';

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export class CustomerAuthService {
  private static listeners: Array<() => void> = [];

  public static getCustomer(): CustomerProfile | null {
    try {
      const data = localStorage.getItem(CUSTOMER_AUTH_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse customer auth from localStorage', e);
    }
    return null;
  }

  // The logged-in token if there is one, otherwise the guest checkout token.
  public static getToken(): string | null {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY) || (this.isGuestSession() ? readSession(GUEST_TOKEN_KEY) : null);
  }

  public static isLoggedIn(): boolean {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (!token || !this.getCustomer()) return false;
    if (this.isTokenExpired(token)) {
      this.expireSession();
      return false;
    }
    return true;
  }

  public static getGuestCustomer(): CustomerProfile | null {
    try {
      const data = readSession(GUEST_AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static isGuestSession(): boolean {
    if (localStorage.getItem(CUSTOMER_TOKEN_KEY)) return false;
    const token = readSession(GUEST_TOKEN_KEY);
    if (!token || !this.getGuestCustomer()) return false;
    if (this.isTokenExpired(token)) {
      this.endGuestSession();
      return false;
    }
    return true;
  }

  // True when API calls can act on a server cart: logged in, or mid guest checkout.
  public static hasSession(): boolean {
    return this.isLoggedIn() || this.isGuestSession();
  }

  // The shopper placing the order: the logged-in customer, else the guest.
  public static getCheckoutCustomer(): CustomerProfile | null {
    if (this.isLoggedIn()) return this.getCustomer();
    return this.isGuestSession() ? this.getGuestCustomer() : null;
  }

  public static endGuestSession(): void {
    try {
      sessionStorage.removeItem(GUEST_TOKEN_KEY);
      sessionStorage.removeItem(GUEST_AUTH_KEY);
    } catch {
      // sessionStorage unavailable - nothing to clear.
    }
  }

  // Starts guest checkout. On success the local cart is pushed to the guest's
  // server cart (which reserves stock) and replaced with the server's copy.
  // `accountExists` means the email/mobile is registered and the shopper must log in.
  public static async startGuestCheckout(payload: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNo: string;
  }): Promise<{ success: boolean; message?: string; accountExists?: boolean; customer?: CustomerProfile }> {
    try {
      const res = await fetch('/api/customerauth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        return { success: false, message: 'Too many attempts. Please wait a few minutes and try again.' };
      }
      const data: any = await res.json().catch(() => ({}));

      if (res.ok && data.isSuccess && data.token) {
        const profile: CustomerProfile = { ...data.customer, isGuest: true };
        sessionStorage.setItem(GUEST_TOKEN_KEY, data.token);
        sessionStorage.setItem(GUEST_AUTH_KEY, JSON.stringify(profile));
        const { CartService } = await import('../cart');
        await CartService.syncWithServerAfterLogin();
        return { success: true, customer: profile };
      }
      return {
        success: false,
        accountExists: data.code === 'ACCOUNT_EXISTS',
        message: data.message || `Server error (${res.status}). Please try again.`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error. Please try again.' };
    }
  }

  // Reads the JWT `exp` claim (seconds since epoch). Unparseable tokens are
  // left for the server to judge rather than silently logging the user out.
  private static isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) return false;
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof json.exp === 'number' && json.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }

  // Drops the auth token/profile when the server no longer accepts it, but
  // (unlike logout) keeps the local cart and wishlist so they become the guest
  // cart and merge back on the next login.
  public static expireSession(): void {
    this.endGuestSession();
    if (!localStorage.getItem(CUSTOMER_TOKEN_KEY) && !localStorage.getItem(CUSTOMER_AUTH_KEY)) return;
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_AUTH_KEY);
    queueMicrotask(() => this.notifyListeners());
  }

  public static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  public static async loginApi(email: string, password: string): Promise<{ success: boolean; token?: string; message?: string; customer?: CustomerProfile }> {
    try {
      const res = await fetch('/api/customerauth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok && data.isSuccess && data.token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
        this.endGuestSession();
        const profile: CustomerProfile = {
          ...data.customer,
          isLoggedIn: true,
        };
        localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(profile));
        this.notifyListeners();
        import('../cart').then(({ CartService }) => CartService.syncWithServerAfterLogin());
        import('./wishlistService').then(({ WishlistService }) => WishlistService.syncWithServerAfterLogin());
        return { success: true, token: data.token, customer: profile };
      }
      return { success: false, message: data.message || `Server error (${res.status}). Please ensure backend API is running.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during login' };
    }
  }

  public static async registerApi(payload: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNo: string;
    password: string;
    username?: string;
    referralCode?: string;
  }): Promise<{ success: boolean; token?: string; message?: string; customer?: CustomerProfile }> {
    try {
      const res = await fetch('/api/customerauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok && data.isSuccess && data.token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
        this.endGuestSession();
        const profile: CustomerProfile = {
          ...data.customer,
          isLoggedIn: true,
        };
        localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(profile));
        this.notifyListeners();
        import('../cart').then(({ CartService }) => CartService.syncWithServerAfterLogin());
        import('./wishlistService').then(({ WishlistService }) => WishlistService.syncWithServerAfterLogin());
        return { success: true, token: data.token, customer: profile, message: data.message };
      }
      return { success: false, message: data.message || `Registration API returned ${res.status}. Please restart backend server.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during signup' };
    }
  }

  public static async generateForgotPasswordOtp(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/customerauth/forgot-password/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.isSuccess, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error while requesting OTP.' };
    }
  }

  public static async verifyForgotPasswordOtp(email: string, otp: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/customerauth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.isSuccess, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error while verifying OTP.' };
    }
  }

  public static async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/customerauth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data.isSuccess, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error while resetting password.' };
    }
  }

  public static logout(): void {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_AUTH_KEY);
    localStorage.removeItem('hiya_customer_orders');
    localStorage.removeItem('hiya_wishlist_items');
    localStorage.removeItem('hiya_shopping_cart');
    localStorage.removeItem('hiya_user_saved_addresses');
    this.endGuestSession();
    this.notifyListeners();
  }

  public static updateLocalProfile(data: Partial<CustomerProfile>): CustomerProfile | null {
    const current = this.getCustomer();
    if (!current) return null;
    const updated: CustomerProfile = { ...current, ...data };
    localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(updated));
    this.notifyListeners();
    return updated;
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
