import type { HarcBaseProps } from './types';
import { kétkezesKövetelményHiány } from '../../engine/ketkezes';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { buildFegyverOpciók, kétkezesLehetséges, isHárító, isPusztaKéz } from '../../engine/harc/fegyver-helpers';
import { UgyesebbKezSelect } from './UgyesebbKezSelect';
import { GyengebbKezSelect } from './GyengebbKezSelect';
import { SessionToggles } from './SessionToggles';
import { lookupFegyver } from '../../engine/lookup';

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
}

export function HarcFegyverSection({ data, karakter, session, setSession, pushUndo, onShowFegyverfogás, páncélMGT, showHint }: Props) {
  const fegyverOpciók = buildFegyverOpciók(karakter, data);

  // Kétkezes harc fortély harcmodor-követelményei a kézben lévő fegyverpárra (figyelmeztetés, nem tilt).
  const kétkezesHiány = kétkezesKövetelményHiány(karakter, session, data);

  return (
    <div className="harc-fegyver-section">
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
