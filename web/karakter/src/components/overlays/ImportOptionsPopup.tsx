import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import jsQR from 'jsqr';
import { FEEDBACK_TIMEOUT_MS } from '../../ui-constants';

interface Props {
  onFileLoad: () => void;
  onClipboardLoad: (text: string) => void;
  onClose: () => void;
}

/** 📥 Importálás popup: JSON fájlból, vágólapról, vagy QR kód képfájlból. */
export function ImportOptionsPopup({ onFileLoad, onClipboardLoad, onClose }: Props) {
  const [clipError, setClipError] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [qrError, setQrError] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Escape: close this popup only (capture phase + stopPropagation prevents parent overlays from closing)
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

  // Close popup when native file dialog steals focus (window blur), or fallback timeout.
  // Only for JSON file load — QR image picker needs the popup alive for the onChange callback.
  useEffect(() => {
    if (!loadingFile) return;
    const finish = () => onClose();
    window.addEventListener('blur', finish, { once: true });
    const t = setTimeout(finish, FEEDBACK_TIMEOUT_MS);
    return () => { window.removeEventListener('blur', finish); clearTimeout(t); };
  }, [loadingFile, onClose]);

  // Reset QR loading state when window regains focus (user returned from file picker)
  useEffect(() => {
    if (!loadingQr) return;
    const reset = () => setLoadingQr(false);
    window.addEventListener('focus', reset, { once: true });
    const t = setTimeout(reset, FEEDBACK_TIMEOUT_MS);
    return () => { window.removeEventListener('focus', reset); clearTimeout(t); };
  }, [loadingQr]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) {
      e.stopPropagation();
      onClose();
    }
  };

  function handleFileLoad() {
    if (loadingFile) return;
    setLoadingFile(true);
    // WORKAROUND: double-rAF-paint — ensures spinner paints before blocking native file dialog
    requestAnimationFrame(() => requestAnimationFrame(() => onFileLoad()));
  }

  async function handleClipboard() {
    setClipError('');
    try {
      // Try text first
      const text = await navigator.clipboard.readText();
      if (text.trim()) { onClipboardLoad(text.trim()); return; }
    } catch { /* text read failed, try image */ }

    // Try reading image from clipboard (e.g. copied QR code image)
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const objectUrl = URL.createObjectURL(blob);
          const decoded = await decodeQrFromUrl(objectUrl);
          if (decoded) { onClipboardLoad(decoded); return; }
          setClipError('Nem található QR kód a képen.');
          return;
        }
      }
      setClipError('A vágólap üres.');
    } catch {
      setClipError('Nincs hozzáférés a vágólaphoz.');
    }
  }

  function decodeQrFromUrl(objectUrl: string): Promise<string | null> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, canvas.width, canvas.height);
        resolve(result?.data || null);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  }

  function handleQrImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setQrError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // SVG files need special handling: inject width/height for proper rasterization
    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = () => {
        let svgText = reader.result as string;
        // Extract viewBox dimensions and inject as width/height
        const vbMatch = svgText.match(/viewBox="0 0 (\d+) (\d+)"/);
        if (vbMatch) {
          svgText = svgText.replace('<svg ', `<svg width="${vbMatch[1]}" height="${vbMatch[2]}" `);
        }
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        loadImageAndDecode(URL.createObjectURL(blob));
      };
      reader.onerror = () => setQrError('A képfájl nem olvasható.');
      reader.readAsText(file);
    } else {
      loadImageAndDecode(URL.createObjectURL(file));
    }
  }

  function loadImageAndDecode(objectUrl: string) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, canvas.width, canvas.height);
      if (result?.data) {
        onClipboardLoad(result.data);
      } else {
        setQrError('Nem található QR kód a képen.');
      }
      // Reset input so same file can be re-selected
      if (qrInputRef.current) qrInputRef.current.value = '';
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setQrError('A képfájl nem olvasható.');
      if (qrInputRef.current) qrInputRef.current.value = '';
    };
    img.src = objectUrl;
  }

  return createPortal(
    <div className="kep-prompt-overlay" onClick={handleBackdrop}>
      <div className="kep-prompt overlay-menu">
        <label className="overlay-label-center">Importálás</label>

        <button className="menu-item" disabled={loadingFile} onClick={handleFileLoad}>
          {loadingFile ? <span className="slot-btn-spinner" /> : '📁 JSON fájlból'}
        </button>

        <button className="menu-item" disabled={loadingQr} onClick={() => {
          if (loadingQr) return;
          setLoadingQr(true);
          requestAnimationFrame(() => requestAnimationFrame(() => qrInputRef.current?.click()));
        }}>
          {loadingQr ? <span className="slot-btn-spinner" /> : '▣ QR kód képfájlból'}
        </button>
        <input ref={qrInputRef} type="file" accept="image/*" hidden onChange={handleQrImageSelect} />

        <button className="menu-item" onClick={handleClipboard}>📋 Vágólapról<span className="slot-btn-label import-sub-hint">(URL / QR)</span></button>

        {clipError && <span className="import-clip-error">{clipError}</span>}
        {qrError && <span className="import-clip-error">{qrError}</span>}
      </div>
    </div>,
    document.body
  );
}
