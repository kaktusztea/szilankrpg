import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, AktívTaktika } from '../../engine/types';
import { fmtHatás } from '../formatters';
import { isTaktikaAllowed, getTaktikaMods } from './AktivHelpers';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string) => void;
  taktikaHatásPerElem: any[];
  eseményNév: (id: string) => string;
}

export function AktivTaktikak({ data, karakter, session, setSession, pushUndo, taktikaHatásPerElem, eseményNév }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [fokválasztó, setFokválasztó] = useState<string | null>(null);

  function addTaktika(név: string) {
    const def = data.taktikak.find(t => t.név === név);
    if (!def) return;
    pushUndo(`Taktika: ${név}`);
    const entry: AktívTaktika = { név, fok: def.fokozatos ? 1 : undefined };
    setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, entry] }));
  }

  function removeTaktika(idx: number) {
    pushUndo(`Taktika−: ${session.aktív_taktikák[idx]?.név}`);
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.filter((_, i) => i !== idx) }));
  }

  function setTaktikaFok(idx: number, fok: number) {
    pushUndo(`Taktika: ${session.aktív_taktikák[idx]?.név} fok→${fok}`);
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.map((t, i) => i === idx ? { ...t, fok } : t) }));
  }

  function renderFokok() {
    if (!fokválasztó) return null;
    const def = data.taktikak.find(t => t.név === fokválasztó);
    if (!def?.fokok) return null;
    const existing = session.aktív_taktikák.findIndex(a => a.név === fokválasztó);
    let fokok = [...def.fokok];
    if (def.fortély_bővítés) {
      const fb = def.fortély_bővítés;
      const fortélyFok = karakter.fortélyok.find(f => f.név === fb.fortély)?.fok ?? 0;
      const extraFokok = fortélyFok * fb.extra_fokok_per_fok;
      const utolsó = def.fokok[def.fokok.length - 1];
      const perFok: Record<string, number> = {};
      for (const [k, v] of Object.entries(utolsó)) {
        if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') perFok[k] = v / utolsó.fok;
      }
      for (let i = 1; i <= extraFokok; i++) {
        const newFok = utolsó.fok + i;
        const entry: any = { fok: newFok };
        for (const [k, step] of Object.entries(perFok)) entry[k] = Math.round(step * newFok);
        fokok.push(entry);
      }
    }
    return fokok.map(f => (
      <div key={f.fok} className={`aktiv-picker-item ${existing >= 0 && session.aktív_taktikák[existing].fok === f.fok ? 'active' : ''}`} onClick={() => {
        if (existing >= 0) setTaktikaFok(existing, f.fok);
        else setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, { név: fokválasztó!, fok: f.fok }] }));
        setShowPicker(false); setFokválasztó(null);
      }}>
        <span className="aktiv-picker-item-name">{f.fok}. fok{def!.fokok && f.fok > def!.fokok[def!.fokok.length - 1].fok && <span className="aktiv-extra-fok-dot">●</span>}</span>
        <span className="aktiv-picker-item-details">{Object.entries(f)
          .filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0)
          .map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(', ')}</span>
        {f.hatások && f.hatások.length > 0 && <span className="aktiv-picker-item-hatas">{f.hatások.map((h: any) => h.megjegyzés || `${h.operátor} ${h.érték ?? ''} ${h.cél}`).join(', ')}</span>}
      </div>
    ));
  }

  const konstansok = data.konstansok;

  return (
    <>
      <div className="aktiv-section aktiv-section-sm">
        <span className="aktiv-label">Taktikák
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            disabled={data.taktikak.every(t => session.aktív_taktikák.some(a => a.név === t.név) || !isTaktikaAllowed(t.név, session, karakter, data))}
            onClick={() => setShowPicker(true)}>+</button>
        </span>
        {session.aktív_taktikák.map((t, i) => {
          const def = data.taktikak.find(d => d.név === t.név);
          const mods = getTaktikaMods(t, data);
          return (
            <div key={i} className={`kep-row${def?.fokozatos ? ' aktiv-taktika-row-clickable' : ''}`} onClick={() => { if (def?.fokozatos) { setFokválasztó(t.név); setShowPicker(true); } }}>
              <span className="aktiv-flex-1">
                <strong className="aktiv-taktika-name">{t.név}{t.fok != null ? ` (${t.fok})` : ''}:</strong>
                {mods.length > 0 && <span className="aktiv-taktika-mods"> {mods.join(', ')} ✔</span>}
                {def?.megjegyzés && <span className="aktiv-taktika-note"> • {def.megjegyzés}</span>}
              </span>
              <button className="fort-delete" onClick={e => { e.stopPropagation(); removeTaktika(i); }}>✕</button>
            </div>
          );
        })}
        {taktikaHatásPerElem.map((t, i) => (
          <div key={`th${i}`} className="kep-row aktiv-sub-row">
            <span className="aktiv-flex-1">
              <strong className="aktiv-taktika-name">{t.név}:</strong>{' '}
              {t.hatások.map((h: any, j: number) => {
                const txt = fmtHatás({ operátor: h.hatás ?? h.operátor, cél: h.cél, érték: h.érték, megjegyzés: h.megjegyzés }, eseményNév);
                return txt ? <span key={j}>{j > 0 ? ', ' : ''}{txt}</span> : null;
              })}
            </span>
          </div>
        ))}
      </div>

      {showPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { setShowPicker(false); setFokválasztó(null); } }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>{fokválasztó ? `${fokválasztó} — fok választó` : 'Taktika választó'}</label>
            </div>
            <div className="aktiv-picker-list">
              {!fokválasztó && data.taktikak.filter(t => !session.aktív_taktikák.some(a => a.név === t.név) && isTaktikaAllowed(t.név, session, karakter, data)).sort((a, b) => {
                const pinned = (konstansok.pinned_taktikák ?? []) as string[];
                const aPin = pinned.indexOf(a.név);
                const bPin = pinned.indexOf(b.név);
                if (aPin >= 0 && bPin >= 0) return aPin - bPin;
                if (aPin >= 0) return -1;
                if (bPin >= 0) return 1;
                return a.név.localeCompare(b.név, 'hu');
              }).map(t => (
                <div key={t.név} className="aktiv-picker-item" onClick={() => {
                  if (t.fokozatos) setFokválasztó(t.név);
                  else { addTaktika(t.név); setShowPicker(false); }
                }}>
                  <span className="aktiv-picker-item-name">{t.név}{t.fokozatos ? ` 📶` : ''}</span>
                  <span className="aktiv-picker-item-details">
                    {t.fokozatos && t.fokok
                      ? t.fokok.map((f: any) => `${f.fok}: ${Object.entries(f)
                          .filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0)
                          .map(([k, v]) => `${k}:${v}`).join(', ')}`).join(' | ')
                      : t.módosítók ? Object.entries(t.módosítók).filter(([, v]) => v !== 0).map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(', ') : ''}
                  </span>
                  {t.megjegyzés && <span className="aktiv-picker-item-hatas">{t.megjegyzés}</span>}
                </div>
              ))}
              {fokválasztó && renderFokok()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
