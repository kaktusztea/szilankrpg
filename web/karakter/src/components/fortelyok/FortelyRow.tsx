import { useState } from 'react';
import type { FortelyRowProps } from './types';
import { displayName, checkKövetelmények } from './helpers';
import { FortelyDetails } from '../FortelyDetails';
import { MdLink } from '../MdLink';
import { PopupOverlay } from '../PopupOverlay';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';

export function FortelyRow({
  slot, def, gameMode, isOpen, onToggleInfo, onFokChange, onRemove,
  isIngyenes, onHint, overLimit, nyelvPontKeret, nyelvFokLabels,
  képzettségek, fortélyok, harcmodorNevek, fegyverHarcmodorNév, kiterjesztHiányos
}: FortelyRowProps) {
  const [editing, setEditing] = useState(false);
  const maxfok = def?.maxfok ?? 1;

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (gameMode) { onToggleInfo(); return; }
    const row = e.currentTarget;
    const delBtn = row.querySelector('.item-delete') as HTMLElement | null;
    if (delBtn) {
      const btnRect = delBtn.getBoundingClientRect();
      if (e.clientX >= btnRect.left - 25) return;
    }
    if (maxfok <= 1) {
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
      <div className={`item-row${követelményHiba ? ' fort-kov-hiba' : ''}`} onClick={handleTap}>
        <span className={`fort-név${overLimit || kiterjesztHiányos ? ' fort-over' : ''}`}>
          {label}{isIngyenes && !slot.kiérdemelt ? <span className="fort-ingyenes-dot">●</span> : ''}{giftBadge && <span className="fort-gift">{giftBadge}</span>}
        </span>
        <span className="fort-right">
          {def?.md_fájl && <span className="fort-md-link" onClick={e => e.stopPropagation()}><MdLink mdFájl={def.md_fájl} /></span>}
          {!gameMode && (
            <button className="item-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
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
        <FortelyDetails
          def={def}
          fokDef={fokDef}
          képzettségek={képzettségek}
        />
      )}

      {isOpen && !def && slot.kiterjeszti && slot.kiterjeszti.length > 0 && (
        <div className="info-panel">
          <div className="info-panel-row">
            <span className="info-panel-label">Kiterjeszti:</span>{' '}
            <span className="info-panel-kit">
              {slot.kiterjeszti.map((kn, ki) => (
                <span key={ki} className={képzettségek.some(k => k.név === kn && k.szint >= 1) ? 'fort-req-met' : 'fort-req-unmet'}>{ki > 0 ? ', ' : ''}{kn}</span>
              ))}
            </span>
          </div>
        </div>
      )}

      {overLimit && isOpen && (
        <div className="info-panel info-panel-error">
          A felvehető Nyelvismeret fokok száma a Nyelvtanulás képzettség szintjétől függ. Túllépted a keretet! Max tanulható fok: {nyelvPontKeret ?? 0}
        </div>
      )}

      {követelményHiba && (
        <div className="info-panel info-panel-error">
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
