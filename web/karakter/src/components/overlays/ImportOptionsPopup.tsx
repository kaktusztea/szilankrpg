import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  onFileLoad: () => void;
  onClipboardLoad: (text: string) => void;
  onClose: () => void;
}

/** 📥 Importálás popup: JSON fájlból vagy vágólapról (URL/QR link). */
export function ImportOptionsPopup({ onFileLoad, onClipboardLoad, onClose }: Props) {
  const [clipError, setClipError] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

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
  useEffect(() => {
    if (!loadingFile) return;
    const finish = () => onClose();
    window.addEventListener('blur', finish, { once: true });
    const t = setTimeout(finish, 8000);
    return () => { window.removeEventListener('blur', finish); clearTimeout(t); };
  }, [loadingFile, onClose]);

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
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setClipError('A vágólap üres.'); return; }
      onClipboardLoad(text.trim());
    } catch {
      setClipError('Nincs hozzáférés a vágólaphoz.');
    }
  }

  return createPortal(
    <div className="kep-prompt-overlay" onClick={handleBackdrop}>
      <div className="kep-prompt overlay-menu">
        <label className="overlay-label-center">Importálás</label>

        <button className="menu-item" disabled={loadingFile} onClick={handleFileLoad}>
          {loadingFile ? <span className="slot-btn-spinner" /> : '📁 JSON fájlból'}
        </button>
        <button className="menu-item" onClick={handleClipboard}>📋 Vágólapról<span className="slot-btn-label import-sub-hint">(URL / QR)</span></button>

        {clipError && <span className="import-clip-error">{clipError}</span>}
      </div>
    </div>,
    document.body
  );
}
