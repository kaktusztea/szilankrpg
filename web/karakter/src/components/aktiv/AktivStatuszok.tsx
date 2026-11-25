import { Ikon } from '../common/Ikon';
import { useRef, useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Session, UndoPatch } from '../../engine/types';
import { fmtHatás, fmtHatásSzöveg } from '../formatters';
import { StatuszPickerOverlay } from './StatuszPickerOverlay';
import { PickerOverlay } from '../picker/PickerOverlay';
import type { StátuszPerElem } from './aktiv-calc';
import { előnyHátrányLabel } from '../../engine/dice';
import { státuszDef } from '../../engine/lookup';
import { parseStátusz, státuszKulcs, státuszCímke } from '../../engine/statusz';

interface Props {
  data: GameData;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  státuszPerElem: StátuszPerElem[];
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
            disabled={data.statuszok.every(s => !s.többszörös && session.aktív_státuszok.some(st => parseStátusz(st)?.id === s.id))}
            onClick={() => setShowPicker(true)}>+</button>
        </h3>
        {session.aktív_státuszok.map((st, i) => {
          const p = parseStátusz(st);
          if (!p) return null;
          const def = státuszDef(data, p.id);
          const maxFok = def?.fokok.length ?? 1;
          const alcím = def?.fokok.find(f => f.fok === p.fok)?.alcím;
          const locked = p.id === 'sérült';   // az ÉP-rubrikák vezérlik (useSérültStátusz)
          const perElem = státuszPerElem.find(s => s.név === st);
          const clickable = !locked && maxFok > 1;
          return (
            <div key={i} className={`item-row aktiv-statusz-item${clickable ? ' aktiv-statusz-row-clickable' : ''}`} onClick={() => {
              if (!clickable) return;
              const új = státuszKulcs({ ...p, fok: (p.fok % maxFok) + 1 });
              pushUndo(`Státusz fok: ${új}`, [{ field: 'session', prev: session }]);
              setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.map((v, j) => j === i ? új : v) }));
            }}>
              <span className="aktiv-flex-1">
                <strong className="aktiv-statusz-name">{státuszCímke(def, p)}{alcím ? ` - ${alcím}` : ''}:</strong>
                {perElem && perElem.hatások.length > 0 && <span> {perElem.hatások.map((h, j) => {
                  const txt = fmtHatás(h, eseményNév);
                  return txt ? <span key={j}>{j > 0 ? ', ' : ''}{fmtHatásSzöveg(txt)}</span> : null;
                })}</span>}
              </span>
              {!locked && <button className="item-delete" onClick={e => {
                e.stopPropagation();
                pushUndo(`Státusz−: ${session.aktív_státuszok[i]}`, [{ field: 'session', prev: session }]);
                setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.filter((_, j) => j !== i) }));
              }}><Ikon név="bezár" /></button>}
            </div>
          );
        })}
        {session.narratív_módosítók.map((nm, i) => (
          <div key={`nar${i}`} className="item-row aktiv-statusz-item">
            <span className="aktiv-flex-1">
              <strong className="aktiv-statusz-name">{nm.szöveg}:</strong>
              <span> {fmtHatásSzöveg(előnyHátrányLabel(nm.érték ?? 0))}</span>
            </span>
            <button className="item-delete" onClick={() => {
              pushUndo(`Narratív−: ${nm.szöveg}`, [{ field: 'session', prev: session }]);
              setSession(s => ({ ...s, narratív_módosítók: s.narratív_módosítók.filter((_, j) => j !== i) }));
            }}><Ikon név="bezár" /></button>
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
