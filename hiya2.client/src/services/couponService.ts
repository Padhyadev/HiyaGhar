import { CustomerAuthService } from './customerAuthService';

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 for 10%, 50 for ₹50
  minOrderValue: number;
  description: string;
}

export interface CouponResult {
  success: boolean;
  message: string;
  discountAmount: number;
  code?: string;
  coupon?: Coupon;
}

// The code a shopper applied on the cart, carried over to checkout (where the server validates it
// again against the real cart). Per browser tab; storage can be unavailable, so every access is guarded.
const APPLIED_COUPON_KEY = 'hiya_applied_coupon';

export class CouponService {
  public static getSavedCode(): string | null {
    try {
      return sessionStorage.getItem(APPLIED_COUPON_KEY);
    } catch {
      return null;
    }
  }

  public static saveCode(code: string): void {
    try {
      sessionStorage.setItem(APPLIED_COUPON_KEY, code.trim().toUpperCase());
    } catch {
      // ignore - the shopper can still type the code at checkout
    }
  }

  public static clearSavedCode(): void {
    try {
      sessionStorage.removeItem(APPLIED_COUPON_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Validates a coupon code dynamically against the Admin database coupons via /api/coupon/validate.
   */
  public static async validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      return {
        success: false,
        message: 'Please enter a coupon code.',
        discountAmount: 0,
      };
    }

    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        // Send the real customer token so the server can apply per-customer rules
        // (first-order-only, per-customer limit) exactly as it does at checkout.
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({ code: cleanCode, subtotal }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isValid) {
          return {
            success: true,
            message: data.message || `Coupon ${data.code} applied!`,
            discountAmount: data.discountAmount || 0,
            code: data.code,
            coupon: data.coupon,
          };
        } else {
          return {
            success: false,
            message: data.message || 'This coupon code is invalid or expired.',
            discountAmount: 0,
          };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errData.message || 'This coupon code is invalid or expired.',
          discountAmount: 0,
        };
      }
    } catch (err) {
      console.warn('Coupon validation error:', err);
      return {
        success: false,
        message: 'Unable to validate coupon at this moment. Please check your connection.',
        discountAmount: 0,
      };
    }
  }
}
