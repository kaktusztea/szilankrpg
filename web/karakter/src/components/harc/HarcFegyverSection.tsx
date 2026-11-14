import { useState } from 'react';
import type { HarcBaseProps } from './types';
import { kétkezesKövetelményHiány } from '../../engine/ketkezes';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { buildFegyverOpciók, kétkezesLehetséges, isHárító, isPusztaKéz } from '../../engine/harc/fegyver-helpers';
import { UgyesebbKezSelect } from './UgyesebbKezSelect';
import { GyengebbKezSelect } from './GyengebbKezSelect';
import { SessionToggles } from './SessionToggles';
import { lookupFegyver } from '../../engine/lookup';
import { buildPajzsFegyverNév, fortélyToggleAktív } from '../../engine/utils';

function hasMásikFegyverfogás(data: GameData, karakter: Karakter, session: Session): boolean {
  const opciók = data.konstansok.fegyverfogás_opciók as { id: string }[];
  const aktív = session.fegyverfogás || 'egyfegyveres';
  const jobbIdx = session.aktív_fegyver_index;
  const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
  if (!jobbFp || isPusztaKéz(jobbFp.alap)) return false;

  const jobbDef = lookupFegyver(data.fegyverek, jobbFp.alap);
  const kétkezes = jobbDef?.módok.some(m => m.Forgatás === 'kétkezes') ?? false;

  return opciók.some(opt => {
    if (opt.id === aktív) return false;
    if (kétkezes && opt.id !== 'egyfegyveres') return false;
    if (opt.id === 'fegyver_pajzs') return !!karakter.pajzs?.méret;
    if (opt.id === 'fegyver_hárító') {
      return karakter.fegyverek.some(fp => isHárító(lookupFegyver(data.fegyverek, fp.alap)))
        && karakter.fortélyok.some(f => f.id === 'hárítófegyver_használat' && f.fok > 0);
    }
    if (opt.id === 'kétkezes') {
      return kétkezesLehetséges(data, karakter, jobbIdx);
    }
    return true;
  });
}

interface Props extends Pick<HarcBaseProps, 'data' | 'karakter' | 'session' | 'setSession' | 'pushUndo'> {
  onShowFegyverfogás: () => void;
  páncélMGT: number;
  showHint: (msg: string) => void;
  gameMode?: boolean;
}

/** One-line summary of the weapon setup: "Jobb + Bal" and "Fogás · Páncél: Igen · H. akrobatika: Nem". */
function összegzés(data: GameData, karakter: Karakter, session: Session, fegyverOpciók: { név: string; idx: number }[]) {
  const név = (idx: number) => fegyverOpciók.find(f => f.idx === idx)?.név ?? 'Puszta kéz';
  const fogás = session.fegyverfogás || 'egyfegyveres';
  const bal = fogás === 'egyfegyveres' ? null
    : fogás === 'fegyver_pajzs' ? (buildPajzsFegyverNév(karakter) ?? 'Pajzs')
    : session.aktív_fegyver_bal_index >= 0 ? név(session.aktív_fegyver_bal_index) : null;
  const fegyverek = bal ? `${név(session.aktív_fegyver_index)} + ${bal}` : név(session.aktív_fegyver_index);

  const opciók = data.konstansok.fegyverfogás_opciók as { id: string; név: string }[];
  const részek = [opciók.find(o => o.id === fogás)?.név ?? 'Egyfegyveres'];
  if (karakter.páncél.alap) részek.push(`Páncél: ${session.aktív_páncél ? 'Igen' : 'Nem'}`);
  // Session toggles the character actually has (SessionToggles stays mounted, so a disabled toggle is already forced off)
  for (const tf of data.fortelySummaries.filter(d => d.session_toggle)) {
    if (!karakter.fortélyok.some(f => f.id === tf.id && f.fok > 0)) continue;
    const rövid = tf.név.length > 14 ? tf.név.replace('Harci ', 'H. ') : tf.név;
    részek.push(`${rövid}: ${fortélyToggleAktív(session, tf.id) ? 'Igen' : 'Nem'}`);
  }
  return { fegyverek, részlet: részek.join(' · ') };
}

