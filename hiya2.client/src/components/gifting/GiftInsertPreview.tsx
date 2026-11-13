import React, { useLayoutEffect, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { A4 } from './giftFonts';
import { GiftMessageView } from './GiftMessageView';
import { messageHasText } from './giftDraft';

// Live preview of the A4 print insert, drawn at real size in millimetres and scaled down to fit.
// Same layout as the PDF (Hiya2.Server/Services/Gifting/GiftInsertPdf.cs): 15 mm margins, the
// photo centred in a box of exactly 50% of the printable area, the message below it, and a
// message that is too big shrunk to fit its area (like the PDF's ScaleToFit).

const MM_TO_PX = 96 / 25.4;

interface GiftInsertPreviewProps {
  photoUrl: string | null;
  message: JSONContent | null;
}

/** Shrinks the message (re-wrapping it at the wider virtual width, as the PDF does) until it fits. */
const FittedMessage: React.FC<{ message: JSONContent; widthMm: number; heightMm: number }> = ({ message, widthMm, heightMm }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const boxW = widthMm * MM_TO_PX;
  const boxH = heightMm * MM_TO_PX;

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    let s = 1;
    for (let i = 0; i < 12; i++) {
      el.style.width = `${boxW / s}px`;
      const h = el.scrollHeight;
      if (h * s <= boxH + 0.5) break;
      s = Math.max(0.1, Math.min(s * 0.92, (boxH / h) * 0.98));
    }
    el.style.width = `${boxW / s}px`;
    setScale(s);
  }, [message, boxW, boxH]);

  return (
    <div className="gift-a4-message-box" style={{ width: `${widthMm}mm`, height: `${heightMm}mm` }}>
      <div
        ref={innerRef}
        className="gift-a4-message-inner"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <GiftMessageView message={message} />
      </div>
    </div>
  );
};

export const GiftInsertPreview: React.FC<GiftInsertPreviewProps> = ({ photoUrl, message }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const hasMessage = messageHasText(message);
  const hasPhoto = !!photoUrl;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(frame.clientWidth / (A4.widthMm * MM_TO_PX));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const photo = (
    <div className="gift-a4-photo-box" style={{ height: `${A4.photoBoxHeightMm}mm` }}>
      {photoUrl && <img src={photoUrl} alt="Your gift photo" />}
    </div>
  );

  return (
    <div
      ref={frameRef}
      className="gift-a4-frame"
      style={{ height: `${A4.heightMm * MM_TO_PX * scale}px` }}
      role="img"
      aria-label="Preview of your printed A4 insert"
    >
      <div
        className="gift-a4-page"
        style={{
          width: `${A4.widthMm}mm`,
          height: `${A4.heightMm}mm`,
          padding: `${A4.marginMm}mm`,
          transform: `scale(${scale})`,
        }}
      >
        <div className="gift-a4-content" style={{ width: `${A4.usableWidthMm}mm`, height: `${A4.usableHeightMm}mm` }}>
          {hasPhoto && hasMessage && (
            <>
              {photo}
              <div style={{ height: `${A4.gapMm}mm` }} />
              <FittedMessage message={message!} widthMm={A4.usableWidthMm} heightMm={A4.messageBoxHeightMm} />
            </>
          )}
          {hasPhoto && !hasMessage && <div className="gift-a4-center">{photo}</div>}
          {!hasPhoto && hasMessage && <FittedMessage message={message!} widthMm={A4.usableWidthMm} heightMm={A4.usableHeightMm} />}
          {!hasPhoto && !hasMessage && (
            <div className="gift-a4-empty">
              <i className="fa-regular fa-image" aria-hidden="true" />
              <span>Add a photo or a message to see your A4 insert here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
