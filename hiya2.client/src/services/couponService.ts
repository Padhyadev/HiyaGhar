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

const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'HIYA10',
    type: 'percentage',
    value: 10,
    minOrderValue: 200,
    description: '10% OFF on orders over ₹200',
  },
  {
    code: 'WELCOME50',
    type: 'fixed',
    value: 50,
    minOrderValue: 299,
    description: 'Flat ₹50 OFF on orders over ₹299',
  },
  {
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    minOrderValue: 0,
    description: 'Free Delivery on your order',
  },
  {
    code: 'MUKHWAS20',
    type: 'percentage',
    value: 20,
    minOrderValue: 500,
    description: '20% OFF on premium Mukhwas orders over ₹500',
  },
];

export class CouponService {
  public static getAvailableCoupons(): Coupon[] {
    return AVAILABLE_COUPONS;
  }

  public static validateCoupon(code: string, subtotal: number): CouponResult {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      return {
        success: false,
        message: 'Please enter a coupon code.',
        discountAmount: 0,
      };
    }

    const coupon = AVAILABLE_COUPONS.find((c) => c.code === cleanCode);

    if (!coupon) {
      return {
        success: false,
        message: 'This coupon code is invalid or expired.',
        discountAmount: 0,
      };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        success: false,
        message: `Add ₹${coupon.minOrderValue - subtotal} more to apply code ${coupon.code}. (Min. order ₹${coupon.minOrderValue})`,
        discountAmount: 0,
      };
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.value) / 100);
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'free_shipping') {
      discountAmount = 0; // Handled in shipping fee calculation
    }

    return {
      success: true,
      message: `Coupon applied — ₹${discountAmount > 0 ? discountAmount : coupon.description} saved!`,
      discountAmount,
      code: coupon.code,
      coupon,
    };
  }
}
