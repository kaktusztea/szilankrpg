import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FortelyRowProps } from './types';
import { displayName } from './helpers';
import { FortelyInfoPanel } from './FortelyInfoPanel';

export function FortelyRow({
  slot, def, gameMode, isOpen, onToggleInfo, onFokChange, onRemove,
  isIngyenes, locked, onHint, overLimit, nyelvPontKeret, nyelvFokLabels,
  képzettségek, fortélyok, harcmodorNevek, távfegyverNevek, fegyverHarcmodorNév
}: FortelyRowProps) {
  const [editing, setEditing] = useState(false);
  const maxfok = def?.maxfok ?? 1;

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing]);

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

  // Követelmény ellenőrzés
  const hiányzóKöv = checkKövetelmények(fokDef, képzettségek, fortélyok, harcmodorNevek, fegyverHarcmodorNév);
  const követelményHiba = hiányzóKöv.length > 0;

  return (
    <div className="fort-row-wrapper">
      <div className={`fort-row${követelményHiba ? ' fort-kov-hiba' : ''}`} onClick={handleTap}>
        <span className={`fort-név${overLimit ? ' fort-over' : ''}`}>
          {label}{isIngyenes && !slot.kiérdemelt ? <span className="fort-ingyenes-dot">●</span> : ''}
        </span>
        <span className="fort-right">
          {!gameMode && !locked && (
            <button className="fort-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`fort-fok ${slot.fok >= maxfok ? 'fort-fok-max' : ''}${overLimit ? ' fort-over' : ''}`}>
            {slot.név === 'Nyelvismeret' ? nyelvFokLabels[slot.fok] ?? slot.fok : (
              <span className="fort-fok-dots">
                {Array.from({ length: 3 }, (_, i) => (
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

      {editing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label style={slot.név === 'Nyelvismeret' ? { textAlign: 'center', width: '100%' } : undefined}>
              {slot.név === 'Nyelvismeret' ? label : `${label} — fok:`}
            </label>
            <div className="fort-fok-radios">
              {Array.from({ length: maxfok }, (_, i) => i + 1).map(f => (
                <button key={f}
                  className={`fort-fok-btn ${slot.fok === f ? 'active' : ''}${slot.név === 'Nyelvismeret' ? ' fort-fok-btn-wide' : ''}`}
                  onClick={() => { onFokChange(f); setEditing(false); }}>
                  {slot.név === 'Nyelvismeret' ? nyelvFokLabels[f] ?? f : f}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function checkKövetelmények(
  fokDef: { követelmények: { név: string | string[]; érték: number; típus: string }[] } | undefined,
  képzettségek: { név: string; szint: number }[],
  fortélyok: { név: string; fok: number }[],
  harcmodorNevek: string[],
  fegyverHarcmodorNév?: string
): string[] {
  if (!fokDef?.követelmények?.length) return [];
  const hiányzó: string[] = [];
  for (const kov of fokDef.követelmények) {
    if (kov.típus === 'képzettség') {
      const nevek = Array.isArray(kov.név) ? kov.név : [kov.név];
      const teljesül = nevek.some(n => (képzettségek.find(kp => kp.név.toLowerCase() === n.toLowerCase())?.szint ?? 0) >= kov.érték);
      if (!teljesül) {
        const isHarcmodor = Array.isArray(kov.név) && kov.név.every(n => harcmodorNevek.some(h => h.toLowerCase() === n.toLowerCase()));
        hiányzó.push(`${isHarcmodor ? (fegyverHarcmodorNév ? `Harcmodor - ${fegyverHarcmodorNév}` : 'Harcmodor') : (Array.isArray(kov.név) ? kov.név.join('/') : kov.név)} ≥ ${kov.érték}`);
      }
    } else if (kov.típus === 'fortély') {
      const név = Array.isArray(kov.név) ? kov.név[0] : kov.név;
      const megvan = fortélyok.some(f => f.név.toLowerCase() === név.toLowerCase() && f.fok >= kov.érték);
      if (!megvan) hiányzó.push(`${név} fortély ≥ ${kov.érték}. fok`);
    }
  }
  return hiányzó;
}
