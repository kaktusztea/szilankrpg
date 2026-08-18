import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  név: string;
  canShare: boolean;
  onUrlLink: () => void;
  onSaveFile: () => void;
  onShareFile: () => void;
  onClose: () => void;
}

/** 💾 Mentés/Exportálás popup: URL link, JSON fájlba, QR (placeholder). */
export function SaveOptionsPopup({ név, canShare, onUrlLink, onSaveFile, onShareFile, onClose }: Props) {
  const [fileExpanded, setFileExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Escape: close this popup only (capture phase + stopPropagation prevents parent overlays from closing)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey, true); // capture phase
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  // Desktop: close popup when native save dialog steals focus (window blur),
  // or fallback timeout if blur never fires.
  useEffect(() => {
    if (!saving) return;
    const finish = () => onClose();
    window.addEventListener('blur', finish, { once: true });
    const t = setTimeout(finish, 8000);
    return () => { window.removeEventListener('blur', finish); clearTimeout(t); };
  }, [saving, onClose]);

  function handleDesktopSave() {
    if (saving) return;
    setSaving(true);
    // WORKAROUND: double-rAF-paint — ensures spinner paints before blocking native file dialog
    requestAnimationFrame(() => requestAnimationFrame(() => onSaveFile()));
  }

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) {
      e.stopPropagation();
      onClose();
    }
  };

  return createPortal(
    <div className="kep-prompt-overlay" onClick={handleBackdrop}>
      <div className="kep-prompt overlay-menu">
        <label className="overlay-label-center">Mentés — {név}</label>

        <button className="menu-item" onClick={onUrlLink}>🔗 URL link</button>

        {canShare ? (
          <>
            <button className="menu-item" onClick={() => setFileExpanded(v => !v)}>
              📄 JSON fájlba {fileExpanded ? '▾' : '▸'}
            </button>
            {fileExpanded && (
              <div className="save-options-sub">
                <button className="menu-item menu-item-sub" onClick={onSaveFile}>🖴 Mentés háttértárra</button>
                <button className="menu-item menu-item-sub" onClick={onShareFile}>📤 Megosztás</button>
              </div>
            )}
          </>
        ) : (
          <button className="menu-item" disabled={saving} onClick={handleDesktopSave}>
            {saving ? <span className="slot-btn-spinner" /> : '📄 JSON fájlba'}
          </button>
        )}

        <button className="menu-item menu-item-disabled" disabled>▣ QR kód (hamarosan)</button>
      </div>
    </div>,
    document.body
  );
}
