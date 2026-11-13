import React, { useState } from 'react';
import { GiftService } from '../../services/giftService';
import { showToast } from '../../utils/alertService';
import './gifting.css';

// "Download gift insert (PDF)" for the customer's own Personalised gift order
// (order confirmation page and My Orders). The server only serves it to the order's customer.

interface GiftInsertDownloadButtonProps {
  orderNumber: string;
  className?: string;
}

export const GiftInsertDownloadButton: React.FC<GiftInsertDownloadButtonProps> = ({ orderNumber, className }) => {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    const result = await GiftService.downloadMyInsert(orderNumber);
    setBusy(false);
    if (!result.success) showToast(result.message || 'Your gift insert is not available.', 'error');
  };

  return (
    <button type="button" className={`gift-insert-download ${className ?? ''}`} onClick={download} disabled={busy}>
      <i className={busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-file-pdf'} aria-hidden="true" />
      {busy ? 'Preparing your PDF…' : 'Download gift insert (PDF)'}
    </button>
  );
};
