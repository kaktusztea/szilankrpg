import { useEffect } from 'react';
import type { AktivBaseProps } from './types';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/helpers';
import { getPengehossz } from './AktivHelpers';
import { FegyverSelectField } from './FegyverSelectField';

function getKétkezesBalOpciók(
  fegyverOpciók: { név: string; idx: number }[],
  karakter: Karakter,
  data: GameData,
  jobbIdx: number,
): { név: string; idx: number }[] {
  const jobbPenge = jobbIdx >= 0 ? getPengehossz(data, karakter.fegyverek[jobbIdx]?.alap ?? '') : 0;
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

export function GyengebbKezSelect({ data, karakter, session, setSession, fegyverOpciók }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'> & { fegyverOpciók: { név: string; idx: number }[] }) {
  if (session.fegyverfogás === 'fegyver_pajzs') {
    return (
      <div className="aktiv-field-btn">
        <span className="aktiv-field-label">Gyengébb kéz</span>
        <select className="aktiv-field-select" disabled><option>Pajzs</option></select>
      </div>
    );
  }

  if (session.fegyverfogás === 'fegyver_hárító') {
    return <HáritóSelect data={data} karakter={karakter} session={session} setSession={setSession} />;
  }

  return <KétkezesBalSelect data={data} karakter={karakter} session={session} setSession={setSession} fegyverOpciók={fegyverOpciók} />;
}

function HáritóSelect({ data, karakter, session, setSession }: Pick<AktivBaseProps, 'data' | 'karakter' | 'session' | 'setSession'>) {
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
