import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { KepzettsegRowProps } from './types';
import { KepzettsegInfoPanel } from '../KepzettsegInfoPanel';

export function KepzettsegRow({
  slot, gameMode, onSzintChange, onRemove,
  kiterjesztesek, infoOpen, onInfoToggle,
  displayName, findDef, overLimit, warning, felvettFortelyok
}: KepzettsegRowProps) {
  const [szintEditing, setSzintEditing] = useState(false);

  useEffect(() => {
    if (!szintEditing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSzintEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [szintEditing]);

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (gameMode) { onInfoToggle(); return; }
    const row = e.currentTarget;
    const delBtn = row.querySelector('.kep-delete') as HTMLElement | null;
    if (delBtn) {
      const btnRect = delBtn.getBoundingClientRect();
      if (e.clientX >= btnRect.left - 25) return;
    }
    setSzintEditing(true);
  }

  const def = findDef(slot.név);

  return (
    <div className="kep-row-wrapper">
      <div className="kep-row" data-kep={slot.név} onClick={handleTap}>
        <span className={`kep-név${overLimit || warning ? ' kep-over' : ''}`}>{displayName}</span>
        <span className="kep-right">
          {!gameMode && (
            <button className="kep-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`kep-szint ${slot.szint === 0 ? 'kep-szint-zero' : slot.szint >= 9 ? 'kep-szint-high' : ''}${overLimit ? ' kep-over' : ''}`}>{slot.szint}</span>
        </span>
      </div>

      {gameMode && infoOpen && def && (
        <KepzettsegInfoPanel def={def} kit={kiterjesztesek[slot.név] || []} felvettFortelyok={felvettFortelyok} />
      )}

      {szintEditing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{displayName} — szint:</label>
            <div className="kep-szint-grid">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                <button key={n} className={`fort-fok-btn ${slot.szint === n ? 'active' : ''}`} onClick={() => { onSzintChange(n); setSzintEditing(false); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
