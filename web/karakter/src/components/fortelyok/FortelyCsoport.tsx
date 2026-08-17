import type { FortelyCsoportProps } from './types';
import { FortelyRow } from './FortelyRow';
import { NewFortelySelect } from './NewFortelySelect';
import { calcNyelvPontKeret, calcNyelvTúllépés, isSlotIngyenes } from './helpers';

export function FortelyCsoport({
  csoport, csoportLabel, csoportDefs, slotok, collapsed, gameMode, tsz,
  többszörösNevek, fortélyok, fegyverNevek,
  nyelvtanulásSzint, nyelvFokLabels, képzettségek, harcmodorNevek, data,
  onToggleCollapse, onAddFortely, onToggleInfo, onFokChange, onRemove, onHint, infoTarget
}: FortelyCsoportProps) {
  if (gameMode && slotok.length === 0) return null;

  const usedNonMulti = new Set(slotok.filter(f => !f.spec_típus).map(f => f.név));
  const available = csoportDefs.filter(d => !usedNonMulti.has(d.név) || többszörösNevek.has(d.név));

  const nyelvPontKeret = calcNyelvPontKeret(nyelvtanulásSzint);
  const { overSet: nyelvOverSet } = calcNyelvTúllépés(slotok, nyelvPontKeret);

  // Szabad fortélyok: remaining free slots (same quota as the dropdown ●N indicator).
  const szabadMaradtIngyenes = Math.max(0, tsz - slotok.filter(s => !s.kiérdemelt).length);

  return (
    <div className="fort-csoport">
      <h3 className="csoport-label fort-csoport-label" onClick={onToggleCollapse}>
        <span className="fort-csoport-arrow">{collapsed ? '▸' : '▾'}</span> {csoportLabel} <span className="dim">({slotok.length})</span>
        {csoport === 'szabad' && !gameMode && (
          <span className="fort-csoport-ingyenes">● {szabadMaradtIngyenes} ingyenes</span>
        )}
      </h3>
      {!collapsed && (<>
        {slotok.map((slot, i) => {
          const globalIdx = fortélyok.indexOf(slot);
          const def = csoportDefs.find(d => d.név === slot.név);
          const isOpen = infoTarget === `${globalIdx}`;
          const isIngyenes = isSlotIngyenes(slot, csoport, slotok, tsz, def);

          // Fortély extends skills, but none of those skills is taken yet → warning:
          // red name (like skills with unmet requirement) + keep the info accordion
          // open in edit mode (otherwise the extension info is game-mode only).
          const kiterjeszt = def ? [...def.kiterjeszti_normál, ...def.kiterjeszti_erős] : (slot.kiterjeszti ?? []);
          const kiterjesztHiányos = kiterjeszt.length > 0
            && !kiterjeszt.some(kn => képzettségek.some(k => k.név === kn && k.szint >= 1));

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
              gameMode={gameMode}
              isOpen={isOpen || (!gameMode && kiterjesztHiányos)}
              kiterjesztHiányos={kiterjesztHiányos}
              overLimit={slot.név === 'Nyelvismeret' && nyelvOverSet.has(slot)}
              nyelvPontKeret={slot.név === 'Nyelvismeret' ? nyelvPontKeret : undefined}
              nyelvFokLabels={nyelvFokLabels}
              képzettségek={képzettségek}
              fortélyok={fortélyok}
              harcmodorNevek={harcmodorNevek}
              fegyverHarcmodorNév={fegyverHarcmodorNév}
              onToggleInfo={() => onToggleInfo(globalIdx)}
              onFokChange={fok => onFokChange(globalIdx, fok)}
              onHint={onHint}
              onRemove={() => onRemove(globalIdx)}
            />
          );
        })}

        {/* Misztikus fortélyok felvétele a Misztikus fülön történik (Felvett/Kiérdemelt
            választó, megkötések miatt) — itt csak megjelenítés + fok/törlés. */}
        {!gameMode && csoport !== 'misztikus' && available.length > 0 && (
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
