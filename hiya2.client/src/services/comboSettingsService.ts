export interface ComboPackConfig {
  id: string;
  name: string;
  itemCount: number;
  discountPercentage: number;
  tagline: string;
  badge?: string;
  isActive: boolean;
}

const COMBO_SETTINGS_KEY = 'hiyaghar_combo_packs_settings';

export const DEFAULT_COMBO_PACKS: ComboPackConfig[] = [
  {
    id: 'starter-3',
    name: 'Starter Trio Box',
    itemCount: 3,
    discountPercentage: 10,
    tagline: 'Pick 3 items & save 10%',
    badge: 'Most Popular',
    isActive: true,
  },
  {
    id: 'value-4',
    name: 'Value Quad Box',
    itemCount: 4,
    discountPercentage: 15,
    tagline: 'Pick 4 items & save 15%',
    badge: 'Best Value',
    isActive: true,
  },
  {
    id: 'family-6',
    name: 'Ultimate Family Pack',
    itemCount: 6,
    discountPercentage: 20,
    tagline: 'Pick 6 items & save 20%',
    badge: 'Super Savings',
    isActive: true,
  },
];

export class ComboSettingsService {
  public static getPacks(): ComboPackConfig[] {
    if (typeof window === 'undefined') return DEFAULT_COMBO_PACKS;
    try {
      const stored = localStorage.getItem(COMBO_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_COMBO_PACKS;
  }

  public static getActivePacks(): ComboPackConfig[] {
    return this.getPacks().filter((p) => p.isActive);
  }

  public static savePacks(packs: ComboPackConfig[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(COMBO_SETTINGS_KEY, JSON.stringify(packs));
    } catch (e) {
      console.error('Failed to save combo pack settings:', e);
    }
  }
}
