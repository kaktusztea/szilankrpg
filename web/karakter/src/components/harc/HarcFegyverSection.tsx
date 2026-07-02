import type { HarcBaseProps } from './types';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';
import { buildFegyverOpciók } from './fegyver-helpers';
import { UgyesebbKezSelect } from './UgyesebbKezSelect';
import { GyengebbKezSelect } from './GyengebbKezSelect';
import { SessionToggles } from './SessionToggles';

function hasMásikFegyverfogás(data: GameData, karakter: Karakter, session: Session): boolean {
  const opciók = data.konstansok.fegyverfogás_opciók as { id: string }[];
  const aktív = session.fegyverfogás || 'egyfegyveres';
  const jobbIdx = session.aktív_fegyver_index;
  const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
  if (!jobbFp || jobbFp.alap.toLowerCase() === 'puszta kéz') return false;

  const jobbDef = lookupFegyver(data.fegyverek, jobbFp.alap);
  const kétkezes = jobbDef?.['Forgatás módja'] === 'kétkezes';

  return opciók.some(opt => {
    if (opt.id === aktív) return false;
    if (kétkezes && opt.id !== 'egyfegyveres') return false;
    if (opt.id === 'fegyver_pajzs') return !!karakter.pajzs?.méret;
    if (opt.id === 'fegyver_hárító') {
      return karakter.fegyverek.some(fp => lookupFegyver(data.fegyverek, fp.alap)?.['Hárító'] === '1')
        && karakter.fortélyok.some(f => f.név === 'Hárítófegyver használat' && f.fok > 0);
    }
    if (opt.id === 'kétkezes') {
      if (kétkezes || karakter.fegyverek.length < 2) return false;
      return karakter.fegyverek.some((fp, i) => i !== jobbIdx && lookupFegyver(data.fegyverek, fp.alap)?.Hárító !== '1');
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
        <PáncélToggle session={session} setSession={setSession} pushUndo={pushUndo} />
      </div>
    </div>
  );
}

function FegyverfogásButton({ data, karakter, session, onShowFegyverfogás }: Pick<HarcBaseProps, 'data' | 'karakter' | 'session'> & { onShowFegyverfogás: () => void }) {
  const opciók = data.konstansok.fegyverfogás_opciók as { id: string; név: string }[];
  const aktívNév = opciók.find(o => o.id === session.fegyverfogás)?.név ?? 'Egyfegyveres';
  const disabled = !hasMásikFegyverfogás(data, karakter, session);

  return (
    <div className={`aktiv-field-btn${disabled ? ' disabled' : ''}`}
      onClick={() => { if (!disabled) onShowFegyverfogás(); }}>
      <span className="aktiv-field-label">Fegyverfogás</span>
      <strong>{aktívNév}</strong>
    </div>
  );
}

function PáncélToggle({ session, setSession, pushUndo }: Pick<HarcBaseProps, 'session' | 'setSession' | 'pushUndo'>) {
  return (
    <div className={`aktiv-field-btn aktiv-field-toggle${session.aktív_páncél ? ' on' : ''}`}
      onClick={() => { pushUndo(`Páncél: ${!session.aktív_páncél ? 'Igen' : 'Nem'}`, [{ field: 'session', prev: session }]); setSession(s => ({ ...s, aktív_páncél: !s.aktív_páncél })); }}>
      <span className="aktiv-field-label">Páncél viselve</span>
      <strong>{session.aktív_páncél ? 'Igen' : 'Nem'}</strong>
    </div>
  );
}
