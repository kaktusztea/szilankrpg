import type { FortelyCsoportProps } from './types';
import { FortelyRow } from './FortelyRow';
import { NewFortelySelect } from './NewFortelySelect';
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
