import type { AktivBaseProps } from './types';
import type { Session } from '../../engine/types';
import { lookupFegyver } from '../../engine/helpers';

interface Props extends Pick<AktivBaseProps, 'data' | 'karakter' | 'session'> {
  onSelect: (patch: Partial<Session>) => void;
  onClose: () => void;
}

export function AktivFegyverfogas({ data, karakter, session, onSelect, onClose }: Props) {
  const jobbIdx = session.aktív_fegyver_index;
  const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
  const jobbDef = jobbFp ? lookupFegyver(data.fegyverek, jobbFp.alap) : null;
  const kétkezesFegyver = jobbDef?.['Forgatás módja'] === 'kétkezes';

  function isDisabled(id: string): boolean {
    if (id === 'fegyver_pajzs' && !karakter.pajzs?.méret) return true;
    if (id === 'fegyver_hárító') {
      const hasHáritó = karakter.fegyverek.some(fp => lookupFegyver(data.fegyverek, fp.alap)?.['Hárító'] === '1');
      const hasFortély = karakter.fortélyok.some(f => f.név === 'Hárítófegyver használat' && f.fok > 0);
      if (!hasHáritó || !hasFortély) return true;
    }
    if (id === 'kétkezes') {
      if (kétkezesFegyver) return true;
      if (karakter.fegyverek.length < 2) return true;
      if (!jobbFp || jobbFp.alap.toLowerCase() === 'puszta kéz') return true;
      const nemHáritó = karakter.fegyverek.filter((fp, i) => {
        if (i === jobbIdx) return false;
        return lookupFegyver(data.fegyverek, fp.alap)?.Hárító !== '1';
      });
      if (nemHáritó.length === 0) return true;
    }
    if (kétkezesFegyver && id !== 'egyfegyveres') return true;
    for (const ah of session.aktív_helyzetek) {
      const ahDef = data.harciHelyzetek.find(d => d.név === ah);
      if (ahDef?.tiltott_fegyverfogások?.includes(id)) return true;
    }
    return false;
  }

  function buildPatch(id: string): Partial<Session> {
    const patch: Partial<Session> = { fegyverfogás: id as Session['fegyverfogás'] };
    if (id === 'egyfegyveres') { patch.kétkezes_harc = false; patch.aktív_pajzs = false; patch.aktív_fegyver_bal_index = -1; }
    if (id === 'fegyver_pajzs') { patch.kétkezes_harc = false; patch.aktív_pajzs = true; patch.aktív_fegyver_bal_index = -1; }
    if (id === 'fegyver_hárító') { patch.kétkezes_harc = false; patch.aktív_pajzs = false; patch.aktív_fegyver_bal_index = -1; }
    if (id === 'kétkezes') {
      patch.kétkezes_harc = true; patch.aktív_pajzs = false;
      if (session.aktív_fegyver_bal_index === -1) {
        const eligible = karakter.fegyverek.map((fp, i) => ({ i, penge: parseFloat(lookupFegyver(data.fegyverek, fp.alap)?.Pengehossz ?? '99') || 99 }))
          .filter(e => e.i !== session.aktív_fegyver_index)
          .sort((a, b) => a.penge - b.penge);
        if (eligible.length > 0) patch.aktív_fegyver_bal_index = eligible[0].i;
      }
    }
    return patch;
  }

  return (
    <div className="kep-prompt-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="aktiv-picker">
        <div className="aktiv-picker-header"><label>Fegyverfogás</label></div>
        <div className="aktiv-picker-list">
          {(data.konstansok.fegyverfogás_opciók as { id: string; név: string }[]).map(opt => {
            const disabled = isDisabled(opt.id);
            const active = session.fegyverfogás === opt.id;
            return (
              <div key={opt.id} className={`aktiv-picker-item ${disabled ? 'aktiv-picker-item-disabled-inline' : ''} ${active ? 'aktiv-picker-item-active-accent' : ''}`}
                onClick={() => { if (!disabled) onSelect(buildPatch(opt.id)); }}>
                <span className="aktiv-picker-item-name">{opt.név}</span>
                {disabled && opt.id === 'fegyver_hárító' && <span className="aktiv-hint-disabled">Vegyél fel legalább 1 hárítófegyvert és a Hárítófegyver használat fortélyt.</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
