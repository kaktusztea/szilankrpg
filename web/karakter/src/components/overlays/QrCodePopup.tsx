import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { encode, renderSVG } from 'uqr';

interface Props {
  url: string;
  név: string;
  onClose: () => void;
}

const QR_OPTS = { ecc: 'L' as const, border: 2 };
const PNG_SIZE = 512;
// privacy.resistFingerprinting (LibreWolf, hardened Firefox) spoofs buildID to this fixed value
const isCanvasPoisoned = (navigator as any).buildID === '20181001000000';

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
    ...QR_OPTS,
    pixelSize: 4,
    whiteColor: '#ffffff',
    blackColor: '#000000',
  }), [url]);

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

  async function handleDownload() {
    try {
      const blob = await qrToPngBlob(url, PNG_SIZE);
      downloadBlob(blob);
    } catch { /* */ }
  }

  async function handleShare() {
    try {
      const blob = await qrToPngBlob(url, PNG_SIZE);
      const file = new File([blob], filename, { type: 'image/png' });
      await navigator.share({ title: `Szilánk — ${név}`, files: [file] });
    } catch {
      // Fallback: share URL only
      try { await navigator.share({ title: `Szilánk — ${név}`, url }); } catch { /* cancelled */ }
    }
  }

  return createPortal(
    <div className="kep-prompt-overlay" onClick={handleBackdrop}>
      <div className="kep-prompt overlay-menu qr-popup">
        <label className="overlay-label-center">QR kód — {név}</label>
        <div className="qr-popup-svg" dangerouslySetInnerHTML={{ __html: svgString }} />
        {isCanvasPoisoned ? (
          <div className="qr-popup-warning">
            A böngésző fingerprint védelme megakadályozza a PNG exportot. Használd a képernyőkép funkciót, vagy kapcsold ki: <code>privacy.resistFingerprinting</code>
          </div>
        ) : (
          <div className="qr-popup-actions">
            <button type="button" className="qr-popup-chip qr-popup-chip-disabled" disabled>📋 Vágólapra</button>
            <button type="button" className="qr-popup-chip" onClick={handleDownload}>💾 PNG fájlba</button>
            {canShare && (
              <button type="button" className="qr-popup-chip" onClick={handleShare}>📤 Megosztás</button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
