import { AdminAuthService } from './adminAuthService';
import { showToast } from '../utils/alertService';

export interface AnnouncementItem {
  id: string;
  text: string;
  isActive: boolean;
  displayOrder: number;
}

// The header ticker lines are stored on the server as the Home Page Component with this key
// (one item per line: Title = text), so every visitor sees what the admin saved.
// localStorage only keeps the last copy for an instant first paint; loadFromApi() replaces it.
const COMPONENT_KEY = 'Announcements';
const STORAGE_KEY = 'hiyaghar_announcement_items';
const SAVE_DELAY_MS = 800;

export const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann_1',
    text: 'FREE SHIPPING ON ALL ORDERS OVER ₹500',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'ann_2',
    text: 'FLAT 10% OFF ON ORDERS ABOVE ₹300 • NO CODE NEEDED',
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

interface ApiComponentItem {
  id: number;
  title?: string;
  displayOrder?: number;
  isActive: boolean;
}

interface ApiComponent {
  id: number;
  key: string;
  name: string;
  type: string;
  displayOrder: number;
  isActive: boolean;
  items: ApiComponentItem[];
}

const sortByOrder = (items: AnnouncementItem[]) => [...items].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

export class AnnouncementService {
  private static componentId: number | null = null;
  private static saveTimer: number | undefined;
  private static savePending = false;

  /** Last known announcements (local copy of the server list), else the defaults. */
  public static getAnnouncements(): AnnouncementItem[] {
    if (typeof window === 'undefined') return DEFAULT_ANNOUNCEMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AnnouncementItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return sortByOrder(parsed);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_ANNOUNCEMENTS;
  }

  /**
   * Loads the saved announcements from the server and refreshes the local copy (header updates
   * through the 'announcementsUpdated' event). Nothing saved on the server yet = the defaults,
   * which also clears any old copy left in this browser by earlier versions of the site.
   * `migrateLocal` (admin page only): when the server has none yet, upload this browser's list
   * instead - before this change the admin's edits were only kept in the admin's browser.
   */
  public static async loadFromApi(options: { migrateLocal?: boolean } = {}): Promise<AnnouncementItem[]> {
    try {
      const res = await fetch('/api/homepagecomponent');
      if (!res.ok) return this.getAnnouncements();
      const all: ApiComponent[] = await res.json();
      const comp = Array.isArray(all) ? all.find((c) => c.key?.toLowerCase() === COMPONENT_KEY.toLowerCase()) : undefined;
      this.componentId = comp ? comp.id : null;

      if (!comp && options.migrateLocal) {
        const local = this.getAnnouncements();
        this.saveAnnouncements(local);
        return local;
      }

      const items: AnnouncementItem[] = comp && comp.items.length > 0
        ? sortByOrder(comp.items
            .filter((it) => (it.title || '').trim().length > 0)
            .map((it, idx) => ({
              id: String(it.id),
              text: (it.title || '').trim(),
              isActive: it.isActive !== false,
              displayOrder: it.displayOrder ?? idx + 1,
            })))
        : DEFAULT_ANNOUNCEMENTS;

      this.writeLocal(items);
      return items;
    } catch (err) {
      console.warn('Failed to load announcements:', err);
      return this.getAnnouncements();
    }
  }

  /**
   * Get only active announcement texts for ticker marquee
   */
  public static getActiveAnnouncementTexts(dynamicFreeShippingThreshold?: number): string[] {
    const list = this.getAnnouncements().filter((a) => a.isActive);
    if (list.length === 0) return DEFAULT_ANNOUNCEMENTS.map((a) => a.text);

    return list.map((a) => {
      const t = a.text;
      if (dynamicFreeShippingThreshold && t.includes('FREE SHIPPING ON ALL ORDERS OVER')) {
        return `FREE SHIPPING ON ALL ORDERS OVER ₹${dynamicFreeShippingThreshold}`;
      }
      return t;
    });
  }

  /**
   * Save announcements (admin): updates this browser at once, then saves to the server after a
   * short pause, so typing in a line sends one request rather than one per key.
   */
  public static saveAnnouncements(items: AnnouncementItem[]): void {
    if (typeof window === 'undefined') return;
    this.writeLocal(items);
    window.clearTimeout(this.saveTimer);
    this.savePending = true;
    this.saveTimer = window.setTimeout(() => {
      this.savePending = false;
      void this.saveToApi(items);
    }, SAVE_DELAY_MS);
  }

  /**
   * Reset to default announcements
   */
  public static resetToDefault(): AnnouncementItem[] {
    this.saveAnnouncements(DEFAULT_ANNOUNCEMENTS);
    return DEFAULT_ANNOUNCEMENTS;
  }

  private static writeLocal(items: AnnouncementItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable: the in-memory list is still shown
    }
    window.dispatchEvent(new CustomEvent('announcementsUpdated', { detail: items }));
  }

  private static async saveToApi(items: AnnouncementItem[]): Promise<void> {
    const apiItems = sortByOrder(items).map((it, idx) => ({
      // Server ids are numeric; new lines ("ann_...") are created with id 0.
      id: /^\d+$/.test(it.id) ? Number(it.id) : 0,
      componentId: this.componentId ?? 0,
      title: it.text.trim(),
      refType: 'Announcement',
      displayOrder: idx + 1,
      isActive: it.isActive,
      isDeleted: false,
      createdBy: 1,
    }));

    const component = {
      id: this.componentId ?? 0,
      key: COMPONENT_KEY,
      name: 'Header Announcements',
      type: 'Ticker',
      displayOrder: 99,
      isActive: true,
      isDeleted: false,
      createdBy: 1,
      items: apiItems,
    };

    try {
      const res = this.componentId
        ? await fetch(`/api/homepagecomponent/${this.componentId}`, {
            method: 'PUT',
            headers: AdminAuthService.getAuthHeaders(),
            body: JSON.stringify(component),
          })
        : await fetch('/api/homepagecomponent', {
            method: 'POST',
            headers: AdminAuthService.getAuthHeaders(),
            body: JSON.stringify(component),
          });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Pick up the server ids of new lines so the next save updates instead of re-creating them
      // (skipped while a newer edit is waiting to be saved, so it is not overwritten on screen).
      if (!this.savePending) await this.loadFromApi();
    } catch (err) {
      console.error('Failed to save announcements:', err);
      showToast('Announcements could not be saved to the server. Please try again.', 'error');
    }
  }
}
