import React, { useEffect, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { GiftService, type AdminOrderGift } from '../../services/giftService';
import { AdminAuthService } from '../../services/adminAuthService';
import { GiftMessageView } from './GiftMessageView';
import { GiftInsertPreview } from './GiftInsertPreview';
import { showToast } from '../../utils/alertService';
import './gifting.css';

// Admin order detail: gift type, chosen box(es), recipient, the personalised message and photo,
// and downloads of the photo and the A4 print insert (staff-only endpoints).

interface AdminOrderGiftPanelProps {
  orderId: number;
}

export const AdminOrderGiftPanel: React.FC<AdminOrderGiftPanelProps> = ({ orderId }) => {
  const [gift, setGift] = useState<AdminOrderGift | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setState('loading');
    setPhotoUrl(null);
    GiftService.getOrderGiftAdmin(orderId).then(async (g) => {
      if (cancelled) return;
      setGift(g);
      setState(g ? 'ready' : 'error');
      if (g?.hasPhoto) {
        // The photo is protected, so it is fetched with the admin token rather than linked.
        try {
          const res = await fetch(`/api/gift/admin/orders/${orderId}/photo`, { headers: AdminAuthService.getAuthHeadersForFormData() });
          if (res.ok && !cancelled) {
            objectUrl = URL.createObjectURL(await res.blob());
            setPhotoUrl(objectUrl);
          }
        } catch {
          // Preview only; the download buttons still work.
        }
      }
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [orderId]);

  const download = async (file: 'photo' | 'photo-original' | 'insert', regenerate = false) => {
    setBusy(file + (regenerate ? '-regen' : ''));
    const result = await GiftService.downloadOrderFileAdmin(orderId, file, regenerate);
    setBusy(null);
    if (!result.success) showToast(result.message || 'Download failed.', 'error');
  };

  if (state === 'loading') {
    return <div className="admin-gift-panel"><p className="gift-builder-muted">Loading gift details…</p></div>;
  }
  if (state === 'error' || !gift) {
    return <div className="admin-gift-panel"><p className="gift-field-error">Could not load the gift details for this order.</p></div>;
  }

  let message: JSONContent | null = null;
  try {
    message = gift.messageJson ? JSON.parse(gift.messageJson) : null;
  } catch {
    message = null;
  }
  const personalised = gift.giftType === 'Personalised';

  return (
    <div className="admin-gift-panel">
      <div className="admin-gift-header">
        <h4>
          <i className="fa-solid fa-gift" aria-hidden="true" /> {personalised ? 'Personalised Gifting' : 'Normal Gifting'}
        </h4>
        <span className={`admin-gift-pill ${personalised ? 'is-personalised' : ''}`}>
          {gift.totalCharge > 0 ? `₹${gift.totalCharge.toFixed(2)} (${gift.boxCount} × ₹${gift.chargePerBox.toFixed(0)})` : 'No extra charge'}
        </span>
      </div>

      <div className="admin-gift-grid">
        <div className="admin-gift-facts">
          <p><strong>Gift box:</strong> {gift.boxSummary} ({gift.boxCount} box{gift.boxCount === 1 ? '' : 'es'})</p>
          <p>
            <strong>Recipient:</strong>{' '}
            {gift.isForSelf ? 'Customer (gift for themselves)' : `${gift.recipientName || '-'}${gift.recipientPhone ? ` • ${gift.recipientPhone}` : ''}`}
          </p>
          {personalised && (
            <>
              <p><strong>Photo:</strong> {gift.hasPhoto ? 'Yes' : 'No photo'}</p>
              <p><strong>Message:</strong> {message ? '' : 'No message'}</p>
              {message && <div className="admin-gift-message"><GiftMessageView message={message} /></div>}
              {!gift.needsInsert && <p className="gift-builder-muted">Personalised without photo or message - no insert to print.</p>}
            </>
          )}

          {personalised && (
            <div className="admin-gift-actions">
              {gift.needsInsert && (
                <button type="button" className="gift-btn-primary" onClick={() => download('insert')} disabled={!!busy}>
                  <i className="fa-solid fa-file-pdf" aria-hidden="true" /> {busy === 'insert' ? 'Preparing…' : 'Download A4 print file'}
                </button>
              )}
              {gift.hasPhoto && (
                <button type="button" className="gift-btn-secondary" onClick={() => download('photo')} disabled={!!busy}>
                  <i className="fa-regular fa-image" aria-hidden="true" /> Cropped photo
                </button>
              )}
              {gift.hasOriginalPhoto && (
                <button type="button" className="gift-btn-secondary" onClick={() => download('photo-original')} disabled={!!busy}>
                  <i className="fa-solid fa-download" aria-hidden="true" /> Original photo
                </button>
              )}
              {gift.needsInsert && (
                <button type="button" className="gift-link-btn" onClick={() => download('insert', true)} disabled={!!busy} title="Build the A4 file again from the saved photo and message">
                  <i className="fa-solid fa-rotate" aria-hidden="true" /> Rebuild print file
                </button>
              )}
            </div>
          )}
        </div>

        {personalised && gift.needsInsert && (
          <div className="admin-gift-preview">
            <GiftInsertPreview photoUrl={photoUrl} message={message} />
            <small className="gift-builder-muted">Preview - print using the A4 PDF.</small>
          </div>
        )}
      </div>
    </div>
  );
};
