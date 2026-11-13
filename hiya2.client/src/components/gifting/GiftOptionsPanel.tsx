import React, { Suspense, lazy } from 'react';
import { GiftDraftStore } from './giftDraft';
import { useGiftDraft } from './giftCheckout';
import { PERSONALISATION_CHARGE_PER_BOX, type GiftOption, type GiftQuote } from '../../services/giftService';
import { allowOnlyDigits } from '../../utils/validationUtils';
import './gifting.css';

// The photo cropper and rich-text editor are only downloaded when Personalised is chosen.
const GiftPersonaliseSection = lazy(() => import('./GiftPersonaliseSection'));

/** Shows a retry message if the editor chunk fails to download (e.g. a new version was published). */
class PersonaliseBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <p className="gift-field-error" role="alert">
        The photo &amp; message editor could not be loaded.{' '}
        <button type="button" className="gift-link-btn" onClick={() => window.location.reload()}>Reload the page</button>
      </p>
    );
  }
}

// Gifting choices, shared by the gift builder page and the checkout's "convert to gift" step:
// gift type, the automatically chosen box, recipient details and the personalised insert
// (photo + rich-text message + live A4 preview).

interface GiftOptionsPanelProps {
  /** Show "No, continue with normal order" (checkout only). */
  allowNone: boolean;
  /** Ask whether the gift is for the customer or someone else (checkout). */
  showRecipient: boolean;
  quote: GiftQuote | null;
  quoteLoading: boolean;
  /** Heading id for aria-labelledby on the option group. */
  headingId?: string;
}

export const GiftOptionsPanel: React.FC<GiftOptionsPanelProps> = ({ allowNone, showRecipient, quote, quoteLoading, headingId }) => {
  const draft = useGiftDraft();
  const boxCount = quote?.isSuccess ? quote.boxCount : 1;
  const personalisedCharge = PERSONALISATION_CHARGE_PER_BOX * boxCount;
  const setOption = (option: GiftOption) => GiftDraftStore.update({ option });

  const options: Array<{ key: GiftOption; title: string; detail: string; price: string; icon: string }> = [
    ...(allowNone
      ? [{ key: 'none' as GiftOption, title: 'No, continue with normal order', detail: 'Your order is packed as usual.', price: '', icon: 'fa-solid fa-box' }]
      : []),
    {
      key: 'normal',
      title: allowNone ? 'Yes, Normal Gifting' : 'Normal Gifting',
      detail: 'Packed in a standard HIYAGHAR gift box.',
      price: 'No extra charge',
      icon: 'fa-solid fa-gift',
    },
    {
      key: 'personalised',
      title: allowNone ? 'Yes, Personalised Gifting' : 'Personalised Gifting',
      detail: 'Gift box plus an A4 insert printed with your photo and message.',
      price:
        boxCount > 1
          ? `+₹${PERSONALISATION_CHARGE_PER_BOX} × ${boxCount} boxes = ₹${personalisedCharge}`
          : `+₹${PERSONALISATION_CHARGE_PER_BOX} per gift box`,
      icon: 'fa-solid fa-wand-magic-sparkles',
    },
  ];

  return (
    <div className="gift-panel">
      <div className="gift-option-list" role="radiogroup" aria-labelledby={headingId}>
        {options.map((o) => (
          <label key={o.key} className={`gift-option-card ${draft.option === o.key ? 'is-selected' : ''}`}>
            <input type="radio" name="gift-option" value={o.key} checked={draft.option === o.key} onChange={() => setOption(o.key)} />
            <i className={`gift-option-icon ${o.icon}`} aria-hidden="true" />
            <span className="gift-option-text">
              <strong>{o.title}</strong>
              <span>{o.detail}</span>
            </span>
            {o.price && <span className="gift-option-price">{o.price}</span>}
          </label>
        ))}
      </div>

      {draft.option !== 'none' && (
        <div className="gift-box-info" aria-live="polite">
          <i className="fa-solid fa-box-open" aria-hidden="true" />
          {quoteLoading ? (
            <span>Choosing the right gift box…</span>
          ) : quote?.isSuccess ? (
            <span>
              Your gift box: <strong>{quote.boxSummary}</strong>
              <small> (chosen automatically for your products)</small>
            </span>
          ) : (
            <span className="gift-field-error">{quote?.message || 'We could not choose a gift box. Please try again.'}</span>
          )}
        </div>
      )}

      {draft.option !== 'none' && showRecipient && (
        <fieldset className="gift-recipient">
          <legend>Who is this gift for?</legend>
          <div className="gift-segmented" role="group">
            <button type="button" className={draft.isForSelf ? 'is-active' : ''} aria-pressed={draft.isForSelf} onClick={() => GiftDraftStore.update({ isForSelf: true })}>
              <i className="fa-regular fa-user" aria-hidden="true" /> For me
            </button>
            <button type="button" className={!draft.isForSelf ? 'is-active' : ''} aria-pressed={!draft.isForSelf} onClick={() => GiftDraftStore.update({ isForSelf: false })}>
              <i className="fa-solid fa-hand-holding-heart" aria-hidden="true" /> For someone else
            </button>
          </div>
          {!draft.isForSelf && (
            <div className="gift-recipient-fields">
              <label>
                <span>Recipient's name *</span>
                <input
                  type="text"
                  value={draft.recipientName}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(e) => GiftDraftStore.update({ recipientName: e.target.value })}
                />
              </label>
              <label>
                <span>Recipient's mobile (optional)</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={draft.recipientPhone}
                  maxLength={10}
                  onKeyDown={allowOnlyDigits}
                  onChange={(e) => GiftDraftStore.update({ recipientPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                />
              </label>
              <p className="gift-recipient-note">
                <i className="fa-solid fa-circle-info" aria-hidden="true" /> The gift is delivered to the address chosen in step 1 - make sure it is the recipient's address.
              </p>
            </div>
          )}
        </fieldset>
      )}

      {draft.option === 'personalised' && (
        <PersonaliseBoundary>
          <Suspense fallback={<p className="gift-builder-muted" aria-busy="true">Loading the photo &amp; message editor…</p>}>
            <GiftPersonaliseSection />
          </Suspense>
        </PersonaliseBoundary>
      )}
    </div>
  );
};
