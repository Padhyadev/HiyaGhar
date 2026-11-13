import React from 'react';
import { GiftDraftStore } from './giftDraft';
import { useGiftDraft } from './giftCheckout';
import { GiftMessageEditor } from './GiftMessageEditor';
import { GiftPhotoUploader } from './GiftPhotoUploader';
import { GiftInsertPreview } from './GiftInsertPreview';

// Personalised gifting: optional photo + optional rich-text message, with the live A4 preview.
// Loaded on demand (it carries the rich-text editor and the cropper) - see GiftOptionsPanel.

const GiftPersonaliseSection: React.FC = () => {
  const draft = useGiftDraft();
  return (
    <div className="gift-personalise">
      <div className="gift-personalise-inputs">
        <h4 className="gift-subheading">
          <i className="fa-regular fa-image" aria-hidden="true" /> Your photo <small>(optional)</small>
        </h4>
        <GiftPhotoUploader
          photo={draft.photo}
          hasUploadedPhoto={!draft.photo && !!draft.photoToken}
          onChange={(photo) => GiftDraftStore.update({ photo, photoToken: null })}
        />

        <h4 className="gift-subheading">
          <i className="fa-solid fa-pen-nib" aria-hidden="true" /> Your message <small>(optional)</small>
        </h4>
        <GiftMessageEditor value={draft.message} onChange={(message) => GiftDraftStore.update({ message })} />

        <p className="gift-email-copy">
          <i className="fa-regular fa-envelope" aria-hidden="true" />
          <span>
            <strong>You'll get a copy of your gift insert (PDF)</strong>
            <small>It's attached to your order confirmation email and can be downloaded from your order page any time.</small>
          </span>
        </p>
      </div>

      <div className="gift-personalise-preview">
        <h4 className="gift-subheading">
          <i className="fa-regular fa-eye" aria-hidden="true" /> Live preview <small>(A4 insert)</small>
        </h4>
        <GiftInsertPreview photoUrl={draft.photo?.previewUrl ?? null} message={draft.message} />
        <p className="gift-preview-note">
          Printed on A4 (210 × 297 mm). The photo is never stretched; it takes at most half the page.
          {!draft.photo && draft.photoToken && ' Your uploaded photo is saved and will be printed.'}
        </p>
      </div>
    </div>
  );
};

export default GiftPersonaliseSection;
