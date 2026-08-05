import type { HarcBaseProps } from './types';
import type { Session } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';
import { PickerOverlay } from '../aktiv/PickerOverlay';
import { kétkezesLehetséges } from './fegyver-helpers';

interface Props extends Pick<HarcBaseProps, 'data' | 'karakter' | 'session'> {
  onSelect: (patch: Partial<Session>) => void;
  onClose: () => void;
}

export function HarcFegyverfogas({ data, karakter, session, onSelect, onClose }: Props) {
  const jobbIdx = session.aktív_fegyver_index;
  const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
  const jobbDef = jobbFp ? lookupFegyver(data.fegyverek, jobbFp.alap) : null;
  const kétkezesFegyver = jobbDef?.['Forgatás módja'] === 'kétkezes';

  function isDisabled(id: string): boolean {
    if (kétkezesFegyver && id !== 'egyfegyveres') return true;
    if (id === 'fegyver_pajzs' && !karakter.pajzs?.méret) return true;
    if (id === 'fegyver_hárító') {
      const hasHáritó = karakter.fegyverek.some(fp => lookupFegyver(data.fegyverek, fp.alap)?.['Hárító'] === '1');
      const hasFortély = karakter.fortélyok.some(f => f.név === 'Hárítófegyver használat' && f.fok > 0);
      if (!hasHáritó || !hasFortély) return true;
    }
    if (id === 'kétkezes') {
      if (!kétkezesLehetséges(data, karakter, jobbIdx)) return true;
    }
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
        const cand = karakter.fegyverek
          .map((fp, i) => ({ i, alap: fp.alap, penge: parseFloat(lookupFegyver(data.fegyverek, fp.alap)?.Pengehossz ?? '99') || 99 }))
          .filter(e => e.alap.toLowerCase() !== 'puszta kéz' && lookupFegyver(data.fegyverek, e.alap)?.Hárító !== '1')
          .sort((a, b) => a.penge - b.penge);
        // Lehetőleg másik fegyver a gyengébb kézbe; ha nincs, ugyanaz (pl. 2 db tőr).
        const pick = cand.find(e => e.i !== session.aktív_fegyver_index) ?? cand[0];
        if (pick) patch.aktív_fegyver_bal_index = pick.i;
      }
    }
    return patch;
  }

  return (
    <PickerOverlay title="Fegyverfogás" onClose={onClose}>
      {(data.konstansok.fegyverfogás_opciók as { id: string; név: string }[]).map(opt => {
        const disabled = isDisabled(opt.id);
        const active = session.fegyverfogás === opt.id;
        return (
          <div key={opt.id}
            className={`aktiv-picker-item${disabled ? ' aktiv-picker-item-disabled-inline' : ''}${active ? ' aktiv-picker-item-active-accent' : ''}`}
            onClick={() => { if (!disabled) onSelect(buildPatch(opt.id)); }}>
            <span className="aktiv-picker-item-name">{opt.név}</span>
            {disabled && opt.id === 'fegyver_hárító' && <span className="aktiv-hint-disabled">Vegyél fel legalább 1 hárítófegyvert és a Hárítófegyver használat fortélyt.</span>}
          </div>
        );
      })}
    </PickerOverlay>
  );
}
