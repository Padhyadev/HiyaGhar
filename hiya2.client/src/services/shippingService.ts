export interface ShippingSettings {
  freeShippingThreshold: number;
  standardShippingPrice: number;
  expressShippingPrice: number;
  enableExpressDelivery: boolean;
  enableFreeShipping: boolean;
  onlyAhmedabadDelivery: boolean;
  standardDeliveryDays: string;
  expressDeliveryDays: string;
  // Tax / GST Settings
  enableGstDisplay: boolean;
  gstPercent: number;
  gstLabel: string;
  // Footer & Store Trust Details (Admin Manageable)
  fssaiLicenseNumber: string;
  enableFssaiDisplay: boolean;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

const STORAGE_KEY = 'hiyaghar_shipping_settings';

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  freeShippingThreshold: 500,
  standardShippingPrice: 49,
  expressShippingPrice: 99,
  enableExpressDelivery: true,
  enableFreeShipping: true,
  onlyAhmedabadDelivery: true,
  standardDeliveryDays: '3–5 business days',
  expressDeliveryDays: '1–2 business days',
  enableGstDisplay: true,
  gstPercent: 5,
  gstLabel: 'Estimated GST (5% Included)',
  fssaiLicenseNumber: '10723026001148',
  enableFssaiDisplay: true,
  contactEmail: 'support@hiyaghar.com',
  contactPhone: '+91 92744 43617',
  contactAddress: 'Ahmedabad, Gujarat, India',
};

export const SHIPPING_CONFIG = {
  get FREE_SHIPPING_THRESHOLD() {
    return ShippingService.getSettings().freeShippingThreshold;
  },
  get STANDARD_SHIPPING_PRICE() {
    return ShippingService.getSettings().standardShippingPrice;
  },
  get EXPRESS_SHIPPING_PRICE() {
    return ShippingService.getSettings().expressShippingPrice;
  },
  get ENABLE_GST_DISPLAY() {
    return ShippingService.getSettings().enableGstDisplay;
  },
  get GST_PERCENT() {
    return ShippingService.getSettings().gstPercent;
  },
  get GST_LABEL() {
    return ShippingService.getSettings().gstLabel;
  },
  get FSSAI_LICENSE_NUMBER() {
    return ShippingService.getSettings().fssaiLicenseNumber;
  },
  get ENABLE_FSSAI_DISPLAY() {
    return ShippingService.getSettings().enableFssaiDisplay;
  },
  get CONTACT_EMAIL() {
    return ShippingService.getSettings().contactEmail;
  },
  get CONTACT_PHONE() {
    return ShippingService.getSettings().contactPhone;
  },
  get CONTACT_ADDRESS() {
    return ShippingService.getSettings().contactAddress;
  },
};

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

export interface PincodeLookupResult {
  city: string;
  state: string;
  district?: string;
  found: boolean;
}

export class ShippingService {
  /**
   * Get Shipping settings (from localStorage or default)
   */
  public static getSettings(): ShippingSettings {
    if (typeof window === 'undefined') return DEFAULT_SHIPPING_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SHIPPING_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SHIPPING_SETTINGS;
  }

