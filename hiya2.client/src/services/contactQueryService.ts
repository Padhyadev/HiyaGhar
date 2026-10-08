import { AdminAuthService } from './adminAuthService';

export interface ContactQueryItem {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed' | string;
  adminNotes?: string;
  createdDate: string;
  resolvedDate?: string;
}

export interface SubmitQueryResult {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export class ContactQueryService {
  // Public Submit with server response
  public static async submitQuery(payload: {
    fullName: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }): Promise<SubmitQueryResult> {
    try {
      const res = await fetch('/api/contactquery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && data?.isSuccess,
        message: data?.message || (res.ok ? 'Query submitted successfully' : 'Failed to submit query'),
        errors: data?.errors,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error while submitting inquiry.',
      };
    }
  }

  // Admin: Get all queries
  public static async getQueries(status?: string, search?: string): Promise<{
    success: boolean;
    data: ContactQueryItem[];
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'All') params.append('status', status);
      if (search) params.append('search', search);

      const url = `/api/contactquery/admin/all${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: AdminAuthService.getAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.isSuccess) {
        return {
          success: true,
          data: json.data || [],
          total: json.total || 0,
        };
      }
      return { success: false, data: [], total: 0 };
    } catch {
      return { success: false, data: [], total: 0 };
    }
  }

  // Admin: Update Status / Notes
  public static async updateStatus(
    id: number,
    status: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/contactquery/admin/${id}/status`, {
        method: 'PUT',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ status, adminNotes }),
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok && json?.isSuccess,
        message: json?.message || 'Updated status successfully',
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update status' };
    }
  }

  // Admin: Delete
  public static async deleteQuery(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/contactquery/admin/${id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok && json?.isSuccess,
        message: json?.message || 'Deleted query successfully',
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to delete query' };
    }
  }
}
