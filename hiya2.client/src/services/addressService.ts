import { CustomerAuthService } from './customerAuthService';

export interface UserAddress {
  id: string;
  fullName: string;
  mobileNo: string;
  altMobileNo?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  addressType: 'HOME' | 'SHIPPING';
  isDefault: boolean;
}

const ADDRESS_STORAGE_KEY = 'hiya_user_saved_addresses';

export class AddressService {
  private static listeners: Array<() => void> = [];

  public static getAddresses(): UserAddress[] {
    try {
      const data = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  }

  public static getHomeAddress(): UserAddress | null {
    const addresses = this.getAddresses();
    return addresses.find((a) => a.addressType === 'HOME') || null;
  }

  public static getShippingAddresses(): UserAddress[] {
    const addresses = this.getAddresses();
    return addresses.filter((a) => a.addressType === 'SHIPPING');
  }

  public static saveAddresses(addresses: UserAddress[]): void {
    try {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save addresses to localStorage', e);
    }
  }

  public static addAddress(addrPayload: Omit<UserAddress, 'id'>): UserAddress {
    const addresses = this.getAddresses();
    const newId = `addr-${Date.now()}`;

    // If marked default shipping, unmark others
    if (addrPayload.isDefault) {
      addresses.forEach((a) => {
        if (a.addressType === addrPayload.addressType) a.isDefault = false;
      });
    }

    const newAddr: UserAddress = {
      ...addrPayload,
      id: newId,
    };

    addresses.push(newAddr);
    this.saveAddresses(addresses);
    return newAddr;
  }

  public static updateAddress(id: string, updatedPayload: Partial<UserAddress>): void {
    let addresses = this.getAddresses();
    const index = addresses.findIndex((a) => a.id === id);
    if (index > -1) {
      if (updatedPayload.isDefault) {
        const targetType = addresses[index].addressType;
        addresses.forEach((a) => {
          if (a.addressType === targetType) a.isDefault = false;
        });
      }
      addresses[index] = { ...addresses[index], ...updatedPayload };
      this.saveAddresses(addresses);
    }
  }

  public static deleteAddress(id: string): void {
    const addresses = this.getAddresses().filter((a) => a.id !== id);
    this.saveAddresses(addresses);
  }

  public static setDefault(id: string): void {
    const addresses = this.getAddresses();
    const target = addresses.find((a) => a.id === id);
    if (target) {
      addresses.forEach((a) => {
        if (a.addressType === target.addressType) {
          a.id === id ? (a.isDefault = true) : (a.isDefault = false);
        }
      });
      this.saveAddresses(addresses);
    }
  }

  public static async fetchHomeAddressFromApi(customerId?: number): Promise<UserAddress | null> {
    try {
      const url = customerId ? `/api/customeraddress/home?customerId=${customerId}` : '/api/customeraddress/home';
      const res = await fetch(url, { headers: CustomerAuthService.getAuthHeaders() });
      if (res.ok) {
        const a = await res.json();
        if (a && a.id) {
          return {
            id: String(a.id),
            fullName: a.customerName || 'Customer',
            mobileNo: a.mobileNo || '',
            altMobileNo: a.alternativeMobileNo || '',
            addressLine1: a.addressLine1 || '',
            addressLine2: a.addressLine2 || '',
            city: a.city || '',
            state: a.state || '',
            postalCode: a.postalCode || '',
            addressType: 'HOME',
            isDefault: false,
          };
        }
      }
    } catch (err) {
      console.warn('Could not fetch home address from server API:', err);
    }
    return this.getHomeAddress();
  }

  public static async fetchAddressesFromApi(customerId?: number): Promise<UserAddress[]> {
    try {
      const url = customerId ? `/api/customeraddress?customerId=${customerId}` : '/api/customeraddress';
      const res = await fetch(url, { headers: CustomerAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: UserAddress[] = data.map((a: any) => ({
            id: String(a.id),
            fullName: a.customerName || 'Customer',
            mobileNo: a.mobileNo || '',
            altMobileNo: a.alternativeMobileNo || '',
            addressLine1: a.addressLine1 || '',
            addressLine2: a.addressLine2 || '',
            city: a.city || '',
            state: a.state || '',
            postalCode: a.postalCode || '',
            addressType: (a.addressType as 'HOME' | 'SHIPPING') || 'SHIPPING',
            isDefault: !!a.isDefault,
          }));
          this.saveAddresses(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Could not fetch addresses from server API:', err);
    }
    return this.getAddresses();
  }

  public static async saveAddressApi(addr: Partial<UserAddress>, customerId?: number): Promise<boolean> {
    try {
      const payload = {
        id: addr.id && !addr.id.startsWith('addr-') ? Number(addr.id) : 0,
        customerId: customerId || 0,
        customerName: addr.fullName,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: 'India',
        addressType: addr.addressType || 'SHIPPING',
        mobileNo: addr.mobileNo,
        alternativeMobileNo: addr.altMobileNo,
      };

      const res = await fetch('/api/customeraddress', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await this.fetchAddressesFromApi(customerId);
        return true;
      }
    } catch (err) {
      console.warn('Failed to save address to server API:', err);
    }
    return false;
  }

  public static async deleteAddressApi(id: string, customerId?: number): Promise<boolean> {
    try {
      if (!id.startsWith('addr-')) {
        const res = await fetch(`/api/customeraddress/${id}`, {
          method: 'DELETE',
          headers: CustomerAuthService.getAuthHeaders(),
        });
        if (res.ok) {
          await this.fetchAddressesFromApi(customerId);
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed to delete address via API:', err);
    }
    this.deleteAddress(id);
    return true;
  }

  public static async setDefaultApi(id: string, customerId?: number): Promise<boolean> {
    try {
      if (!id.startsWith('addr-')) {
        const url = customerId ? `/api/customeraddress/${id}/set-default?customerId=${customerId}` : `/api/customeraddress/${id}/set-default`;
        const res = await fetch(url, {
          method: 'PUT',
          headers: CustomerAuthService.getAuthHeaders(),
        });
        if (res.ok) {
          await this.fetchAddressesFromApi(customerId);
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed to set default address via API:', err);
    }
    this.setDefault(id);
    return true;
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}
