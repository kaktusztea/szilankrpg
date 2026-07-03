import { useState } from 'react';
import type { FortelyRowProps } from './types';
import { displayName, checkKövetelmények } from './helpers';
import { FortelyInfoPanel } from './FortelyInfoPanel';
import { PopupOverlay } from '../PopupOverlay';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';

export function FortelyRow({
  slot, def, gameMode, isOpen, onToggleInfo, onFokChange, onRemove,
  isIngyenes, locked, onHint, overLimit, nyelvPontKeret, nyelvFokLabels,
  képzettségek, fortélyok, harcmodorNevek, távfegyverNevek, fegyverHarcmodorNév
}: FortelyRowProps) {
  const [editing, setEditing] = useState(false);
  const maxfok = def?.maxfok ?? 1;

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (gameMode) { onToggleInfo(); return; }
    const row = e.currentTarget;
    const delBtn = row.querySelector('.fort-delete') as HTMLElement | null;
    if (delBtn) {
      const btnRect = delBtn.getBoundingClientRect();
      if (e.clientX >= btnRect.left - 25) return;
    }
    if (locked) {
      onHint(távfegyverNevek.includes(slot.spec_elem) ? 'Ezt a fortélyt a Távharc fülön kezeld!' : 'Ezt a fortélyt a Harcértékek fülön kezeld!', 3000);
    } else if (maxfok <= 1) {
      onHint('1 fok a maximum');
    } else {
      setEditing(true);
    }
  }

  const fokDef = def?.fokok.find(f => f.fok === slot.fok);
  const label = displayName(slot);
  const giftBadge = def && def.kp_perfok < 0 ? ` 🎁${Math.abs(def.kp_perfok * slot.fok)}KP` : '';
  const hiányzóKöv = checkKövetelmények(fokDef, képzettségek, fortélyok, harcmodorNevek, fegyverHarcmodorNév);
  const követelményHiba = hiányzóKöv.length > 0;
  const isNyelv = slot.név === 'Nyelvismeret';

  return (
    <div className="fort-row-wrapper">
      <div className={`fort-row${követelményHiba ? ' fort-kov-hiba' : ''}`} onClick={handleTap}>
        <span className={`fort-név${overLimit ? ' fort-over' : ''}`}>
          {label}{isIngyenes && !slot.kiérdemelt ? <span className="fort-ingyenes-dot">●</span> : ''}{giftBadge && <span className="fort-gift">{giftBadge}</span>}
        </span>
        <span className="fort-right">
          {!gameMode && !locked && (
            <button className="fort-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`fort-fok${isNyelv ? ' nyelvismeret-fok' : ''}${overLimit ? ' fort-over' : ''}`}>
            {isNyelv ? nyelvFokLabels[slot.fok] ?? slot.fok : (
              <span className="fort-fok-dots">
                {Array.from({ length: MAX_FORTÉLY_FOK }, (_, i) => (
                  <span key={i} className={`fort-dot${i < slot.fok ? ' filled' : ''}${i >= maxfok ? ' fort-dot-hidden' : ''}`} />
                ))}
              </span>
            )}
          </span>
        </span>
      </div>

      {isOpen && def && (
        <FortelyInfoPanel
          def={def}
          fokDef={fokDef}
          kiterjesztiNormál={def.kiterjeszti_normál}
          kiterjesztiErős={def.kiterjeszti_erős}
          képzettségek={képzettségek}
        />
      )}

      {overLimit && isOpen && (
        <div className="fort-info fort-info-error">
          A felvehető Nyelvismeret fokok száma a Nyelvtanulás képzettség szintjétől függ. Túllépted a keretet! Max tanulható fok: {nyelvPontKeret ?? 0}
        </div>
      )}

      {követelményHiba && (
        <div className="fort-info fort-info-error">
          ⚠ Követelmény: {hiányzóKöv.join(', ')}
        </div>
      )}

      {editing && (
        <PopupOverlay onClose={() => setEditing(false)}>
          <label className={isNyelv ? 'fort-label-centered' : undefined}>
            {isNyelv ? label : `${label} — fok:`}
          </label>
          <div className="fort-fok-radios">
            {Array.from({ length: maxfok }, (_, i) => i + 1).map(f => (
              <button key={f}
                className={`fort-fok-btn ${slot.fok === f ? 'active' : ''}${isNyelv ? ' fort-fok-btn-wide' : ''}`}
                onClick={() => { onFokChange(f); setEditing(false); }}>
                {isNyelv ? nyelvFokLabels[f] ?? f : f}
              </button>
            ))}
          </div>
        </PopupOverlay>
      )}
    </div>
  );
}
