import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { encode, renderSVG } from 'uqr';

interface Props {
  url: string;
  név: string;
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

/** Generate PNG Blob from QR data matrix directly on canvas (no SVG→Image round-trip). */
function qrToPngBlob(data: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const qr = encode(data, QR_OPTS);
    const modules = qr.size;
    const scale = Math.floor(size / modules);
    const actualSize = scale * modules;
    const canvas = document.createElement('canvas');
    canvas.width = actualSize;
    canvas.height = actualSize;
    const ctx = canvas.getContext('2d')!;
    // White background
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
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('canvas toBlob failed'));
    }, 'image/png');
  });
}

/** QR kód popup — karakter URL megjelenítése beolvasható QR kódként. */
export function QrCodePopup({ url, név, onClose }: Props) {
  const canShare = typeof navigator.share === 'function';
  const filename = `szilank_qr_${név.replace(/\s+/g, '_')}.png`;
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
    const t = setTimeout(finish, 8000);
    return () => { window.removeEventListener('blur', finish); clearTimeout(t); };
  }, [saving]);

  // Auto-clear hint
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(''), 2000);
    return () => clearTimeout(t);
  }, [hint]);

  async function handleDownload() {
    if (saving) return;
    setSaving(true);
    // WORKAROUND: double-rAF-paint — ensures spinner paints before blocking native file dialog
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      try {
        const blob = await qrToPngBlob(url, PNG_SIZE);
        downloadBlob(blob);
      } catch {
        setSaving(false);
      }
    }));
  }

  async function handleShare() {
    try {
      const blob = await qrToPngBlob(url, PNG_SIZE);
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
