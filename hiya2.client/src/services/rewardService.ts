import { CustomerAuthService } from './customerAuthService';

export interface RewardSettingsInfo {
  signupCoins: number;
  loginCoins: number;
  referralCoins: number;
  referralJoinCoins: number;
  coinToRupeeRate: number;
  maxCoinUsagePercent: number;
}

export interface RewardLedgerEntry {
  id: number;
  orderId?: number;
  type: string;
  coins: number;
  source?: string;
  remarks?: string;
  balanceAfter: number;
  createdDate: string;
}

export class RewardService {
  public static async getSettings(): Promise<RewardSettingsInfo | null> {
    try {
      const res = await fetch('/api/reward/settings');
      const data = await res.json().catch(() => ({}));
      return res.ok && data.isSuccess ? data.settings : null;
    } catch (e) {
      console.warn('Error loading reward settings:', e);
      return null;
    }
  }

  public static async getMyLedger(): Promise<{ balance: number; transactions: RewardLedgerEntry[] } | null> {
    if (!CustomerAuthService.isLoggedIn()) return null;
    try {
      const res = await fetch('/api/reward/my-ledger', { headers: CustomerAuthService.getAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.isSuccess) return null;
      return { balance: data.balance, transactions: data.transactions || [] };
    } catch (e) {
      console.warn('Error loading reward ledger:', e);
      return null;
    }
  }
}
