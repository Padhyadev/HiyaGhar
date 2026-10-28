import { CustomerAuthService } from './customerAuthService';

/** Offer the cart qualifies for now. Applied automatically - no code to enter. */
export interface AppliedOffer {
  code: string;
  label: string; // e.g. "10% OFF on orders above ₹300"
  discountAmount: number;
  message: string;
}

/** Next offer the shopper can unlock by adding more to the cart. */
export interface NextOffer {
  label: string;
  benefit: string; // e.g. "10% OFF"
  amountNeeded: number;
  minOrderAmount: number;
  discountAmount: number;
}

export interface AutoOfferResult {
  applied: AppliedOffer | null;
  next: NextOffer | null;
}

const NO_OFFER: AutoOfferResult = { applied: null, next: null };

export class CouponService {
  /**
   * Admin-defined offers (Admin → Coupons & Vouchers) for this cart total. The server prices
   * the order again at checkout, so this is only for display.
   */
  public static async getAutoOffer(subtotal: number): Promise<AutoOfferResult> {
    if (subtotal <= 0) return NO_OFFER;
    try {
      // Send the customer token so first-order-only and per-customer limits are applied.
      const res = await fetch(`/api/coupon/auto-offer?subtotal=${encodeURIComponent(subtotal)}`, {
        headers: CustomerAuthService.getAuthHeaders(),
      });
      if (!res.ok) return NO_OFFER;
      const data = await res.json();
      return { applied: data.applied ?? null, next: data.next ?? null };
    } catch (err) {
      console.warn('Offer lookup error:', err);
      return NO_OFFER;
    }
  }
}
