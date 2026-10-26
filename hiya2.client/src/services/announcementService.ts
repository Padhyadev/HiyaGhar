export interface AnnouncementItem {
  id: string;
  text: string;
  isActive: boolean;
  displayOrder: number;
}

const STORAGE_KEY = 'hiyaghar_announcement_items';

export const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann_1',
    text: 'FREE SHIPPING ON ALL ORDERS OVER ₹500',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'ann_2',
    text: 'FLAT 10% OFF ON ORDERS ABOVE ₹300 • CODE: WELCOME10',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'ann_3',
    text: 'OFFICE & STORE: 303, APM MALL COMPLEX, GHATLODIYA, AHMEDABAD',
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'ann_4',
    text: '100% NATURAL & HOMEMADE WITH LOVE',
    isActive: true,
    displayOrder: 4,
  },
];

export class AnnouncementService {
  /**
   * Get all announcements (localStorage or fallback to defaults)
   */
  public static getAnnouncements(): AnnouncementItem[] {
    if (typeof window === 'undefined') return DEFAULT_ANNOUNCEMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        let parsed: AnnouncementItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let modified = false;

          // Auto-migrate any existing announcements from ₹500 to ₹300 for WELCOME10
          parsed = parsed.map((item) => {
            if (item.text.includes('ORDERS ABOVE ₹500 • CODE: WELCOME10')) {
              modified = true;
              return { ...item, text: item.text.replace('ORDERS ABOVE ₹500', 'ORDERS ABOVE ₹300') };
            }
            return item;
          });

          // Ensure office announcement is present if not already added
          const hasOffice = parsed.some((item) => item.text.toLowerCase().includes('office') || item.text.toLowerCase().includes('apm mall'));
          if (!hasOffice) {
            modified = true;
            parsed.push({
              id: 'ann_office',
              text: 'OFFICE & STORE: 303, APM MALL COMPLEX, GHATLODIYA, AHMEDABAD',
              isActive: true,
              displayOrder: (parsed.length + 1),
            });
          }

          if (modified) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }

          return parsed.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_ANNOUNCEMENTS;
  }

  /**
   * Get only active announcement texts for ticker marquee
   */
  public static getActiveAnnouncementTexts(dynamicFreeShippingThreshold?: number): string[] {
    const list = this.getAnnouncements().filter((a) => a.isActive);
    if (list.length === 0) return DEFAULT_ANNOUNCEMENTS.map((a) => a.text);

    return list.map((a) => {
      let t = a.text;
      if (dynamicFreeShippingThreshold && t.includes('FREE SHIPPING ON ALL ORDERS OVER')) {
        return `FREE SHIPPING ON ALL ORDERS OVER ₹${dynamicFreeShippingThreshold}`;
      }
      return t;
    });
  }

  /**
   * Save announcements
   */
  public static saveAnnouncements(items: AnnouncementItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('announcementsUpdated', { detail: items }));
    } catch (e) {
      console.error('Failed to save announcement items:', e);
    }
  }

  /**
   * Reset to default announcements
   */
  public static resetToDefault(): AnnouncementItem[] {
    this.saveAnnouncements(DEFAULT_ANNOUNCEMENTS);
    return DEFAULT_ANNOUNCEMENTS;
  }
}
