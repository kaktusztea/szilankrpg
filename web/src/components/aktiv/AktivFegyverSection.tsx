import type { AktivBaseProps } from './types';
import { lookupFegyver } from '../../engine/helpers';
import { buildFegyverOpciók } from './AktivHelpers';

interface Props extends AktivBaseProps {
  onShowFegyverfogás: () => void;
}

export function AktivFegyverSection({ data, karakter, session, setSession, pushUndo, onShowFegyverfogás }: Props) {
  const fegyverOpciók = buildFegyverOpciók(karakter, data);

  return (
    <div className="aktiv-bottom-section">
      <div className="aktiv-fegyver-row">
        <FegyverSelect
          label="Ügyesebb kéz"
          value={session.aktív_fegyver_index}
          options={fegyverOpciók.filter(f => {
            if (f.idx === -1) return true;
            if (session.aktív_fegyver_bal_index === -1) return true;
            const balFp = karakter.fegyverek[session.aktív_fegyver_bal_index];
            if (!balFp) return true;
            const balDef = lookupFegyver(data.fegyverek, balFp.alap);
            const fDef = lookupFegyver(data.fegyverek, karakter.fegyverek[f.idx]?.alap ?? "");
            return (parseFloat(fDef?.Pengehossz ?? '0') || 0) + (parseFloat(balDef?.Pengehossz ?? '0') || 0) <= data.konstansok.kétkezes_harc_max_pengeméret;
          })}
          onChange={idx => {
            pushUndo(`Fegyver: ${idx === -1 ? 'Puszta kéz' : karakter.fegyverek[idx]?.alap ?? idx}`);
            setSession(s => {
              const puszta = idx === -1 || karakter.fegyverek[idx]?.alap.toLowerCase() === 'puszta kéz';
              if (puszta) {
                return { ...s, aktív_fegyver_index: idx, fegyverfogás: 'egyfegyveres', kétkezes_harc: false, aktív_fegyver_bal_index: -1 };
              }
              return { ...s, aktív_fegyver_index: idx, kétkezes_harc: idx !== -1 && s.aktív_fegyver_bal_index !== -1 ? s.kétkezes_harc : false };
            });
          }}
        />
        {session.fegyverfogás !== 'egyfegyveres' && (
          <GyengébbKézSelect data={data} karakter={karakter} session={session} setSession={setSession} fegyverOpciók={fegyverOpciók} />
        )}
      </div>
      <div className="aktiv-fegyver-row">
        <SessionToggles data={data} karakter={karakter} session={session} setSession={setSession} />
        <FegyverfogásButton data={data} karakter={karakter} session={session} onShowFegyverfogás={onShowFegyverfogás} />
        <div className={`aktiv-field-btn aktiv-field-toggle ${session.aktív_páncél ? 'on' : ''}`}
          onClick={() => { pushUndo(`Páncél: ${!session.aktív_páncél ? "Igen" : "Nem"}`); setSession(s => ({ ...s, aktív_páncél: !s.aktív_páncél })); }}>
          <span className="aktiv-field-label">Páncél viselve</span>
          <strong>{session.aktív_páncél ? 'Igen' : 'Nem'}</strong>
        </div>
      </div>
    </div>
  );
}

function FegyverSelect({ label, value, options, onChange }: {
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
          <option key={f.idx} value={f.idx} style={(f.idx === -1 || f.idx === -2) ? { color: '#81c784' } : undefined}>{f.név}</option>
        ))}
      </select>
    </div>
  );
}

