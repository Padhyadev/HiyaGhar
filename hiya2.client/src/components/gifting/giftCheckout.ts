import { useSyncExternalStore } from 'react';
import { GiftDraftStore, messageHasText, messageLength, type GiftDraft } from './giftDraft';
import { MAX_MESSAGE_CHARS } from './giftFonts';
import { GiftService, toGiftTypeValue, type GiftOrderPayload } from '../../services/giftService';

/** The current gift draft; re-renders when it changes. */
export function useGiftDraft(): GiftDraft {
  return useSyncExternalStore(GiftDraftStore.subscribe, GiftDraftStore.get, GiftDraftStore.get);
}

/** Problems that stop the order (shown before anything is sent to the server). */
export function validateGiftDraft(draft: GiftDraft): string | null {
  if (draft.option === 'none') return null;
  if (!draft.isForSelf) {
    if (draft.recipientName.trim().length < 2) return "Please enter the gift recipient's name.";
    const digits = draft.recipientPhone.replace(/\D/g, '');
    if (digits && digits.length !== 10) return "Please enter a valid 10-digit mobile number for the recipient (or leave it empty).";
  }
  if (draft.option === 'personalised' && messageLength(draft.message) > MAX_MESSAGE_CHARS) {
    return `Your gift message is too long. Please keep it under ${MAX_MESSAGE_CHARS} characters.`;
  }
  return null;
}

/**
 * Uploads the personalised photo if it isn't uploaded yet (needs a logged-in or guest session)
 * and returns the gift data to send with the order. Throws a readable message on failure.
 */
export async function prepareGiftPayload(): Promise<GiftOrderPayload | null> {
  const draft = GiftDraftStore.get();
  if (draft.option === 'none') return null;

  let photoToken: string | null = null;
  if (draft.option === 'personalised') {
    if (draft.photo) {
      photoToken = draft.photo.token ?? null;
      if (!photoToken) {
        const result = await GiftService.uploadPhoto(draft.photo.original, draft.photo.cropped);
        if (!result.token) throw new Error(result.message || 'Your photo could not be uploaded.');
        photoToken = result.token;
        GiftDraftStore.update({ photo: { ...draft.photo, token: photoToken }, photoToken });
      }
    } else {
      photoToken = draft.photoToken;
    }
  }

  return {
    type: toGiftTypeValue(draft.option),
    photoToken,
    messageJson: draft.option === 'personalised' && messageHasText(draft.message) ? JSON.stringify(draft.message) : null,
    isForSelf: draft.isForSelf,
    recipientName: draft.isForSelf ? null : draft.recipientName.trim(),
    recipientPhone: draft.isForSelf ? null : draft.recipientPhone.replace(/\D/g, '') || null,  };
}
