import type { AktivBaseProps } from './types';
import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { lookupFegyver } from '../../engine/helpers';

function getPengehossz(data: GameData, alap: string): number {
  return parseFloat(lookupFegyver(data.fegyverek, alap)?.Pengehossz ?? '0') || 0;
}

function isSpeciális(karakter: Karakter, idx: number): boolean {
  if (idx < 0) return true;
  return karakter.fegyverek[idx]?.alap.toLowerCase() === 'puszta kéz';
}

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

export function UgyesebbKezSelect({ data, karakter, session, setSession, pushUndo, fegyverOpciók }: AktivBaseProps & { fegyverOpciók: { név: string; idx: number }[] }) {
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

export { FegyverSelectField };
