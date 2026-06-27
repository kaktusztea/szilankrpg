import { useEffect } from 'react';
import type { AktivBaseProps } from './types';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/helpers';
import { buildFegyverOpciók } from './AktivHelpers';

// --- Helpers ---

function getPengehossz(data: GameData, alap: string): number {
  return parseFloat(lookupFegyver(data.fegyverek, alap)?.Pengehossz ?? '0') || 0;
}

/** Speciális elem (puszta kéz, pajzs) — nem valódi fegyver, nem használható kétkezes harcra */
function isSpeciális(karakter: Karakter, idx: number): boolean {
  if (idx < 0) return true;
  return karakter.fegyverek[idx]?.alap.toLowerCase() === 'puszta kéz';
}

/** Szűrt fegyveropciók a gyengébb kézhez (kétkezes harc mód) */
function getKétkezesBalOpciók(
  fegyverOpciók: { név: string; idx: number }[],
  karakter: Karakter,
  data: GameData,
  jobbIdx: number,
): { név: string; idx: number }[] {
  const jobbPenge = jobbIdx >= 0
    ? getPengehossz(data, karakter.fegyverek[jobbIdx]?.alap ?? '')
    : 0;

  return fegyverOpciók.filter(f => {
    if (f.idx < 0) return false;
    const alap = karakter.fegyverek[f.idx]?.alap ?? '';
    if (alap.toLowerCase() === 'puszta kéz') return false;
    const fDef = lookupFegyver(data.fegyverek, alap);
    if (fDef?.Hárító === '1') return false;
    if (jobbIdx < 0) return true;
    const balPenge = parseFloat(fDef?.Pengehossz ?? '0') || 0;
    if (balPenge > jobbPenge) return false;
    return balPenge + jobbPenge <= data.konstansok.kétkezes_harc_max_pengeméret;
  });
}

