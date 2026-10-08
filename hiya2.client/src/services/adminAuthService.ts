export interface AdminRoleInfo {
  roleId: number;
  roleName: string;
  roleCode: string;
}

export interface AdminPermissionItem {
  menuId: number;
  menuKey: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface AdminUserProfile {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  isLoggedIn: boolean;
  token?: string;
  roles?: AdminRoleInfo[];
  permissions?: AdminPermissionItem[];
}

const AUTH_STORAGE_KEY = 'hiya_admin_auth';
const JWT_TOKEN_KEY = 'hiya_admin_jwt_token';
const PERMISSIONS_KEY = 'hiya_admin_permissions';

const DEFAULT_USER: AdminUserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'Male',
  isLoggedIn: false,
};

export class AdminAuthService {
  private static listeners: Array<() => void> = [];

  public static getUser(): AdminUserProfile {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  }

  public static getToken(): string | null {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }

  /** Reads the `exp` claim off a JWT (without verifying the signature) and reports whether it has passed. */
  public static isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payloadPart = token.split('.')[1];
      let base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const payload = JSON.parse(atob(base64));
      if (!payload?.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  public static getPermissions(): Record<string, { menuName?: string; icon?: string; displayOrder?: number; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean }> {
    try {
      const data = localStorage.getItem(PERMISSIONS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse cached permissions', e);
    }
    return {
      DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dashboard', displayOrder: 0, icon: 'fa-solid fa-chart-line' },
      USER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'User', displayOrder: 1, icon: 'fa-solid fa-user' },
      ROLE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Role', displayOrder: 2, icon: 'fa-solid fa-user-shield' },
      PRODUCT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Product', displayOrder: 3, icon: 'fa-solid fa-box' },
      MENU: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Menu', displayOrder: 4, icon: 'fa-solid fa-bars' },
      CUSTOMER: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Customer', displayOrder: 5, icon: 'fa-solid fa-users' },
      CATEGORY: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Category', displayOrder: 6, icon: 'fa-solid fa-tags' },
      ATTRIBUTE: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Attribute', displayOrder: 7, icon: 'fa-solid fa-sliders' },
      HOMEPAGECOMPONENT: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'HomePageComponent', displayOrder: 8, icon: 'fa-solid fa-puzzle-piece' },
    };
  }

  public static setPermissions(permMap: Record<string, any>): void {
    try {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permMap));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save permissions to localStorage', e);
    }
  }

  public static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  public static getAuthHeadersForFormData(): HeadersInit {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    const structurallyValid = !!token && token.split('.').length === 3 && !!user && user.isLoggedIn;
    if (!structurallyValid) return false;

    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  public static async loginApi(email: string, password: string): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem(JWT_TOKEN_KEY, data.token);

          const userProfile: AdminUserProfile = {
            userId: data.user.userId,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            phone: data.user.mobileNo || '9876543210',
            gender: 'Male',
            isLoggedIn: true,
            roles: data.user.roles,
          };

          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
          this.notifyListeners();
          return { success: true, token: data.token };
        }
      }
      const err = await res.json();
      return { success: false, message: err.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  }

  public static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        return { success: true, message: data.message || 'Password changed successfully.' };
      }
      return { success: false, message: data.message || 'Failed to change password.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  }

  public static async checkActiveSessionWithServer(): Promise<boolean> {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    try {
      const res = await fetch('/api/auth/validate-session', {
        headers: this.getAuthHeaders(),
      });

      // Only logout on 401 Unauthorized — this means another device has taken over the session.
      // Do NOT logout on 500, 503, or other server errors — those are transient and should
      // not kick the admin out. Network errors are also handled in the catch block below.
      if (res.status === 401) {
        this.logout();
        return false;
      }

      // Any other non-OK status (500, 503, etc.) is a server issue — keep the admin logged in
      return true;
    } catch {
      // Network error — don't kick user out, they may just have brief connectivity issue
      return true;
    }
  }

  public static logout(): void {
    const token = this.getToken();
    if (token) {
      // Fire-and-forget server invalidate call
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }

    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(JWT_TOKEN_KEY);
      localStorage.removeItem(PERMISSIONS_KEY);
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to clear auth state from localStorage', e);
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
