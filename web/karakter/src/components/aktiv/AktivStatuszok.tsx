import { useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';
import { fmtHatás } from '../formatters';
import { StatuszPickerOverlay } from './StatuszPickerOverlay';

interface Props {
  data: GameData;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  státuszPerElem: { név: string; hatások: any[] }[];
  eseményNév: (id: string) => string;
}

export function AktivStatuszok({ data, session, setSession, pushUndo, státuszPerElem, eseményNév }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div className="aktiv-section aktiv-section-statuszok">
        <span className="aktiv-label">Státuszok
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            disabled={data.statuszok.every(s => s.többszörös || session.aktív_státuszok.some(st => st.startsWith(s.név + ' (')))}
            onClick={() => setShowPicker(true)}>+</button>
        </span>
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
            <div key={i} className={`kep-row${clickable ? ' aktiv-statusz-row-clickable' : ''}`} onClick={() => {
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
              {!locked && <button className="fort-delete" onClick={e => {
                e.stopPropagation();
                pushUndo(`Státusz−: ${session.aktív_státuszok[i]}`, [{ field: 'session', prev: session }]);
                setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.filter((_, j) => j !== i) }));
              }}>✕</button>}
            </div>
          );
        })}
      </div>

      {showPicker && (
        <StatuszPickerOverlay
          data={data} session={session}
          onPick={fullName => {
            pushUndo(`Státusz: ${fullName}`, [{ field: 'session', prev: session }]);
            setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, fullName] }));
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