function GyengébbKézSelect({ data, karakter, session, setSession, fegyverOpciók }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'> & { fegyverOpciók: { név: string; idx: number }[] }) {
  if (session.fegyverfogás === 'fegyver_pajzs') {
    return (
      <div className="aktiv-field-btn">
        <span className="aktiv-field-label">Gyengébb kéz</span>
        <select className="aktiv-field-select" disabled><option>Pajzs</option></select>
      </div>
    );
  }

  if (session.fegyverfogás === 'fegyver_hárító') {
    const háritók = karakter.fegyverek.map((fp, i) => ({ i, fp })).filter(({ fp }) => {
      const def = lookupFegyver(data.fegyverek, fp.alap);
      return def?.Hárító === '1';
    });
    const selected = háritók.find(h => h.i === session.aktív_fegyver_bal_index) || háritók[0];
    if (selected && session.aktív_fegyver_bal_index !== selected.i) {
      setSession(s => ({ ...s, aktív_fegyver_bal_index: selected.i }));
    }
    return (
      <div className="aktiv-field-btn">
        <span className="aktiv-field-label">Gyengébb kéz</span>
        {háritók.length <= 1
          ? <select className="aktiv-field-select" disabled><option>{selected?.fp.alap ?? 'Hárítófegyver'}</option></select>
          : <select className="aktiv-field-select" value={session.aktív_fegyver_bal_index} onChange={e => setSession(s => ({ ...s, aktív_fegyver_bal_index: parseInt(e.target.value) }))}>
              {háritók.map(h => <option key={h.i} value={h.i}>{h.fp.alap}</option>)}
            </select>}
      </div>
    );
  }

  // Kétkezes harc
  return (
    <div className="aktiv-field-btn">
      <span className="aktiv-field-label">Gyengébb kéz</span>
      <select className="aktiv-field-select" value={session.aktív_fegyver_bal_index} onChange={e => setSession(s => ({ ...s, aktív_fegyver_bal_index: parseInt(e.target.value) }))}>
        {fegyverOpciók.filter(f => {
          if (f.idx === -1 || f.idx === -2) return false;
          if (karakter.fegyverek[f.idx]?.alap.toLowerCase() === 'puszta kéz') return false;
          const fDef = lookupFegyver(data.fegyverek, karakter.fegyverek[f.idx]?.alap ?? "");
          if (fDef?.Hárító === '1') return false;
          if (session.aktív_fegyver_index === -1) return true;
          const jobbFp = karakter.fegyverek[session.aktív_fegyver_index];
          if (!jobbFp) return true;
          const jobbDef = lookupFegyver(data.fegyverek, jobbFp.alap);
          return (parseFloat(fDef?.Pengehossz ?? '0') || 0) + (parseFloat(jobbDef?.Pengehossz ?? '0') || 0) <= data.konstansok.kétkezes_harc_max_pengeméret;
        }).map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
      </select>
    </div>
  );
}

function SessionToggles({ data, karakter, session, setSession }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'>) {
  const toggleForts = data.fortelySummaries.filter(d => d.session_toggle);
  return (
    <>
      {toggleForts.map(tf => {
        const has = karakter.fortélyok.some(f => f.név === tf.név && f.fok > 0);
        const key = tf.név;
        const active = (session as unknown as Record<string, unknown>)[key.toLowerCase().replace(/ /g, '_')] as boolean ?? false;
        return (
          <div key={key} className={`aktiv-field-btn aktiv-field-toggle ${active && has ? 'on' : ''} ${!has ? 'disabled' : ''}`}
            onClick={() => { if (has) setSession(s => ({ ...s, [key.toLowerCase().replace(/ /g, '_')]: !active })); }}>
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
  const aktív = session.fegyverfogás || 'egyfegyveres';
  const aktívNév = opciók.find(o => o.id === aktív)?.név ?? 'Egyfegyveres';
  const jobbIdx = session.aktív_fegyver_index;
  const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
  const disabled = !jobbFp || jobbFp.alap.toLowerCase() === 'puszta kéz';
  return (
    <div className={`aktiv-field-btn ${disabled ? 'disabled' : ''}`}
      onClick={() => { if (!disabled) onShowFegyverfogás(); }}>
      <span className="aktiv-field-label">Fegyverfogás</span>
      <strong>{aktívNév}</strong>
    </div>
  );
}
