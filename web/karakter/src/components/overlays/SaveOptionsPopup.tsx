import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  név: string;
  canShare: boolean;
  onUrlLink: () => void;
  onSaveFile: () => void;
  onShareFile: () => void;
  onQrCode: () => void;
  onClose: () => void;
}

/** 💾 Mentés/Exportálás popup: URL link, JSON fájlba, QR (placeholder). */
export function SaveOptionsPopup({ név, canShare, onUrlLink, onSaveFile, onShareFile, onQrCode, onClose }: Props) {
  const [fileExpanded, setFileExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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

        <div className="save-row-with-info">
          <button className="menu-item" onClick={onUrlLink}>🔗 URL link<span className="save-info-btn" onClick={e => { e.stopPropagation(); setShowInfo(true); }}>ⓘ</span></button>
        </div>

        <div className="save-row-with-info">
          <button className="menu-item" onClick={onQrCode}>▣ QR kód<span className="save-info-btn" onClick={e => { e.stopPropagation(); setShowInfo(true); }}>ⓘ</span></button>
        </div>

        {showInfo && (
          <div className="save-info-panel" onClick={() => setShowInfo(false)}>
            <b>URL link / QR kód — nem tartalmazza:</b>
            <ul>
              <li>Előtörténet (szöveges mező)</li>
              <li>Karakter verziók (checkpoint-ok)</li>
              <li>Napló bejegyzések</li>
              <li>Jegyzetek</li>
              <li>Undo előzmények</li>
            </ul>
            <span className="save-info-dismiss">Koppints a bezáráshoz</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
