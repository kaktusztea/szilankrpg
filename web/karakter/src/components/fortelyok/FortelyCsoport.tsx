import type { FortelyCsoportProps } from './types';
import { FortelyRow } from './FortelyRow';
import { calcNyelvPontKeret, calcNyelvTúllépés, isSlotIngyenes } from './helpers';

export function FortelyCsoport({
  csoport, csoportLabel, csoportDefs, slotok, collapsed, gameMode, tsz,
  lockedSet, többszörösNevek, fortélyok, fegyverNevek, távfegyverNevek,
  nyelvtanulásSzint, nyelvFokLabels, képzettségek, harcmodorNevek, data,
  onToggleCollapse, onAddFortely, onToggleInfo, onFokChange, onRemove, onHint, infoTarget
}: FortelyCsoportProps) {
  if (gameMode && slotok.length === 0) return null;

  const usedNonMulti = new Set(slotok.filter(f => !f.spec_típus).map(f => f.név));
  const available = csoportDefs.filter(d => (!usedNonMulti.has(d.név) || többszörösNevek.has(d.név)) && !lockedSet.has(d.név));

  const nyelvPontKeret = calcNyelvPontKeret(nyelvtanulásSzint);
  const { overSet: nyelvOverSet } = calcNyelvTúllépés(slotok, nyelvPontKeret);

  return (
    <div className="fort-csoport">
      <h3 className="fort-csoport-label" onClick={onToggleCollapse}>
        <span className="fort-csoport-arrow">{collapsed ? '▸' : '▾'}</span> {csoportLabel} <span className="dim">({slotok.length})</span>
      </h3>
      {!collapsed && (<>
        {slotok.map((slot, i) => {
          const globalIdx = fortélyok.indexOf(slot);
          const def = csoportDefs.find(d => d.név === slot.név);
          const isOpen = infoTarget === `${globalIdx}`;
          const isIngyenes = isSlotIngyenes(slot, csoport, slotok, tsz, def);

          const fegyverHarcmodorNév = slot.spec_elem ? (() => {
            const fd = data.fegyverek.find(d => d.Alapnév?.toLowerCase() === slot.spec_elem!.toLowerCase() || d.Fegyver.toLowerCase() === slot.spec_elem!.toLowerCase());
            return fd ? data.konstansok.fegyver_kategória_harcmodor[fd.Kategória] : undefined;
          })() : undefined;

          return (
            <FortelyRow
              key={`${csoport}-${i}`}
              slot={slot}
              def={def}
              globalIdx={globalIdx}
              isIngyenes={isIngyenes}
              locked={lockedSet.has(slot.név)}
              gameMode={gameMode}
              isOpen={isOpen}
              overLimit={slot.név === 'Nyelvismeret' && nyelvOverSet.has(slot)}
              nyelvPontKeret={slot.név === 'Nyelvismeret' ? nyelvPontKeret : undefined}
              nyelvFokLabels={nyelvFokLabels}
              képzettségek={képzettségek}
              fortélyok={fortélyok}
              harcmodorNevek={harcmodorNevek}
              távfegyverNevek={távfegyverNevek}
              fegyverHarcmodorNév={fegyverHarcmodorNév}
              onToggleInfo={() => onToggleInfo(globalIdx)}
              onFokChange={fok => onFokChange(globalIdx, fok)}
              onHint={onHint}
              onRemove={() => onRemove(globalIdx)}
            />
          );
        })}

        {!gameMode && available.length > 0 && (
          <NewFortelySelect
            available={available}
            csoport={csoport}
            slotok={slotok}
            tsz={tsz}
            fortélyok={fortélyok}
            fegyverNevek={fegyverNevek}
            nyelvtanulásSzint={nyelvtanulásSzint}
            onAdd={onAddFortely}
          />
        )}
      </>)}
    </div>
  );
}

function NewFortelySelect({ available, csoport, slotok, tsz, fortélyok, fegyverNevek, nyelvtanulásSzint, onAdd }: {
  available: { név: string; maxfok: number; kp_perfok: number; többszörös_típus: string; ingyenes_perszint: number }[];
  csoport: string;
  slotok: { név: string; kiérdemelt?: boolean; fok: number }[];
  tsz: number;
  fortélyok: { név: string; spec_elem: string; kiérdemelt?: boolean; fok: number }[];
  fegyverNevek: string[];
  nyelvtanulásSzint: number;
  onAdd: (név: string) => void;
}) {
  return (
    <div className="fort-row fort-row-new">
      <select className="fort-select" value="" onChange={e => { if (e.target.value) onAdd(e.target.value); }}>
        <option value="">+ Új fortély...</option>
        {available.map(d => {
          let label = `${d.név} (${d.maxfok})`;
          if (csoport === 'szabad') {
            const nonKierdemelt = slotok.filter(s => !s.kiérdemelt).length;
            const maradtIngyenes = Math.max(0, tsz - nonKierdemelt);
            if (maradtIngyenes > 0) label += ` ●${maradtIngyenes}`;
          } else if (d.ingyenes_perszint > 0) {
            const ingyenesDb = Math.floor((tsz + 1) / d.ingyenes_perszint);
            const felvettDb = fortélyok.filter(f => f.név === d.név && !f.kiérdemelt).length;
            const maradtIngyenes = Math.max(0, ingyenesDb - felvettDb);
            if (maradtIngyenes > 0) label += ` ●${maradtIngyenes}`;
          } else if (d.kp_perfok < 0) {
            const vals = Array.from({ length: d.maxfok }, (_, i) => Math.abs(d.kp_perfok) * (i + 1));
            label += ` ➕${vals.join('-')}KP`;
          }
          const fegyverDisabled = d.többszörös_típus === 'fegyver' && (fegyverNevek.length === 0 || fegyverNevek.every(n => fortélyok.some(f => f.név === d.név && f.spec_elem === n)));
          let nyelvDisabled = false;
          if (d.név === 'Nyelvismeret') {
            const keret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
            const used = fortélyok.filter(f => f.név === 'Nyelvismeret' && !f.kiérdemelt).reduce((s, f) => s + f.fok, 0)
              + fortélyok.filter(f => f.név === 'Nyelvismeret' && f.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
            const maradt = keret - used;
            if (maradt > 0) label += ` ●${maradt}`;
            nyelvDisabled = maradt <= 0;
          }
          return <option key={d.név} value={d.név} disabled={fegyverDisabled || nyelvDisabled}>{label}</option>;
        })}
      </select>
    </div>
  );
}
