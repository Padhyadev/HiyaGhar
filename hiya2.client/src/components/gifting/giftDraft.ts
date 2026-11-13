import type { JSONContent } from '@tiptap/react';
import type { GiftOption } from '../../services/giftService';

// The customer's gift choices while they shop: started in the gift builder (/gift-hampers) or at
// checkout, and kept until the order is placed. Text choices survive a page reload
// (sessionStorage); the photo itself is kept in memory only, so after a reload the customer is
// asked to add it again (unless it was already uploaded - then its token is enough).

export interface GiftPhoto {
  original: File;
  cropped: Blob;
  previewUrl: string;
  width: number;
  height: number;
  /** Set once uploaded to the server. */
  token?: string;
}

export interface GiftDraft {
  option: GiftOption;
  message: JSONContent | null;
  photo: GiftPhoto | null;
  /** Token of a photo uploaded before a reload (the image itself is no longer in memory). */
  photoToken: string | null;
  isForSelf: boolean;
  recipientName: string;
  recipientPhone: string;
  /** Set by the gift builder so checkout opens with the gift already chosen. */
  fromBuilder: boolean;
}

const STORAGE_KEY = 'hiya_gift_draft';

const EMPTY: GiftDraft = {
  option: 'none',
  message: null,
  photo: null,
  photoToken: null,
  isForSelf: true,
  recipientName: '',
  recipientPhone: '',
  fromBuilder: false,
};

let current: GiftDraft = load();
const listeners = new Set<() => void>();

function load(): GiftDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const saved = JSON.parse(raw);
    return { ...EMPTY, ...saved, photo: null };
  } catch {
    return { ...EMPTY };
  }
}

function persist() {
  try {
    const { photo, ...rest } = current;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, photoToken: photo?.token ?? rest.photoToken }));
  } catch {
    // Storage unavailable (private mode): the draft still works for this page view.
  }
}

export const GiftDraftStore = {
  get(): GiftDraft {
    return current;
  },

  update(patch: Partial<GiftDraft>) {
    if (patch.photo !== undefined && current.photo && current.photo !== patch.photo) {
      URL.revokeObjectURL(current.photo.previewUrl);
    }
    current = { ...current, ...patch };
    persist();
    listeners.forEach((l) => l());
  },

  clear() {
    if (current.photo) URL.revokeObjectURL(current.photo.previewUrl);
    current = { ...EMPTY };
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    listeners.forEach((l) => l());
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** True when the message has any visible text. */
export function messageHasText(message: JSONContent | null): boolean {
  if (!message) return false;
  const walk = (node: JSONContent): boolean =>
    (node.type === 'text' && !!node.text && node.text.trim().length > 0) || (node.content ?? []).some(walk);
  return walk(message);
}

/** Number of characters in the message (line breaks not counted) - same rule as the server. */
export function messageLength(message: JSONContent | null): number {
  if (!message) return 0;
  const walk = (node: JSONContent): number =>
    (node.type === 'text' ? (node.text ?? '').length : 0) + (node.content ?? []).reduce((n, c) => n + walk(c), 0);
  return walk(message);
}
