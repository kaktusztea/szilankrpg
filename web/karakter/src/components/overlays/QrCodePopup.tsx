import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { encode, renderSVG } from 'uqr';
import { FEEDBACK_TIMEOUT_MS, HINT_DURATION_MS } from '../../ui-constants';

interface Props {
  url: string;
  név: string;
  tsz: number;
  onClose: () => void;
}

const QR_OPTS = { ecc: 'L' as const, border: 2 };
const PNG_SIZE = 512;

/** Detect if canvas export is poisoned by privacy.resistFingerprinting (runtime check). */
function detectCanvasPoison(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 2;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillRect(0, 1, 2, 1);
    const data = ctx.getImageData(0, 0, 2, 2).data;
    // Pixel (0,0) should be black (0,0,0,255), pixel (1,0) should be white (255,255,255,255)
    return data[0] !== 0 || data[4] !== 255 || data[8] !== 255 || data[12] !== 255;
  } catch {
    return false;
  }
}

const isCanvasPoisoned = detectCanvasPoison();

/** Generate PNG Blob from QR data matrix directly on canvas (no SVG→Image round-trip).
 *  Optional label is rendered in a dark footer band below the QR area. */
function qrToPngBlob(data: string, size: number, label?: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const qr = encode(data, QR_OPTS);
    const modules = qr.size;
    const scale = Math.floor(size / modules);
    const actualSize = scale * modules;
    // Footer: dark band with label text, separated from QR white zone
    const footerH = label ? Math.round(actualSize * 0.1) : 0;
    const totalH = actualSize + footerH;
    const canvas = document.createElement('canvas');
    canvas.width = actualSize;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;
    // White background (QR area)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, actualSize, actualSize);
    // Black modules
    ctx.fillStyle = '#000000';
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        if (qr.data[y][x]) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    // Footer band with label
    if (label && footerH > 0) {
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, actualSize, actualSize, footerH);
      const fontSize = Math.round(footerH * 0.55);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, actualSize / 2, actualSize + footerH / 2, actualSize - 20);
    }
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('canvas toBlob failed'));
    }, 'image/png');
  });
}

/** QR kód popup — karakter URL megjelenítése beolvasható QR kódként. */
export function QrCodePopup({ url, név, tsz, onClose }: Props) {
  const canShare = typeof navigator.share === 'function';
  const filename = `szilank_qr_${név.replace(/\s+/g, '_')}.png`;
  const pngLabel = `${név} — ${tsz}. szint`;
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState('');

  // Escape: close (capture phase to prevent parent overlay closing)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const svgString = useMemo(() => renderSVG(url, {
    ...QR_OPTS, pixelSize: 4, whiteColor: '#ffffff', blackColor: '#000000',
  }), [url]);

  // For poisoned canvas: render as <img> so browser context menu offers "Save image as"
  const svgDataUrl = useMemo(() => {
    if (!isCanvasPoisoned) return '';
    const svg = renderSVG(url, { ...QR_OPTS, pixelSize: 10, whiteColor: '#ffffff', blackColor: '#000000' });
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, [url]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) {
      e.stopPropagation();
      onClose();
    }
  };

  function downloadBlob(blob: Blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Close popup when native save dialog steals focus, or fallback timeout
  useEffect(() => {
    if (!saving) return;
    const finish = () => setSaving(false);
    window.addEventListener('blur', finish, { once: true });
    const t = setTimeout(finish, FEEDBACK_TIMEOUT_MS);
    return () => { window.removeEventListener('blur', finish); clearTimeout(t); };
  }, [saving]);

  // Auto-clear hint
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(''), HINT_DURATION_MS);
    return () => clearTimeout(t);
  }, [hint]);

  async function handleDownload() {
    if (saving) return;
    setSaving(true);
    // WORKAROUND: double-rAF-paint — ensures spinner paints before blocking native file dialog
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      try {
        const blob = await qrToPngBlob(url, PNG_SIZE, pngLabel);
        downloadBlob(blob);
      } catch {
        setSaving(false);
      }
    }));
  }

  async function handleShare() {
    try {
      const blob = await qrToPngBlob(url, PNG_SIZE, pngLabel);
      const file = new File([blob], filename, { type: 'image/png' });
      await navigator.share({ title: `Szilánk — ${név}`, files: [file] });
    } catch (e: any) {
      // User cancelled (iOS AbortError) — do NOT retry with URL fallback
      if (e?.name === 'AbortError') return;
      // Fallback: share URL only (files not supported on this platform)
      try { await navigator.share({ title: `Szilánk — ${név}`, url }); } catch { /* cancelled */ }
    }
  }

  return createPortal(
    <div className="kep-prompt-overlay" onClick={handleBackdrop}>
      <div className="kep-prompt overlay-menu qr-popup">
        <label className="overlay-label-center">QR kód — {név}</label>
        {isCanvasPoisoned ? (
          <div className="qr-popup-svg qr-popup-svg-img" onContextMenu={e => e.stopPropagation()}>
            <img src={svgDataUrl} alt={`QR kód: ${név}`} width="260" height="260" />
          </div>
        ) : (
          <div className="qr-popup-svg" dangerouslySetInnerHTML={{ __html: svgString }} />
        )}
        {isCanvasPoisoned ? (
          <div className="qr-popup-warning">
            A böngésző fingerprint védelme megakadályozza a kép másolását. Jobb klikk → „Kép mentése másként" az SVG mentéséhez, vagy kapcsold ki: <code>privacy.resistFingerprinting</code>
          </div>
        ) : (
          <div className="qr-popup-actions">
            <button type="button" className="qr-popup-chip qr-popup-chip-disabled" title="Még nem implementált" onClick={() => setHint('Még nem implementált')}>📋 Vágólapra</button>
            <button type="button" className="qr-popup-chip" disabled={saving} onClick={handleDownload}>
              {saving ? <span className="slot-btn-spinner" /> : '💾 PNG fájlba'}
            </button>
            {canShare && (
              <button type="button" className="qr-popup-chip" onClick={handleShare}>📤 Megosztás</button>
            )}
          </div>
        )}
        {hint && <div className="qr-popup-hint">{hint}</div>}
      </div>
    </div>,
    document.body
  );
}