/** Van-e legalább 1 más választható fegyverfogás opció? */
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
        <ÜgyesebbKézSelect data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} fegyverOpciók={fegyverOpciók} />
        {session.fegyverfogás !== 'egyfegyveres' && (
          <GyengébbKézSelect data={data} karakter={karakter} session={session} setSession={setSession} fegyverOpciók={fegyverOpciók} />
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

// --- Sub-components ---

function FegyverSelectField({ label, value, options, onChange }: {
  label: string;
  value: number;
  options: { név: string; idx: number }[];
  onChange: (idx: number) => void;
}) {
  return (
    <div className="aktiv-field-btn">
      <span className="aktiv-field-label">{label}</span>
      <select className="aktiv-field-select" value={value} onChange={e => onChange(parseInt(e.target.value))}>
        {options.map(f => (
          <option key={f.idx} value={f.idx} style={f.idx < 0 ? { color: '#81c784' } : undefined}>{f.név}</option>
        ))}
      </select>
    </div>
  );
}

function ÜgyesebbKézSelect({ data, karakter, session, setSession, pushUndo, fegyverOpciók }: AktivBaseProps & { fegyverOpciók: { név: string; idx: number }[] }) {
  const options = fegyverOpciók.filter(f => {
    if (f.idx < 0) return true;
    if (session.aktív_fegyver_bal_index < 0) return true;
    const balPenge = getPengehossz(data, karakter.fegyverek[session.aktív_fegyver_bal_index]?.alap ?? '');
    const fPenge = getPengehossz(data, karakter.fegyverek[f.idx]?.alap ?? '');
    return fPenge + balPenge <= data.konstansok.kétkezes_harc_max_pengeméret;
  });

  return (
    <FegyverSelectField
      label="Ügyesebb kéz"
      value={session.aktív_fegyver_index}
      options={options}
      onChange={idx => {
        pushUndo(`Fegyver: ${fegyverOpciók.find(f => f.idx === idx)?.név ?? 'Puszta kéz'}`);
        setSession(s => {
          if (isSpeciális(karakter, idx)) {
            return { ...s, aktív_fegyver_index: idx, fegyverfogás: 'egyfegyveres', kétkezes_harc: false, aktív_fegyver_bal_index: -1 };
          }
          let balIdx = s.aktív_fegyver_bal_index;
          if (balIdx >= 0) {
            const jobbPenge = getPengehossz(data, karakter.fegyverek[idx]?.alap ?? '');
            const balPenge = getPengehossz(data, karakter.fegyverek[balIdx]?.alap ?? '');
            if (balPenge > jobbPenge || balPenge + jobbPenge > data.konstansok.kétkezes_harc_max_pengeméret) {
              balIdx = -1;
            }
          }
          return { ...s, aktív_fegyver_index: idx, aktív_fegyver_bal_index: balIdx, kétkezes_harc: idx >= 0 && balIdx >= 0 && s.kétkezes_harc };
        });
      }}
    />
  );
}

function GyengébbKézSelect({ data, karakter, session, setSession, fegyverOpciók }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'> & { fegyverOpciók: { név: string; idx: number }[] }) {
  // Fegyver + pajzs
  if (session.fegyverfogás === 'fegyver_pajzs') {
    return (
      <div className="aktiv-field-btn">
        <span className="aktiv-field-label">Gyengébb kéz</span>
        <select className="aktiv-field-select" disabled><option>Pajzs</option></select>
      </div>
    );
  }

  // Fegyver + hárítófegyver
  if (session.fegyverfogás === 'fegyver_hárító') {
    return <HárítóSelect data={data} karakter={karakter} session={session} setSession={setSession} />;
  }

  // Kétkezes harc
  return <KétkezesBalSelect data={data} karakter={karakter} session={session} setSession={setSession} fegyverOpciók={fegyverOpciók} />;
}

function HárítóSelect({ data, karakter, session, setSession }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'>) {
  const háritók = karakter.fegyverek
    .map((fp, i) => ({ i, fp }))
    .filter(({ fp }) => lookupFegyver(data.fegyverek, fp.alap)?.Hárító === '1');

  const validIdx = háritók.find(h => h.i === session.aktív_fegyver_bal_index) ? session.aktív_fegyver_bal_index : (háritók[0]?.i ?? -1);

  useEffect(() => {
    if (validIdx !== session.aktív_fegyver_bal_index) {
      setSession(s => ({ ...s, aktív_fegyver_bal_index: validIdx }));
    }
  }, [validIdx, session.aktív_fegyver_bal_index, setSession]);

  return (
    <div className="aktiv-field-btn">
      <span className="aktiv-field-label">Gyengébb kéz</span>
      {háritók.length <= 1
        ? <select className="aktiv-field-select" disabled><option>{háritók[0]?.fp.alap ?? 'Hárítófegyver'}</option></select>
        : <select className="aktiv-field-select" value={validIdx} onChange={e => setSession(s => ({ ...s, aktív_fegyver_bal_index: parseInt(e.target.value) }))}>
            {háritók.map(h => <option key={h.i} value={h.i}>{h.fp.alap}</option>)}
          </select>}
    </div>
  );
}

function KétkezesBalSelect({ data, karakter, session, setSession, fegyverOpciók }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'> & { fegyverOpciók: { név: string; idx: number }[] }) {
  const filteredBal = getKétkezesBalOpciók(fegyverOpciók, karakter, data, session.aktív_fegyver_index);

  const validIdx = filteredBal.some(f => f.idx === session.aktív_fegyver_bal_index)
    ? session.aktív_fegyver_bal_index
    : (filteredBal[0]?.idx ?? -1);

  useEffect(() => {
    if (validIdx === session.aktív_fegyver_bal_index) return;
    setSession(s => validIdx === -1
      ? { ...s, aktív_fegyver_bal_index: -1, fegyverfogás: 'egyfegyveres', kétkezes_harc: false }
      : { ...s, aktív_fegyver_bal_index: validIdx });
  }, [validIdx, session.aktív_fegyver_bal_index, setSession]);

  if (filteredBal.length === 0) return null;

  return (
    <FegyverSelectField
      label="Gyengébb kéz"
      value={validIdx}
      options={filteredBal}
      onChange={idx => setSession(s => ({ ...s, aktív_fegyver_bal_index: idx }))}
    />
  );
}

function SessionToggles({ data, karakter, session, setSession }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'>) {
  const toggleForts = data.fortelySummaries.filter(d => d.session_toggle);
  return (
    <>
      {toggleForts.map(tf => {
        const has = karakter.fortélyok.some(f => f.név === tf.név && f.fok > 0);
        const sessionKey = tf.név.toLowerCase().replace(/ /g, '_');
        const active = (session as unknown as Record<string, unknown>)[sessionKey] as boolean ?? false;
        return (
          <div key={tf.név} className={`aktiv-field-btn aktiv-field-toggle ${active && has ? 'on' : ''} ${!has ? 'disabled' : ''}`}
            onClick={() => { if (has) setSession(s => ({ ...s, [sessionKey]: !active })); }}>
            <span className="aktiv-field-label">{tf.név.length > 14 ? tf.név.replace('Harci ', 'H. ') : tf.név}</span>
            <strong>{active && has ? 'Igen' : 'Nem'}</strong>
          </div>
        );
      })}
    </>
  );
}

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
