export interface DeliveryOption {
  id: 'standard' | 'express';
  name: string;
  estimatedDays: string;
  price: number;
  originalPrice?: number;
  description: string;
}

export interface PincodeResult {
  serviceable: boolean;
  cityState?: string;
  estimatedDays: string;
  message: string;
}

export const SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 500,
  STANDARD_SHIPPING_PRICE: 49,
  EXPRESS_SHIPPING_PRICE: 99,
};

export class ShippingService {
  /**
   * Pincode serviceability check
   */
  public static checkPincode(pincode: string): PincodeResult {
    const cleanPin = pincode.trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      return {
        serviceable: false,
        estimatedDays: '',
        message: 'Please enter a valid 6-digit pincode.',
      };
    }

    // Demo unserviceable pincodes list for realistic API integration simulation
    const unserviceablePincodes = ['000000', '999999', '111111', '123456'];
    if (unserviceablePincodes.includes(cleanPin)) {
      return {
        serviceable: false,
        estimatedDays: '',
        message: 'Sorry, we currently don\'t deliver to this pincode.',
      };
    }

    // Sample pincode region detection
    let region = 'Pan India Delivery';
    if (cleanPin.startsWith('380') || cleanPin.startsWith('390')) region = 'Ahmedabad / Gujarat (Fast Track)';
    else if (cleanPin.startsWith('400') || cleanPin.startsWith('411')) region = 'Mumbai / Pune Region';
    else if (cleanPin.startsWith('110')) region = 'Delhi NCR Region';
    else if (cleanPin.startsWith('560')) region = 'Bengaluru Region';

    return {
      serviceable: true,
      cityState: region,
      estimatedDays: '3–5 business days',
      message: `Delivery available to ${cleanPin} (${region})`,
    };
  }

  /**
   * Available delivery options based on subtotal & applied coupon
   */
  public static getDeliveryOptions(subtotal: number, couponCode?: string): DeliveryOption[] {
    const isFreeShipping = subtotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD || couponCode === 'FREESHIP';
    const standardPrice = isFreeShipping ? 0 : SHIPPING_CONFIG.STANDARD_SHIPPING_PRICE;

    return [
      {
        id: 'standard',
        name: 'Standard Delivery',
        estimatedDays: '3–5 business days',
        price: standardPrice,
        originalPrice: isFreeShipping ? SHIPPING_CONFIG.STANDARD_SHIPPING_PRICE : undefined,
        description: isFreeShipping ? 'FREE Shipping Unlocked 🎉' : 'Safe & reliable transit',
      },
      {
        id: 'express',
        name: 'Express Express Delivery',
        estimatedDays: '1–2 business days',
        price: SHIPPING_CONFIG.EXPRESS_SHIPPING_PRICE,
        description: 'Priority handling & fast-track courier',
      },
    ];
  }
}
