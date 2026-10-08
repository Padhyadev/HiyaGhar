export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
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

export class CouponService {
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
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('customer_token') ? { Authorization: `Bearer ${localStorage.getItem('customer_token')}` } : {})
        },
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
