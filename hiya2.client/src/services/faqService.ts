import { AdminAuthService } from './adminAuthService';

export interface FaqItem {
  id: number;
  category: 'general' | 'products' | 'orders' | 'gifting' | string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export class FaqService {
  // Public: Get all active FAQs for storefront
  public static async getPublicFaqs(): Promise<{
    success: boolean;
    data: FaqItem[];
  }> {
    try {
      const res = await fetch('/api/faq', {
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        data: Array.isArray(data?.data) ? data.data : [],
      };
    } catch (err) {
      console.error('Failed to load public FAQs:', err);
      return { success: false, data: [] };
    }
  }

  // Admin: Get all FAQs with filters
  public static async getAdminFaqs(category?: string, search?: string): Promise<{
    success: boolean;
    data: FaqItem[];
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (search) params.append('search', search);

      const res = await fetch(`/api/faq/admin/all?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${AdminAuthService.getToken()}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        data: Array.isArray(data?.data) ? data.data : [],
        total: data?.total || (data?.data?.length || 0),
      };
    } catch (err) {
      console.error('Failed to load admin FAQs:', err);
      return { success: false, data: [], total: 0 };
    }
  }

  // Admin: Create FAQ
  public static async createFaq(payload: {
    category: string;
    question: string;
    answer: string;
    displayOrder: number;
    isActive: boolean;
  }): Promise<{ success: boolean; message: string; data?: FaqItem }> {
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AdminAuthService.getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        message: data?.message || (res.ok ? 'FAQ created successfully' : 'Failed to create FAQ'),
        data: data?.data,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  }

  // Admin: Update FAQ
  public static async updateFaq(
    id: number,
    payload: {
      category: string;
      question: string;
      answer: string;
      displayOrder: number;
      isActive: boolean;
    }
  ): Promise<{ success: boolean; message: string; data?: FaqItem }> {
    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AdminAuthService.getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        message: data?.message || (res.ok ? 'FAQ updated successfully' : 'Failed to update FAQ'),
        data: data?.data,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  }

  // Admin: Toggle status
  public static async toggleStatus(id: number): Promise<{ success: boolean; message: string; isActive?: boolean }> {
    try {
      const res = await fetch(`/api/faq/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AdminAuthService.getToken()}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        message: data?.message || (res.ok ? 'Status toggled' : 'Failed to toggle status'),
        isActive: data?.isActive,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  }

  // Admin: Delete FAQ
  public static async deleteFaq(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AdminAuthService.getToken()}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        message: data?.message || (res.ok ? 'FAQ deleted successfully' : 'Failed to delete FAQ'),
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  }
}