  /**
   * Save Shipping settings to localStorage (used for instant local sync)
   */
  public static saveSettings(settings: ShippingSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save shipping settings:', e);
    }
  }

  /**
   * Load shipping settings from the DB API and sync to localStorage.
   * Call this on app/page mount so all users get the latest admin settings.
   */
  public static async loadSettingsFromApi(): Promise<ShippingSettings> {
    try {
      const res = await fetch('/api/shippingsetting');
      const data = await res.json();
      if (data?.isSuccess && data.settings) {
        const apiSettings: ShippingSettings = {
          freeShippingThreshold: data.settings.freeShippingThreshold ?? DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold,
          standardShippingPrice: data.settings.standardShippingPrice ?? DEFAULT_SHIPPING_SETTINGS.standardShippingPrice,
          expressShippingPrice: data.settings.expressShippingPrice ?? DEFAULT_SHIPPING_SETTINGS.expressShippingPrice,
          enableExpressDelivery: data.settings.enableExpressDelivery ?? DEFAULT_SHIPPING_SETTINGS.enableExpressDelivery,
          enableFreeShipping: data.settings.enableFreeShipping ?? DEFAULT_SHIPPING_SETTINGS.enableFreeShipping,
          onlyAhmedabadDelivery: data.settings.onlyAhmedabadDelivery ?? DEFAULT_SHIPPING_SETTINGS.onlyAhmedabadDelivery,
          standardDeliveryDays: data.settings.standardDeliveryDays ?? DEFAULT_SHIPPING_SETTINGS.standardDeliveryDays,
          expressDeliveryDays: data.settings.expressDeliveryDays ?? DEFAULT_SHIPPING_SETTINGS.expressDeliveryDays,
          enableGstDisplay: data.settings.enableGstDisplay ?? DEFAULT_SHIPPING_SETTINGS.enableGstDisplay,
          gstPercent: data.settings.gstPercent ?? DEFAULT_SHIPPING_SETTINGS.gstPercent,
          gstLabel: data.settings.gstLabel ?? DEFAULT_SHIPPING_SETTINGS.gstLabel,
          fssaiLicenseNumber: data.settings.fssaiLicenseNumber ?? DEFAULT_SHIPPING_SETTINGS.fssaiLicenseNumber,
          enableFssaiDisplay: data.settings.enableFssaiDisplay ?? DEFAULT_SHIPPING_SETTINGS.enableFssaiDisplay,
          contactEmail: data.settings.contactEmail ?? DEFAULT_SHIPPING_SETTINGS.contactEmail,
          contactPhone: data.settings.contactPhone ?? DEFAULT_SHIPPING_SETTINGS.contactPhone,
          contactAddress: data.settings.contactAddress ?? DEFAULT_SHIPPING_SETTINGS.contactAddress,
        };
        // Sync DB value to localStorage so offline reads are up to date
        ShippingService.saveSettings(apiSettings);
        return apiSettings;
      }
    } catch {
      // Network error — fall back to localStorage cache
    }
    return ShippingService.getSettings();
  }

  /**
   * Save shipping settings to DB via API (admin only).
   * Also syncs localStorage immediately for same-tab reactivity.
   */
  public static async saveSettingsToApi(settings: ShippingSettings, authHeaders: HeadersInit): Promise<boolean> {
    try {
      const res = await fetch('/api/shippingsetting', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof authHeaders === 'object' ? authHeaders : {}),
        },
        body: JSON.stringify({
          freeShippingThreshold: settings.freeShippingThreshold,
          standardShippingPrice: settings.standardShippingPrice,
          expressShippingPrice: settings.expressShippingPrice,
          enableExpressDelivery: settings.enableExpressDelivery,
          enableFreeShipping: settings.enableFreeShipping,
          onlyAhmedabadDelivery: settings.onlyAhmedabadDelivery,
          standardDeliveryDays: settings.standardDeliveryDays,
          expressDeliveryDays: settings.expressDeliveryDays,
          enableGstDisplay: settings.enableGstDisplay,
          gstPercent: settings.gstPercent,
          gstLabel: settings.gstLabel,
          fssaiLicenseNumber: settings.fssaiLicenseNumber,
          enableFssaiDisplay: settings.enableFssaiDisplay,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          contactAddress: settings.contactAddress,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.isSuccess) {
        // Also update localStorage for instant same-tab reactivity
        ShippingService.saveSettings(settings);
        return true;
      }
    } catch (e) {
      console.error('Failed to save shipping settings to API:', e);
    }
    // Still sync localStorage so changes persist across views
    ShippingService.saveSettings(settings);
    return false;
  }

  /**
   * Comprehensive Offline Map of Indian Pincode prefixes to City & State
   */
  public static getCityStateFromPincodeOffline(pincode: string): { city: string; state: string } | null {
    const pin = pincode.trim();
    if (pin.length < 3) return null;

    // Gujarat
    if (pin.startsWith('380') || pin.startsWith('382')) return { city: 'Ahmedabad', state: 'Gujarat' };
    if (pin.startsWith('395') || pin.startsWith('394')) return { city: 'Surat', state: 'Gujarat' };
    if (pin.startsWith('390') || pin.startsWith('391')) return { city: 'Vadodara', state: 'Gujarat' };
    if (pin.startsWith('360')) return { city: 'Rajkot', state: 'Gujarat' };
    if (pin.startsWith('361')) return { city: 'Jamnagar', state: 'Gujarat' };
    if (pin.startsWith('364')) return { city: 'Bhavnagar', state: 'Gujarat' };
    if (pin.startsWith('362')) return { city: 'Junagadh', state: 'Gujarat' };
    if (pin.startsWith('388')) return { city: 'Anand', state: 'Gujarat' };
    if (pin.startsWith('387')) return { city: 'Nadiad', state: 'Gujarat' };
    if (pin.startsWith('384')) return { city: 'Mehsana', state: 'Gujarat' };
    if (pin.startsWith('385')) return { city: 'Palanpur', state: 'Gujarat' };
    if (pin.startsWith('383')) return { city: 'Himmatnagar', state: 'Gujarat' };
    if (pin.startsWith('370')) return { city: 'Bhuj / Kutch', state: 'Gujarat' };
    if (pin.startsWith('396')) return { city: 'Valsad / Vapi', state: 'Gujarat' };
    if (pin.startsWith('392') || pin.startsWith('393')) return { city: 'Bharuch / Ankleshwar', state: 'Gujarat' };
    if (pin.startsWith('38') || pin.startsWith('39') || pin.startsWith('36') || pin.startsWith('37')) return { city: 'Gujarat Area', state: 'Gujarat' };

    // Maharashtra & Mumbai
    if (pin.startsWith('400')) return { city: 'Mumbai', state: 'Maharashtra' };
    if (pin.startsWith('401')) return { city: 'Thane / Palghar', state: 'Maharashtra' };
    if (pin.startsWith('410') || pin.startsWith('411') || pin.startsWith('412')) return { city: 'Pune', state: 'Maharashtra' };
    if (pin.startsWith('422')) return { city: 'Nashik', state: 'Maharashtra' };
    if (pin.startsWith('440')) return { city: 'Nagpur', state: 'Maharashtra' };
    if (pin.startsWith('431')) return { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' };
    if (pin.startsWith('416')) return { city: 'Kolhapur', state: 'Maharashtra' };
    if (pin.startsWith('4')) return { city: 'Maharashtra Region', state: 'Maharashtra' };

    // Delhi NCR
    if (pin.startsWith('110')) return { city: 'New Delhi', state: 'Delhi' };
    if (pin.startsWith('121')) return { city: 'Faridabad', state: 'Haryana' };
    if (pin.startsWith('122')) return { city: 'Gurugram', state: 'Haryana' };
    if (pin.startsWith('201')) return { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh' };

    // Karnataka
    if (pin.startsWith('560')) return { city: 'Bengaluru', state: 'Karnataka' };
    if (pin.startsWith('570')) return { city: 'Mysuru', state: 'Karnataka' };

    // Telangana / AP
    if (pin.startsWith('500')) return { city: 'Hyderabad', state: 'Telangana' };
    if (pin.startsWith('530')) return { city: 'Visakhapatnam', state: 'Andhra Pradesh' };

    // Tamil Nadu
    if (pin.startsWith('600')) return { city: 'Chennai', state: 'Tamil Nadu' };
    if (pin.startsWith('641')) return { city: 'Coimbatore', state: 'Tamil Nadu' };

    // West Bengal
    if (pin.startsWith('700')) return { city: 'Kolkata', state: 'West Bengal' };

    // Rajasthan
    if (pin.startsWith('302')) return { city: 'Jaipur', state: 'Rajasthan' };
    if (pin.startsWith('342')) return { city: 'Jodhpur', state: 'Rajasthan' };
    if (pin.startsWith('313')) return { city: 'Udaipur', state: 'Rajasthan' };

    // Madhya Pradesh
    if (pin.startsWith('452')) return { city: 'Indore', state: 'Madhya Pradesh' };
    if (pin.startsWith('462')) return { city: 'Bhopal', state: 'Madhya Pradesh' };

    return null;
  }

  /**
   * Asynchronously look up City & State from Indian Postal API with strict offline fallback
   */
  public static async lookupPincode(pincode: string): Promise<PincodeLookupResult> {
    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return { city: '', state: '', found: false };
    }

    // Reject known test/fake pincodes
    const fakePincodes = ['000000', '111111', '123456', '999999', '123123'];
    if (fakePincodes.includes(cleanPin)) {
      return { city: '', state: '', found: false };
    }

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
      const data = await response.json();

      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        return {
          city: po.District || po.Block || po.Name || '',
          state: po.State || '',
          district: po.District,
          found: true,
        };
      }
    } catch {
      // Fallback to offline map if network/API is slow or blocked
    }

    const offlineMatch = this.getCityStateFromPincodeOffline(cleanPin);
    if (offlineMatch) {
      return {
        city: offlineMatch.city,
        state: offlineMatch.state,
        found: true,
      };
    }

    return { city: '', state: '', found: false };
  }

  /**
   * Check if a pincode belongs to Ahmedabad / Gandhinagar Delivery Zone (380xxx, 382xxx)
   */
  public static isAhmedabadPincode(pincode: string): boolean {
    const settings = this.getSettings();
    if (!settings.onlyAhmedabadDelivery) return true;
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) return false;
    return pin.startsWith('380') || pin.startsWith('382');
  }

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

    const settings = this.getSettings();

    if (settings.onlyAhmedabadDelivery && !this.isAhmedabadPincode(cleanPin)) {
      return {
        serviceable: false,
        estimatedDays: '',
        message: 'Order place only in Ahmedabad. We currently deliver only to Ahmedabad addresses.',
      };
    }

    const offlineMatch = this.getCityStateFromPincodeOffline(cleanPin);
    const region = offlineMatch ? `${offlineMatch.city}, ${offlineMatch.state}` : 'Ahmedabad, Gujarat';

    return {
      serviceable: true,
      cityState: region,
      estimatedDays: settings.standardDeliveryDays || '1–2 business days',
      message: `Delivery available in Ahmedabad (${cleanPin})`,
    };
  }

  /**
   * Available delivery options based on subtotal & applied coupon
   */
  public static getDeliveryOptions(subtotal: number, couponCode?: string): DeliveryOption[] {
    const settings = this.getSettings();
    const isFreeShipping = (settings.enableFreeShipping && subtotal >= settings.freeShippingThreshold) || couponCode === 'FREESHIP';
    const standardPrice = isFreeShipping ? 0 : settings.standardShippingPrice;

    const options: DeliveryOption[] = [
      {
        id: 'standard',
        name: 'Standard Delivery',
        estimatedDays: settings.standardDeliveryDays || '3–5 business days',
        price: standardPrice,
        originalPrice: isFreeShipping ? settings.standardShippingPrice : undefined,
        description: isFreeShipping ? 'FREE Shipping Unlocked' : 'Safe & reliable transit',
      },
    ];

    if (settings.enableExpressDelivery) {
      options.push({
        id: 'express',
        name: 'Express Delivery',
        estimatedDays: settings.expressDeliveryDays || '1–2 business days',
        price: settings.expressShippingPrice,
        description: 'Priority handling & fast-track courier',
      });
    }

    return options;
  }
}
