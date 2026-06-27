import type { AktivBaseProps } from './types';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/helpers';
import { buildFegyverOpciók } from './AktivHelpers';
import { UgyesebbKezSelect } from './UgyesebbKezSelect';
import { GyengebbKezSelect } from './GyengebbKezSelect';
import { SessionToggles } from './SessionToggles';

// --- Helpers ---

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

// --- Props ---

interface Props extends AktivBaseProps {
  onShowFegyverfogás: () => void;
}

// --- Main Component ---

export function AktivFegyverSection({ data, karakter, session, setSession, pushUndo, onShowFegyverfogás }: Props) {
  const fegyverOpciók = buildFegyverOpciók(karakter, data);

  return (
    <div className="aktiv-bottom-section">
      <div className="aktiv-fegyver-row">
        <UgyesebbKezSelect data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} fegyverOpciók={fegyverOpciók} />
        {session.fegyverfogás !== 'egyfegyveres' && (
          <GyengebbKezSelect data={data} karakter={karakter} session={session} setSession={setSession} fegyverOpciók={fegyverOpciók} />
        )}
      </div>
      <div className="aktiv-fegyver-row">
        <SessionToggles data={data} karakter={karakter} session={session} setSession={setSession} />
        <FegyverfogásButton data={data} karakter={karakter} session={session} onShowFegyverfogás={onShowFegyverfogás} />
        <PáncélToggle session={session} setSession={setSession} pushUndo={pushUndo} />
      </div>
    </div>
  );
}

// --- Inline sub-components (small, no need for own file) ---

function FegyverfogásButton({ data, karakter, session, onShowFegyverfogás }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session'> & { onShowFegyverfogás: () => void }) {
  const opciók = data.konstansok.fegyverfogás_opciók as { id: string; név: string }[];
  const aktívNév = opciók.find(o => o.id === session.fegyverfogás)?.név ?? 'Egyfegyveres';
  const disabled = !hasMásikFegyverfogás(data, karakter, session);

  return (
    <div className={`aktiv-field-btn ${disabled ? 'disabled' : ''}`}
      onClick={() => { if (!disabled) onShowFegyverfogás(); }}>
      <span className="aktiv-field-label">Fegyverfogás</span>
      <strong>{aktívNév}</strong>
    </div>
  );
}

function PáncélToggle({ session, setSession, pushUndo }: Pick<AktivBaseProps, 'session' | 'setSession' | 'pushUndo'>) {
  return (
    <div className={`aktiv-field-btn aktiv-field-toggle ${session.aktív_páncél ? 'on' : ''}`}
      onClick={() => { pushUndo(`Páncél: ${!session.aktív_páncél ? 'Igen' : 'Nem'}`); setSession(s => ({ ...s, aktív_páncél: !s.aktív_páncél })); }}>
      <span className="aktiv-field-label">Páncél viselve</span>
      <strong>{session.aktív_páncél ? 'Igen' : 'Nem'}</strong>
    </div>
  );
}