export function HarcFegyverSection({ data, karakter, session, setSession, pushUndo, onShowFegyverfogás, páncélMGT, showHint, gameMode }: Props) {
  const fegyverOpciók = buildFegyverOpciók(karakter, data);
  // Game mode on mobile: the setup rows collapse into a tappable summary line (CSS hides it on desktop).
  const [kinyitva, setKinyitva] = useState(false);
  const összecsukva = !!gameMode && !kinyitva;
  const össz = gameMode ? összegzés(data, karakter, session, fegyverOpciók) : null;

  // Kétkezes harc fortély harcmodor-követelményei a kézben lévő fegyverpárra (figyelmeztetés, nem tilt).
  const kétkezesHiány = kétkezesKövetelményHiány(karakter, session, data);

  return (
    <div className={`harc-fegyver-section${összecsukva ? ' osszecsukva' : ''}`}>
      {össz && (
        <button type="button" className="harc-fegyver-osszegzo" aria-expanded={kinyitva} onClick={() => setKinyitva(k => !k)}>
          <span className="harc-fegyver-osszegzo-szoveg">
            <span className="harc-fegyver-osszegzo-fegyver">{össz.fegyverek}</span>
            <span className="harc-fegyver-osszegzo-reszlet">{össz.részlet}</span>
          </span>
          <span className="harc-fegyver-osszegzo-nyil" aria-hidden="true">{kinyitva ? '▴' : '▾'}</span>
        </button>
      )}
      <div className="harc-fegyver-row">
        <UgyesebbKezSelect data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} fegyverOpciók={fegyverOpciók} />
        {session.fegyverfogás !== 'egyfegyveres' && (
          <GyengebbKezSelect data={data} karakter={karakter} session={session} setSession={setSession} fegyverOpciók={fegyverOpciók} />
        )}
      </div>
      <div className="harc-fegyver-row">
        <SessionToggles data={data} karakter={karakter} session={session} setSession={setSession} páncélMGT={páncélMGT} showHint={showHint} />
        <FegyverfogásButton data={data} karakter={karakter} session={session} onShowFegyverfogás={onShowFegyverfogás} />
        <PáncélToggle session={session} setSession={setSession} pushUndo={pushUndo} vanPáncél={!!karakter.páncél.alap} />
      </div>
      {kétkezesHiány.length > 0 && (
        <div className="harc-ketkezes-warning" role="status">
          ⚠ Kétkezes harc követelmény: {kétkezesHiány.join('; ')}
        </div>
      )}
    </div>
  );
}

function FegyverfogásButton({ data, karakter, session, onShowFegyverfogás }: Pick<HarcBaseProps, 'data' | 'karakter' | 'session'> & { onShowFegyverfogás: () => void }) {
  const opciók = data.konstansok.fegyverfogás_opciók as { id: string; név: string }[];
  const aktívNév = opciók.find(o => o.id === session.fegyverfogás)?.név ?? 'Egyfegyveres';
  const disabled = !hasMásikFegyverfogás(data, karakter, session);

  return (
    <button type="button" className={`aktiv-field-btn${disabled ? ' disabled' : ''}`} disabled={disabled} onClick={onShowFegyverfogás}>
      <span className="aktiv-field-label">Fegyverfogás</span>
      <strong>{aktívNév}</strong>
    </button>
  );
}

function PáncélToggle({ session, setSession, pushUndo, vanPáncél }: Pick<HarcBaseProps, 'session' | 'setSession' | 'pushUndo'> & { vanPáncél: boolean }) {
  // No armour structure ("- nincs -"): the chip is off and disabled; useFegyverInvalidation keeps aktív_páncél false.
  const on = vanPáncél && session.aktív_páncél;
  return (
    <button type="button" className={`aktiv-field-btn aktiv-field-toggle${on ? ' on' : ''}${vanPáncél ? '' : ' disabled'}`} aria-pressed={on}
      disabled={!vanPáncél} title={vanPáncél ? undefined : 'Nincs páncél (Harcértékek fül: Struktúra)'}
      onClick={() => { const next = { ...session, aktív_páncél: !session.aktív_páncél }; pushUndo(`Páncél: ${next.aktív_páncél ? 'Igen' : 'Nem'}`, [{ field: 'session', prev: session, ckey: 'aktív_páncél' }], next); setSession(s => ({ ...s, aktív_páncél: !s.aktív_páncél })); }}>
      <span className="aktiv-field-label">Páncél viselve</span>
      <strong>{on ? 'Igen' : 'Nem'}</strong>
    </button>
  );
}
