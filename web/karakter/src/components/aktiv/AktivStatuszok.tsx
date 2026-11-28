import { Ikon } from '../common/Ikon';
import { useRef, useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, PushUndo, SetSession } from '../../engine/types';
import { kötelezőTaktikaSzinkron } from '../../engine/taktika/kotelezo-taktika';
import { hatásFeliratok, fmtHatásSzöveg } from '../formatters';
import { StatuszPickerOverlay } from './StatuszPickerOverlay';
import { PickerOverlay } from '../picker/PickerOverlay';
import type { StátuszPerElem } from './aktiv-calc';
import { előnyHátrányLabel } from '../../engine/dice';
import { státuszDef, képzettségDef } from '../../engine/lookup';
import { parseStátusz, státuszKulcs, státuszCímke, alcímCsakFok } from '../../engine/statusz';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: SetSession;
  pushUndo: PushUndo;
  státuszPerElem: StátuszPerElem[];
  eseményNév: (id: string) => string;
}

const NARRATÍV_ÉRTÉKEK = [
  { v: -2, l: 'Hátrány-2' },
  { v: -1, l: 'Hátrány-1' },
  { v: 1, l: 'Előny+1' },
  { v: 2, l: 'Előny+2' },
] as const;

export function AktivStatuszok({ data, karakter, session, setSession, pushUndo, státuszPerElem, eseményNév }: Props) {
  // Status list change + the taktikák it makes mandatory (Félelem → Védő (3) …): set / removed together
  const státuszVáltás = (f: (st: string[]) => string[]) =>
    setSession(s => kötelezőTaktikaSzinkron(s, { ...s, aktív_státuszok: f(s.aktív_státuszok) }, karakter, data));
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
          const fokDef = def?.fokok.find(f => f.fok === p.fok);
          const alcím = fokDef && !alcímCsakFok(fokDef) ? fokDef.alcím : undefined;
          const locked = p.id === 'sérült';   // az ÉP-rubrikák vezérlik (useSérültStátusz)
          const perElem = státuszPerElem.find(s => s.név === st);
          const clickable = !locked && maxFok > 1;
          return (
            <div key={i} className={`item-row aktiv-statusz-item${clickable ? ' aktiv-statusz-row-clickable' : ''}`} onClick={() => {
              if (!clickable) return;
              const új = státuszKulcs({ ...p, fok: (p.fok % maxFok) + 1 });
              pushUndo(`Státusz fok: ${új}`, [{ field: 'session', prev: session }]);
              státuszVáltás(a => a.map((v, j) => j === i ? új : v));
            }}>
              <span className="aktiv-flex-1">
                <strong className="aktiv-statusz-name">{státuszCímke(def, p)}{alcím ? ` - ${alcím}` : ''}</strong>
                {/* One effect per line (easier to read than a comma list) */}
                {perElem && perElem.hatások.length > 0 && <div className="aktiv-taktika-hatas aktiv-statusz-hatasok">{hatásFeliratok(perElem.hatások, eseményNév,
                  id => képzettségDef(data, id)?.név).map((txt, j) =>
                  <div key={j}>{fmtHatásSzöveg(txt)}</div>)}</div>}
              </span>
              {!locked && <button className="item-delete" onClick={e => {
                e.stopPropagation();
                pushUndo(`Státusz−: ${session.aktív_státuszok[i]}`, [{ field: 'session', prev: session }]);
                státuszVáltás(a => a.filter((_, j) => j !== i));
              }}><Ikon név="bezár" /></button>}
            </div>
          );
        })}
        {session.narratív_módosítók.map((nm, i) => (
          <div key={`nar${i}`} className="item-row aktiv-statusz-item">
            <span className="aktiv-flex-1">
              <strong className="aktiv-statusz-name">{nm.szöveg}</strong>
              <div className="aktiv-taktika-hatas">{fmtHatásSzöveg(előnyHátrányLabel(nm.érték ?? 0))}</div>
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
            státuszVáltás(a => [...a, fullName]);
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
