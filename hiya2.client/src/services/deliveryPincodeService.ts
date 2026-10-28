import { AdminAuthService } from './adminAuthService';

export interface DeliveryPincodeItem {
  id: number;
  pincode: string;
  areaName: string;
  isAllowed: boolean;
  lastModifiedDate?: string | null;
}

// Admin side of Delivery Pincodes. The list is fixed (all Ahmedabad pincodes); admins can only
// allow / not allow a pincode.
export class DeliveryPincodeService {
  public static async getAll(): Promise<{ success: boolean; data: DeliveryPincodeItem[] }> {
    try {
      const res = await fetch('/api/deliverypincode', {
        headers: {
          'Authorization': `Bearer ${AdminAuthService.getToken()}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        data: Array.isArray(data?.pincodes) ? data.pincodes : [],
      };
    } catch (err) {
      console.error('Failed to load delivery pincodes:', err);
      return { success: false, data: [] };
    }
  }

  public static async setAllowed(id: number, isAllowed: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/deliverypincode/${id}/allowed`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AdminAuthService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAllowed }),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && (data?.isSuccess ?? true),
        message: data?.message || (res.ok ? 'Pincode updated' : 'Failed to update pincode'),
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  }
}
