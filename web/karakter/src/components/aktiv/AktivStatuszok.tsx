import { useRef, useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';
import { fmtHatás } from '../formatters';
import { StatuszPickerOverlay } from './StatuszPickerOverlay';
import { PickerOverlay } from './PickerOverlay';

interface Props {
  data: GameData;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  státuszPerElem: { név: string; hatások: any[] }[];
  eseményNév: (id: string) => string;
}

const NARRATÍV_ÉRTÉKEK = [
  { v: -2, l: 'Hátrány-2' },
  { v: -1, l: 'Hátrány-1' },
  { v: 1, l: 'Előny+1' },
  { v: 2, l: 'Előny+2' },
] as const;

export function AktivStatuszok({ data, session, setSession, pushUndo, státuszPerElem, eseményNév }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [showNarratív, setShowNarratív] = useState(false);
  const [narÉrték, setNarÉrték] = useState<number | undefined>(undefined);
  const narInputRef = useRef<HTMLInputElement>(null);

  function submitNarratív(szöveg: string) {
    if (!szöveg || narÉrték === undefined) return;
    pushUndo(`Narratív: ${szöveg}`, [{ field: 'session', prev: session }]);
    setSession(s => ({ ...s, narratív_módosítók: [...s.narratív_módosítók, { szöveg, érték: narÉrték }] }));
    setShowNarratív(false);
    setNarÉrték(undefined);
  }

  return (
    <>
      <div className="aktiv-section aktiv-section-statuszok">
        <h3>Státuszok
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            disabled={data.statuszok.every(s => s.többszörös || session.aktív_státuszok.some(st => st.startsWith(s.név + ' (')))}
            onClick={() => setShowPicker(true)}>+</button>
        </h3>
        {session.aktív_státuszok.map((st, i) => {
          const match = st.match(/^(.+) \((\d+)\)$/);
          const stNév = match?.[1] ?? st;
          const stFok = match ? parseInt(match[2]) : 1;
          const baseName = stNév.includes(': ') ? stNév.split(': ')[0] : stNév;
          const def = data.statuszok.find(s => s.név === baseName);
          const maxFok = def?.fokok.length ?? 1;
          const alcím = def?.fokok.find(f => f.fok === stFok)?.alcím;
          const locked = baseName === 'Sérült';
          const perElem = státuszPerElem.find(s => s.név === stNév || s.név === `${stNév} (${stFok})`);
          const clickable = !locked && maxFok > 1;
          return (
            <div key={i} className={`item-row${clickable ? ' aktiv-statusz-row-clickable' : ''}`} onClick={() => {
              if (!clickable) return;
              const újFok = (stFok % maxFok) + 1;
              setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.map((v, j) => j === i ? `${stNév} (${újFok})` : v) }));
            }}>
              <span className="aktiv-flex-1">
                <strong className="aktiv-statusz-name">{stNév} ({stFok}){alcím ? ` - ${alcím}` : ''}:</strong>
                {perElem && perElem.hatások.length > 0 && <span> {perElem.hatások.map((h, j) => {
                  const txt = fmtHatás(h, eseményNév);
                  return txt ? <span key={j}>{j > 0 ? ', ' : ''}{txt}</span> : null;
                })}</span>}
              </span>
              {!locked && <button className="item-delete" onClick={e => {
                e.stopPropagation();
                pushUndo(`Státusz−: ${session.aktív_státuszok[i]}`, [{ field: 'session', prev: session }]);
                setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.filter((_, j) => j !== i) }));
              }}>✕</button>}
            </div>
          );
        })}
        {session.narratív_módosítók.map((nm, i) => (
          <div key={`nar${i}`} className="item-row">
            <span className="aktiv-flex-1">
              <strong className="aktiv-statusz-name">{nm.szöveg}:</strong>
              <span> {(nm.érték ?? 0) > 0 ? `Előny+${nm.érték}` : `Hátrány${nm.érték}`}</span>
            </span>
            <button className="item-delete" onClick={() => {
              pushUndo(`Narratív−: ${nm.szöveg}`, [{ field: 'session', prev: session }]);
              setSession(s => ({ ...s, narratív_módosítók: s.narratív_módosítók.filter((_, j) => j !== i) }));
            }}>✕</button>
          </div>
        ))}
      </div>

      {showPicker && (
        <StatuszPickerOverlay
          data={data} session={session}
          onPick={fullName => {
            pushUndo(`Státusz: ${fullName}`, [{ field: 'session', prev: session }]);
            setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, fullName] }));
            setShowPicker(false);
          }}
          onNarratív={() => { setShowPicker(false); setShowNarratív(true); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showNarratív && (
        <PickerOverlay title="Narratív Előny/Hátrány" onClose={() => setShowNarratív(false)}>
          <div className="narrativ-popup-content">
            <div className="narrativ-popup-btns">
              {NARRATÍV_ÉRTÉKEK.map(b => (
                <button key={b.v} onClick={() => setNarÉrték(b.v)}
                  className={`narrativ-val-btn${narÉrték === b.v ? ' selected' : ''}${b.v > 0 ? ' narrativ-val-pos' : ' narrativ-val-neg'}`}>
                  {b.l}
                </button>
              ))}
            </div>
            <input className="field-input narrativ-input narrativ-input-full" placeholder="Leírás..." maxLength={40}
              ref={narInputRef}
              onKeyDown={e => { if (e.key === 'Enter') submitNarratív((e.target as HTMLInputElement).value.trim()); }} />
            <button className="narrativ-add-btn narrativ-add-btn-center" disabled={narÉrték === undefined} onClick={() => {
              submitNarratív(narInputRef.current?.value.trim() ?? '');
            }}>OK</button>
          </div>
        </PickerOverlay>
      )}
    </>
  );
}
