import { useState, useEffect } from 'react';
import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from '../engine/types';
import { isValidKarakter } from '../engine/validate';
import { sanitizeUndo } from '../hooks/useUndo';
import { readSlots, type SlotEntry } from '../hooks/slot-utils';
import { SlotRow } from './SlotRow';

interface Props {
  activeUid: string | undefined;
  onLoad: (karakter: Karakter, undo: any[]) => void;
  onDelete: (uid: string, név: string) => void;
  onShare: (uid: string) => void;
  onSaveFile: (uid: string) => void;
  onShareFile: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onFileLoad: () => void;
  onNew: () => void;
  onSave: () => void;
  newDisabled: boolean;
  onTest: () => void;
  onFullscreenHint: () => void;
  onClose: () => void;
}

export function SlotList({ activeUid, onLoad, onDelete, onShare, onSaveFile, onShareFile, onDuplicate, onFileLoad, onNew, onSave, newDisabled, onTest, onFullscreenHint, onClose }: Props) {
  // Full backup / single save: show a spinner in place of the icon while the
  // (Windows) native save dialog is being prepared. The dialog stealing focus
  // fires window 'blur' → close the menu. Fallback timeout if blur never fires.
  // savingId: '__backup__' for the backup button, or a slot uid for its 💾.
  const [savingId, setSavingId] = useState<string | null>(null);
  const isSaving = savingId !== null;
  // Desktop = no Web Share API → direct download → OS save dialog (has the lag).
  const isDesktop = typeof navigator.share !== 'function';
  const canShare = typeof navigator.share === 'function';
  useEffect(() => {
    if (!savingId) return;
    const finish = () => onClose();
    window.addEventListener('blur', finish, { once: true });
    const t = setTimeout(finish, 8000);
    return () => { window.removeEventListener('blur', finish); clearTimeout(t); };
  }, [savingId, onClose]);

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

  /** Save a slot to file. On desktop: show spinner (native dialog lag), let it paint before triggering download. */
  function saveSlot(uid: string) {
    if (!isDesktop) { onSaveFile(uid); return; }
    if (isSaving) return;
    setSavingId(uid);
    // WORKAROUND: double-rAF-paint — ensures spinner paints before blocking native file dialog
    requestAnimationFrame(() => requestAnimationFrame(() => onSaveFile(uid)));
  }

  function renderSlot(s: SlotEntry) {
    return (
      <SlotRow
        key={s.uid}
        slot={s}
        active={activeUid === s.uid}
        savingId={savingId}
        canShare={canShare}
        onLoad={loadSlot}
        onShare={onShare}
        onSaveSlot={saveSlot}
        onShareFile={onShareFile}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    );
  }

  return (
    <>
      <div className="slot-actions slot-actions-top">
        <button className={`menu-item slot-file-btn${newDisabled ? ' is-disabled' : ''}`} aria-disabled={newDisabled} title="Új karakter" onClick={() => { if (!newDisabled) onNew(); }}>📄</button>
        <button className="menu-item slot-file-btn" title="Betöltés fájlból" onClick={onFileLoad}>📁</button>
        <button className={`menu-item slot-file-btn${newDisabled ? ' is-disabled' : ''}`} aria-disabled={newDisabled || isSaving} title="Összes karakter mentése"
          onClick={() => {
            if (newDisabled || isSaving) return;
            setSavingId('__backup__');
            // WORKAROUND: double-rAF-paint — ensures spinner paints before blocking save dialog
            requestAnimationFrame(() => requestAnimationFrame(() => onSave()));
          }}>{savingId === '__backup__' ? <span className="slot-btn-spinner" /> : '📦'}</button>
      </div>
      <div className="slot-list">
        {slots.length === 0 && <span className="slot-empty">Nincs mentett karakter</span>}
        {(() => {
          const jkRows = slots.filter(s => s.jk !== false);
          const njkRows = slots.filter(s => s.jk === false);
          // Szekció-fejlécek csak akkor, ha van legalább 1 NJK; különben sima lista.
          if (njkRows.length === 0) return jkRows.map(s => renderSlot(s));
          return [
            { title: 'Játékos karakterek', rows: jkRows },
            { title: 'Nem Játékos karakterek', rows: njkRows },
          ].map(section => section.rows.length > 0 && (
            <div key={section.title} className="slot-section">
              <div className="slot-section-title">{section.title}</div>
              {section.rows.map(s => renderSlot(s))}
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
    </>
  );
}
