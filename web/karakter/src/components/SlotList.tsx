import { useState, useEffect } from 'react';
import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from '../engine/types';
import { validateKarakter } from '../engine/validate';
import { sanitizeUndo } from '../hooks/useUndo';
import { readSlots, type SlotEntry } from '../hooks/slot-utils';

function truncSlotName(név: string | undefined): string {
  const n = név || 'Névtelen';
  const vm = n.match(/ v(\d+)$/);
  const base = vm ? n.slice(0, -vm[0].length) : n;
  const truncated = base.length > 15 ? base.slice(0, 15) + '..' : base;
  return truncated + (vm ? ` v${vm[1]}` : '');
}

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
      if (validateKarakter(parsed)) {
        onLoad({ ...parsed, jk: parsed.jk ?? true, előtörténet: { ...DEFAULT_ELOTORTENET, ...parsed.előtörténet }, session: { ...DEFAULT_SESSION, ...parsed.session }, checkpoints: parsed.checkpoints || [] }, sanitizeUndo((parsed as any)._undo));
      }
    } catch { /* */ }
  }

  function renderSlot(s: SlotEntry) {
    return (
      <div key={s.uid} className={`slot-row ${activeUid === s.uid ? 'slot-row-active' : ''}`} onClick={() => loadSlot(s.uid)}>
        <div className="slot-row-top">
          <span className={`slot-name ${activeUid === s.uid ? 'slot-name-active' : ''}`}>
            {truncSlotName(s.név || s.becenév)} ({s.tsz || '?'}sz)
          </span>
        </div>
        <div className="slot-chips">
          <button className="slot-chip" title="Link másolása" onClick={e => { e.stopPropagation(); onShare(s.uid); }}>🔗</button>
          <button className="slot-chip" title="Mentés fájlba" onClick={e => {
            e.stopPropagation();
            if (!isDesktop) { onSaveFile(s.uid); return; }
            if (isSaving) return;
            setSavingId(s.uid);
            // Let the spinner paint before the download triggers the OS save dialog.
            requestAnimationFrame(() => requestAnimationFrame(() => onSaveFile(s.uid)));
          }}>{savingId === s.uid ? <span className="slot-btn-spinner" /> : '💾'}</button>
          {typeof navigator.share === 'function' && (
            <button className="slot-chip" title="Megosztás" onClick={e => { e.stopPropagation(); onShareFile(s.uid); }}>📤</button>
          )}
          <button className="slot-chip" title="Duplikál" onClick={e => { e.stopPropagation(); onDuplicate(s.uid); }}>⧉</button>
          <button className="slot-chip slot-chip-del" title="Törlés" onClick={e => { e.stopPropagation(); onDelete(s.uid, `${s.név || s.becenév || 'Névtelen'} (${s.tsz || '?'}sz)`); }}>✕</button>
        </div>
      </div>
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
            // Let the spinner paint before the (possibly blocking) save generation + dialog.
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
