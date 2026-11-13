import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import type { GiftPhoto } from './giftDraft';
import { MAX_PHOTO_MB } from '../../services/giftService';

// Optional personal photo: JPG / JPEG / PNG / WebP up to 10 MB, cropped, zoomed and moved by the
// customer. The crop is cut from the full-resolution original (never upscaled) so print quality
// is kept; the original file is kept too and goes to the store with the order.

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;
// Long edge of the cropped photo. The photo box is 180 × 133.5 mm: at 300 DPI that is about
// 2126 × 1577 px, so 3000 px keeps full print quality with room to spare.
const MAX_OUTPUT_EDGE = 3000;

type AspectChoice = 'original' | 'portrait' | 'landscape' | 'square';
const ASPECTS: Array<{ key: AspectChoice; label: string; icon: string }> = [
  { key: 'original', label: 'Original', icon: 'fa-regular fa-image' },
  { key: 'portrait', label: 'Portrait', icon: 'fa-solid fa-mobile-screen' },
  { key: 'landscape', label: 'Landscape', icon: 'fa-solid fa-tv' },
  { key: 'square', label: 'Square', icon: 'fa-regular fa-square' },
];

function aspectValue(choice: AspectChoice, natural: { w: number; h: number }): number {
  switch (choice) {
    case 'portrait': return 3 / 4;
    case 'landscape': return 4 / 3;
    case 'square': return 1;
    default: return natural.w / natural.h;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This image could not be opened.'));
    img.src = url;
  });
}

async function cropImage(url: string, area: Area): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(url);
  const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(area.width, area.height));
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not prepare the photo.');
  ctx.fillStyle = '#ffffff'; // transparent PNGs print on white paper
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  if (!blob) throw new Error('Your browser could not prepare the photo.');
  return { blob, width, height };
}

interface GiftPhotoUploaderProps {
  photo: GiftPhoto | null;
  /** True when a photo was uploaded earlier but is no longer in memory (page reloaded). */
  hasUploadedPhoto: boolean;
  onChange: (photo: GiftPhoto | null) => void;
}

export const GiftPhotoUploader: React.FC<GiftPhotoUploaderProps> = ({ photo, hasUploadedPhoto, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ file: File; url: string; natural: { w: number; h: number } } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<AspectChoice>('original');
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  // Release the editing image when the cropper closes.
  useEffect(() => () => { if (editing) URL.revokeObjectURL(editing.url); }, [editing]);

  const openFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.test(file.name)) {
      setError('Please choose a JPG, JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setError(`This photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please choose one under ${MAX_PHOTO_MB} MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (img.naturalWidth < 300 || img.naturalHeight < 300) {
        setError('This photo is very small and would print blurry. Please choose a larger photo (at least 300 × 300 pixels).');
        URL.revokeObjectURL(url);
        return;
      }
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect('original');
      setEditing({ file, url, natural: { w: img.naturalWidth, h: img.naturalHeight } });
    } catch (e) {
      URL.revokeObjectURL(url);
      setError((e as Error).message);
    }
  };

  const reCrop = async () => {
    if (!photo) return;
    await openFile(photo.original);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const confirmCrop = async () => {
    if (!editing || !area) return;
    setBusy(true);
    try {
      const { blob, width, height } = await cropImage(editing.url, area);
      onChange({ original: editing.file, cropped: blob, previewUrl: URL.createObjectURL(blob), width, height });
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gift-photo">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) openFile(file);
        }}
      />

      {!editing && !photo && (
        <button type="button" className="gift-photo-drop" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) openFile(file);
          }}
        >
          <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
          <strong>{hasUploadedPhoto ? 'Your photo is saved - tap to replace it' : 'Upload a photo (optional)'}</strong>
          <span>JPG, PNG or WebP • up to {MAX_PHOTO_MB} MB • portrait or landscape</span>
        </button>
      )}

      {!editing && photo && (
        <div className="gift-photo-current">
          <img src={photo.previewUrl} alt="Your cropped gift photo" />
          <div className="gift-photo-actions">
            <button type="button" className="gift-link-btn" onClick={reCrop}>
              <i className="fa-solid fa-crop-simple" aria-hidden="true" /> Crop / reposition
            </button>
            <button type="button" className="gift-link-btn" onClick={() => inputRef.current?.click()}>
              <i className="fa-solid fa-arrows-rotate" aria-hidden="true" /> Change photo
            </button>
            <button type="button" className="gift-link-btn is-danger" onClick={() => onChange(null)}>
              <i className="fa-regular fa-trash-can" aria-hidden="true" /> Remove
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="gift-cropper" role="dialog" aria-label="Crop your photo">
          <div className="gift-cropper-stage">
            <Cropper
              image={editing.url}
              crop={crop}
              zoom={zoom}
              minZoom={1}
              maxZoom={4}
              aspect={aspectValue(aspect, editing.natural)}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              showGrid
            />
          </div>
          <div className="gift-cropper-controls">
            <div className="gift-segmented" role="group" aria-label="Photo shape">
              {ASPECTS.map((a) => (
                <button key={a.key} type="button" className={aspect === a.key ? 'is-active' : ''} aria-pressed={aspect === a.key} onClick={() => setAspect(a.key)}>
                  <i className={a.icon} aria-hidden="true" /> {a.label}
                </button>
              ))}
            </div>
            <label className="gift-zoom">
              <i className="fa-solid fa-magnifying-glass-minus" aria-hidden="true" />
              <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" />
              <i className="fa-solid fa-magnifying-glass-plus" aria-hidden="true" />
            </label>
            <p className="gift-cropper-hint">Drag the photo to reposition it. Pinch or use the slider to zoom.</p>
            <div className="gift-cropper-buttons">
              <button type="button" className="gift-btn-secondary" onClick={() => setEditing(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="gift-btn-primary" onClick={confirmCrop} disabled={busy || !area}>
                {busy ? 'Preparing…' : 'Use this photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="gift-field-error" role="alert">{error}</p>}
    </div>
  );
};
