import { useState, useEffect } from 'react';
import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from '../engine/types';
import { isValidKarakter } from '../engine/validate';
import { sanitizeUndo } from '../hooks/useUndo';
import { readSlots, type SlotEntry } from '../hooks/slot-utils';
import { SlotRow } from './SlotRow';
import { SaveOptionsPopup } from './overlays/SaveOptionsPopup';
import { ImportOptionsPopup } from './overlays/ImportOptionsPopup';

interface Props {
  activeUid: string | undefined;
  onLoad: (karakter: Karakter, undo: any[]) => void;
  onDelete: (uid: string, név: string) => void;
  onShare: (uid: string) => void;
  onQrCode: (uid: string) => void;
  onSaveFile: (uid: string) => void;
  onShareFile: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onFileLoad: () => void;
  onClipboardImport: (text: string) => void;
  onNew: () => void;
  onSave: () => void;
  newDisabled: boolean;
  onTest: () => void;
  onFullscreenHint: () => void;
  onClose: () => void;
}

export function SlotList({ activeUid, onLoad, onDelete, onShare, onQrCode, onSaveFile, onShareFile, onDuplicate, onFileLoad, onClipboardImport, onNew, onSave, newDisabled, onTest, onFullscreenHint, onClose }: Props) {
  // Full backup: show a spinner in place of the icon while the
  // (Windows) native save dialog is being prepared.
  const [savingBackup, setSavingBackup] = useState(false);
  const isSaving = savingBackup;
  const isDesktop = typeof navigator.share !== 'function';
  const canShare = typeof navigator.share === 'function';

  // SaveOptions popup state: which slot uid is open (null = closed)
  const [savePopupUid, setSavePopupUid] = useState<string | null>(null);

  // Import popup state
  const [showImportPopup, setShowImportPopup] = useState(false);

  useEffect(() => {
    if (!savingBackup) return;
    const finish = () => onClose();
    window.addEventListener('blur', finish, { once: true });
    const t = setTimeout(finish, 8000);
    return () => { window.removeEventListener('blur', finish); clearTimeout(t); };
  }, [savingBackup, onClose]);

  const slots: SlotEntry[] = readSlots();
  slots.sort((a, b) => b.mentés_dátum.localeCompare(a.mentés_dátum));

  function loadSlot(uid: string) {
    const charData = localStorage.getItem(`szilank_char_${uid}`);
    if (!charData) return;
    try {
      const parsed = JSON.parse(charData);
      if (isValidKarakter(parsed)) {
        onLoad({ ...parsed, jk: parsed.jk ?? true, előtörténet: { ...DEFAULT_ELOTORTENET, ...parsed.előtörténet }, session: { ...DEFAULT_SESSION, ...parsed.session }, checkpoints: parsed.checkpoints || [] }, sanitizeUndo((parsed as any)._undo));
      }
    } catch { /* */ }
  }

  /** SaveOptionsPopup handlers */
  function handleUrlLink(uid: string) {
    setSavePopupUid(null);
    onShare(uid);
  }

  function handleQrCode(uid: string) {
    setSavePopupUid(null);
    onQrCode(uid);
  }

  function handleSaveFile(uid: string) {
    // Desktop: SaveOptionsPopup handles spinner + close on window blur.
    // Mobile: close popup immediately, proceed with download.
    if (!isDesktop) setSavePopupUid(null);
    onSaveFile(uid);
  }

  function handleShareFile(uid: string) {
    setSavePopupUid(null);
    onShareFile(uid);
  }

  // Get the name of the slot for the popup header
  function getSlotNév(uid: string): string {
    return slotDisplayNames.get(uid) || 'Névtelen';
  }

  function renderSlot(s: SlotEntry, displayName: string) {
    return (
      <SlotRow
        key={s.uid}
        slot={s}
        displayName={displayName}
        active={activeUid === s.uid}
        onLoad={loadSlot}
        onSaveOptions={setSavePopupUid}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    );
  }

  // Build display names: disambiguate nameless slots with v1, v2, etc.
  // Numbering follows creation order (oldest = v1), not display order.
  const slotDisplayNames = (() => {
    const names = new Map<string, string>();
    // Slots are sorted newest-first; reverse to assign v1 to the oldest
    const namelessUids: string[] = [];
    for (const s of slots) {
      if (!s.név && !s.becenév) namelessUids.push(s.uid);
    }
    if (namelessUids.length <= 1) {
      // Single or no nameless: plain "Névtelen", no suffix
      for (const s of slots) names.set(s.uid, s.név || s.becenév || 'Névtelen');
      return names;
    }
    // Multiple nameless: oldest (last in sorted array) = v1
    namelessUids.reverse();
    const suffixMap = new Map<string, number>();
    namelessUids.forEach((uid, i) => suffixMap.set(uid, i + 1));
    for (const s of slots) {
      if (s.név || s.becenév) {
        names.set(s.uid, s.név || s.becenév || '');
      } else {
        names.set(s.uid, `Névtelen v${suffixMap.get(s.uid)}`);
      }
    }
    return names;
  })();

  return (
    <>
      <div className="slot-actions slot-actions-top">
        <button className={`menu-item slot-file-btn${newDisabled ? ' is-disabled' : ''}`} aria-disabled={newDisabled} title="Új karakter" onClick={() => { if (!newDisabled) onNew(); }}>
          <span className="slot-btn-icon">✚</span><span className="slot-btn-label">Új</span>
        </button>
        <button className="menu-item slot-file-btn" title="Importálás" onClick={() => setShowImportPopup(true)}>
          <span className="slot-btn-icon">📥</span><span className="slot-btn-label">Importálás</span>
        </button>
        <button className={`menu-item slot-file-btn${newDisabled ? ' is-disabled' : ''}`} aria-disabled={newDisabled || isSaving} title="Összes karakter mentése"
          onClick={() => {
            if (newDisabled || isSaving) return;
            if (isDesktop) {
              setSavingBackup(true);
              // WORKAROUND: double-rAF-paint — ensures spinner paints before blocking save dialog
              requestAnimationFrame(() => requestAnimationFrame(() => onSave()));
            } else {
              // Mobile: no spinner needed — handleGenerateSave opens an overlay immediately
              onSave();
            }
          }}>
          {savingBackup ? <span className="slot-btn-spinner" /> : <><span className="slot-btn-icon">📦</span><span className="slot-btn-label">Összes mentése</span></>}
        </button>
      </div>
      <div className="slot-list">
        {slots.length === 0 && <span className="slot-empty">Nincs mentett karakter</span>}
        {(() => {
          const jkRows = slots.filter(s => s.jk !== false);
          const njkRows = slots.filter(s => s.jk === false);
          if (njkRows.length === 0) return jkRows.map(s => renderSlot(s, slotDisplayNames.get(s.uid) || 'Névtelen'));
          return [
            { title: 'Játékos karakterek', rows: jkRows },
            { title: 'Nem Játékos karakterek', rows: njkRows },
          ].map(section => section.rows.length > 0 && (
            <div key={section.title} className="slot-section">
              <div className="slot-section-title">{section.title}</div>
              {section.rows.map(s => renderSlot(s, slotDisplayNames.get(s.uid) || 'Névtelen'))}
            </div>
          ));
        })()}
      </div>
      <div className="menu-footer">
        <button className="menu-test-chip" onClick={onTest}>T</button>
        <span className="menu-build">{__APP_VERSION__}</span>
        {document.fullscreenEnabled ? (
          <button className="menu-fs-chip" title="Teljes képernyő" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
            onClose();
          }}>⛶</button>
        ) : (!window.matchMedia('(display-mode: standalone)').matches && (
          <button className="menu-fs-chip" title="Teljes képernyő" onClick={onFullscreenHint}>⛶</button>
        ))}
      </div>

      {savePopupUid && (
        <SaveOptionsPopup
          név={getSlotNév(savePopupUid)}
          canShare={canShare}
          onUrlLink={() => handleUrlLink(savePopupUid)}
          onSaveFile={() => handleSaveFile(savePopupUid)}
          onShareFile={() => handleShareFile(savePopupUid)}
          onQrCode={() => handleQrCode(savePopupUid)}
          onClose={() => setSavePopupUid(null)}
        />
      )}

      {showImportPopup && (
        <ImportOptionsPopup
          onFileLoad={() => { onFileLoad(); }}
          onClipboardLoad={(text) => { setShowImportPopup(false); onClipboardImport(text); }}
          onClose={() => setShowImportPopup(false)}
        />
      )}
    </>
  );
}
