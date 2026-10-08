import { AdminAuthService } from './adminAuthService';

export interface LovItem {
  id: number;
  lovColumn: string;
  lovCode: string;
  lovDesc: string;
  displayOrder: number;
  isActive: boolean;
  createdDate?: string;
}

export interface LovCategory {
  id: number;
  lovColumn: string;
  displayText: string;
  isActive: boolean;
}

// Per-column label maps fetched once and reused - LOV rows rarely change,
// and every order card/timeline step would otherwise trigger its own fetch.
const publicLabelCache = new Map<string, Record<string, string>>();

export class LovService {
  // Public, unauthenticated read - used anywhere in the app that needs to
  // resolve a code to its current admin-editable display text (order status
  // labels in the storefront, admin order list, etc.). Falls back to an
  // empty map on failure so callers can fall back to their own defaults.
  public static async getPublicLabels(column: string, forceRefresh = false): Promise<Record<string, string>> {
    if (!forceRefresh && publicLabelCache.has(column)) {
      return publicLabelCache.get(column)!;
    }

    try {
      const res = await fetch(`/api/lov/public?column=${encodeURIComponent(column)}`);
      const data = await res.json();
      if (data?.isSuccess && Array.isArray(data.items)) {
        const map: Record<string, string> = {};
        data.items.forEach((item: { code: string; desc: string }) => {
          map[item.code] = item.desc;
        });
        publicLabelCache.set(column, map);
        return map;
      }
    } catch (err) {
      console.warn(`Failed to load LOV labels for column "${column}":`, err);
    }
    return {};
  }

  // --- Admin CRUD (SUPER_ADMIN only) ---

  public static async getColumns(): Promise<LovCategory[]> {
    try {
      const res = await fetch('/api/lov/columns', { headers: AdminAuthService.getAuthHeaders() });
      if (!res.ok) return [];
      const text = await res.text();
      if (!text) return [];
      const data = JSON.parse(text);
      return data?.isSuccess ? data.categories || [] : [];
    } catch (err) {
      console.warn('Failed to load LOV columns:', err);
      return [];
    }
  }

  public static async updateCategory(id: number, displayText: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/lov/category/${id}`, {
        method: 'PUT',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ displayText }),
      });
      if (!res.ok) return { success: false, message: 'Server returned error status' };
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      return { success: res.ok && data.isSuccess, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  public static async getItems(column?: string): Promise<LovItem[]> {
    try {
      const url = column ? `/api/lov?column=${encodeURIComponent(column)}` : '/api/lov';
      const res = await fetch(url, { headers: AdminAuthService.getAuthHeaders() });
      if (!res.ok) return [];
      const text = await res.text();
      if (!text) return [];
      const data = JSON.parse(text);
      return data?.isSuccess ? data.items || [] : [];
    } catch (err) {
      console.warn('Failed to load LOV items:', err);
      return [];
    }
  }

  public static async createItem(payload: {
    lovColumn: string;
    lovCode: string;
    lovDesc: string;
    displayOrder: number;
    categoryDisplayText?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/lov', {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { success: false, message: 'Failed to create item' };
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data?.isSuccess) publicLabelCache.delete(payload.lovColumn);
      return { success: res.ok && data.isSuccess, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  public static async updateItem(
    id: number,
    column: string,
    payload: { lovDesc: string; displayOrder: number; isActive: boolean }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/lov/${id}`, {
        method: 'PUT',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { success: false, message: 'Failed to update item' };
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data?.isSuccess) publicLabelCache.delete(column);
      return { success: res.ok && data.isSuccess, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  public static async deleteItem(id: number, column: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/lov/${id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (!res.ok) return { success: false, message: 'Failed to delete item' };
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data?.isSuccess) publicLabelCache.delete(column);
      return { success: res.ok && data.isSuccess, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
