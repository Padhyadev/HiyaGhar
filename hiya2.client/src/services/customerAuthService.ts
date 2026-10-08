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
}

const CUSTOMER_AUTH_KEY = 'hiya_customer_auth';
const CUSTOMER_TOKEN_KEY = 'hiya_customer_jwt_token';

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

  public static getToken(): string | null {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  }

  public static isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCustomer();
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
