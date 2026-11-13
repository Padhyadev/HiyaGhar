import { CustomerAuthService } from './customerAuthService';
import { AdminAuthService } from './adminAuthService';

// Gifting API (Hiya2.Server/Controllers/GiftController.cs). Prices shown here are previews only:
// the server works out the gift box and the ₹100-per-box charge again when the order is placed.

export type GiftOption = 'none' | 'normal' | 'personalised';

export interface GiftQuote {
  isSuccess: boolean;
  message?: string | null;
  boxCount: number;
  boxSummary?: string | null;
  boxes: Array<{ boxId: number; name: string; capacity: number; usedUnits: number }>;
  chargePerBox: number;
  personalisedCharge: number;
}

export interface GiftQuoteItem {
  productId: number;
  variantId: number | null;
  quantity: number;
}

/** Sent with the order: the server validates and prices it. */
export interface GiftOrderPayload {
  type: 'None' | 'Normal' | 'Personalised';
  photoToken?: string | null;
  messageJson?: string | null;
  isForSelf: boolean;
  recipientName?: string | null;
  recipientPhone?: string | null;
}

export interface AdminGiftBox {
  id?: number;
  name: string;
  capacity: number;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminOrderGift {
  giftType: string;
  boxCount: number;
  boxSummary: string;
  chargePerBox: number;
  totalCharge: number;
  isForSelf: boolean;
  recipientName?: string | null;
  recipientPhone?: string | null;
  messageJson?: string | null;
  messageText?: string | null;
  hasPhoto: boolean;
  hasOriginalPhoto: boolean;
  needsInsert: boolean;
  hasInsert: boolean;
}

export const PERSONALISATION_CHARGE_PER_BOX = 100;
export const MAX_PHOTO_MB = 10;

const emptyQuote = (message: string): GiftQuote => ({
  isSuccess: false,
  message,
  boxCount: 0,
  boxes: [],
  chargePerBox: PERSONALISATION_CHARGE_PER_BOX,
  personalisedCharge: 0,
});

function customerFormHeaders(): HeadersInit {
  const headers = { ...(CustomerAuthService.getAuthHeaders() as Record<string, string>) };
  delete headers['Content-Type'];
  return headers;
}

/** Saves a downloaded file in the browser. */
function saveBlob(blob: Blob, fileName: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}

export const toGiftTypeValue =(option: GiftOption): GiftOrderPayload['type'] =>
  option === 'personalised' ? 'Personalised' : option === 'normal' ? 'Normal' : 'None';

export class GiftService {
  /** Gift box + charges for products picked in the gift builder. */
  public static async quote(items: GiftQuoteItem[]): Promise<GiftQuote> {
    try {
      const res = await fetch('/api/gift/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => null);
      return data ?? emptyQuote('Could not work out the gift box. Please try again.');
    } catch {
      return emptyQuote('Could not work out the gift box. Please check your connection.');
    }
  }

  /** Gift box + charges for what is being checked out (the server cart, or the Buy Now item). */
  public static async quoteCheckout(buyNowItem?: unknown, buyNowItems?: unknown[]): Promise<GiftQuote> {
    try {
      const res = await fetch('/api/gift/quote/checkout', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({ buyNowItem: buyNowItem ?? null, buyNowItems: buyNowItems ?? null }),
      });
      const data = await res.json().catch(() => null);
      return data ?? emptyQuote('Could not work out the gift box. Please try again.');
    } catch {
      return emptyQuote('Could not work out the gift box. Please check your connection.');
    }
  }

  /** Uploads the original photo and its cropped version; returns the token sent with the order. */
  public static async uploadPhoto(original: File | Blob, cropped: Blob): Promise<{ token?: string; message?: string }> {
    const form = new FormData();
    form.append('original', original, original instanceof File ? original.name : 'original.jpg');
    form.append('cropped', cropped, 'cropped.jpg');
    try {
      const res = await fetch('/api/gift/photo', { method: 'POST', headers: customerFormHeaders(), body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.isSuccess && data.photoToken) return { token: data.photoToken };
      if (res.status === 401) return { message: 'Your session has expired. Please sign in again to upload your photo.' };
      if (res.status === 413) return { message: `The photo is too large. Please choose one under ${MAX_PHOTO_MB} MB.` };
      return { message: data.message || 'Your photo could not be uploaded. Please try again.' };
    } catch {
      return { message: 'Your photo could not be uploaded. Please check your connection.' };
    }
  }

  /** The customer's own A4 gift insert PDF for one of their orders (downloaded with their login). */
  public static async downloadMyInsert(orderNumber: string): Promise<{ success: boolean; message?: string }> {
    const headers = customerFormHeaders();
    if (!(headers as Record<string, string>).Authorization) {
      return { success: false, message: 'Please sign in to download your gift insert.' };
    }
    try {
      const res = await fetch(`/api/gift/my-orders/${encodeURIComponent(orderNumber)}/insert`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) return { success: false, message: 'Please sign in to download your gift insert.' };
        return { success: false, message: data.message || 'Your gift insert is not available.' };
      }
      saveBlob(await res.blob(), `${orderNumber}-gift-insert-A4.pdf`);
      return { success: true };
    } catch {
      return { success: false, message: 'Download failed. Please check your connection.' };
    }
  }

  // --- Admin ---

  public static async getBoxesAdmin(): Promise<AdminGiftBox[] | null> {
    try {
      const res = await fetch('/api/gift/admin/boxes', { headers: AdminAuthService.getAuthHeaders() });
      const data = await res.json();
      return res.ok && data.isSuccess ? data.boxes : null;
    } catch {
      return null;
    }
  }

  public static async saveBoxesAdmin(boxes: AdminGiftBox[]): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/gift/admin/boxes', {
        method: 'PUT',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(boxes),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && !!data.isSuccess, message: data.message || (res.ok ? 'Saved.' : 'Could not save gift boxes.') };
    } catch {
      return { success: false, message: 'Could not save gift boxes. Please check your connection.' };
    }
  }

  public static async getOrderGiftAdmin(orderId: number | string): Promise<AdminOrderGift | null> {
    try {
      const res = await fetch(`/api/gift/admin/orders/${orderId}`, { headers: AdminAuthService.getAuthHeaders() });
      const data = await res.json();
      return res.ok && data.isSuccess ? data.gift : null;
    } catch {
      return null;
    }
  }

  /** Downloads a protected gift file (photo or A4 insert) with the admin token and saves it. */
  public static async downloadOrderFileAdmin(orderId: number | string, file: 'photo' | 'photo-original' | 'insert', regenerate = false): Promise<{ success: boolean; message?: string }> {
    const url =
      file === 'insert'
        ? `/api/gift/admin/orders/${orderId}/insert${regenerate ? '?regenerate=true' : ''}`
        : `/api/gift/admin/orders/${orderId}/photo${file === 'photo-original' ? '?original=true' : ''}`;
    try {
      const res = await fetch(url, { headers: AdminAuthService.getAuthHeadersForFormData() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.message || 'File not available.' };
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      saveBlob(blob, match ? decodeURIComponent(match[1]) : file === 'insert' ? 'gift-insert.pdf' : 'gift-photo');
      return { success: true };
    } catch {
      return { success: false, message: 'Download failed. Please check your connection.' };
    }
  }
}
