import { useState } from 'react';
import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import type { PróbaEnyhítés, StatuszEntry } from '../../engine/data-types';
import type { Tulajdonsagok } from '../../engine/types';
import type { KepzettsegSlot } from './types';
import { KepzettsegRow } from './KepzettsegRow';
import { KepzettsegPickerOverlay } from './KepzettsegPickerOverlay';
import { getDisplayName, findDef as findDefHelper, getAvailableNames, getKepzettsegekForCsoport, sortKepzettsegSlotok } from './helpers';

interface Props {
  csoport: string;
  csoportLabel: string;
  gameMode: boolean;
  képzettségek: KepzettsegSlot[];
  defsByGroup: Map<string, KepzettsegDef[]>;
  kepzettsegDefs: KepzettsegDef[];
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  tsz: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  infoTarget: string | null;
  setInfoTarget: (v: string | null) => void;
  tulajdonságok: Tulajdonsagok;
  fortélyFokok: Record<string, number>;
  onAddKepzettseg: (csoport: string, név: string) => void;
  onSzintChange: (globalIdx: number, szint: number) => void;
  onRemove: (globalIdx: number, slot: KepzettsegSlot) => void;
  aktívStátuszok: string[];
  statuszDefs: StatuszEntry[];
  próbaEnyhítésekByKép: Record<string, PróbaEnyhítés[]>;
}

export function KepzettsegCsoport({
  csoport, csoportLabel, gameMode, képzettségek, defsByGroup, kepzettsegDefs,
  kiterjesztesek, tsz, collapsed, onToggleCollapse, infoTarget, setInfoTarget,
  fortélyFokok, tulajdonságok, onAddKepzettseg, onSzintChange, onRemove, aktívStátuszok, statuszDefs, próbaEnyhítésekByKép
}: Props) {
  const slotok = sortKepzettsegSlotok(getKepzettsegekForCsoport(csoport, képzettségek, defsByGroup), kepzettsegDefs);
  if (gameMode && slotok.length === 0) return null;

  const usedNames = slotok.map(s => s.név);
  const available = getAvailableNames(csoport, usedNames, defsByGroup);
  const boundFindDef = (név: string) => findDefHelper(név, kepzettsegDefs);

  return (
    <div className="kep-csoport">
      <h3 className="csoport-label kep-csoport-label" onClick={onToggleCollapse}>
        <span className="kep-csoport-arrow">{collapsed ? '▸' : '▾'}</span> {csoportLabel} <span className="dim">({slotok.length})</span>
      </h3>
      {!collapsed && (<>
        {slotok.map((slot, i) => {
          const globalIdx = képzettségek.findIndex(k => k === slot);
          const kepDef = boundFindDef(slot.név);
          const maxSzint = kepDef?.primer ? tsz : tsz + 3;
          return (
            <KepzettsegRow
              key={`${csoport}-${i}`}
              slot={slot}
              gameMode={gameMode}
              onSzintChange={szint => onSzintChange(globalIdx, szint)}
              onRemove={() => onRemove(globalIdx, slot)}
              kiterjesztesek={kiterjesztesek}
              infoOpen={infoTarget === `${globalIdx}`}
              onInfoToggle={() => setInfoTarget(infoTarget === `${globalIdx}` ? null : `${globalIdx}`)}
              displayName={getDisplayName(slot.név, kepzettsegDefs)}
              findDef={boundFindDef}
              overLimit={slot.szint > maxSzint}
              warning={slot.név.startsWith('Arkánum') && !képzettségek.some(k => k.név.startsWith('Tradíció'))}
              fortélyFokok={fortélyFokok}
              tulajdonságok={tulajdonságok}
              képzettségek={képzettségek}
              aktívStátuszok={aktívStátuszok}
              statuszDefs={statuszDefs}
              próbaEnyhítések={próbaEnyhítésekByKép[slot.név] || []}
            />
          );
        })}
        {/* Misztikus képzettségek felvétele a Misztikus fülön történik (faj/tradíció
            megkötések miatt) — itt csak megjelenítés + szint/törlés. */}
        {!gameMode && csoport !== 'misztikus' && available.length > 0 && (
          <NewKepzettsegButton available={available} kepzettsegDefs={kepzettsegDefs} onAdd={v => onAddKepzettseg(csoport, v)} />
        )}
      </>)}
    </div>
  );
}

function NewKepzettsegButton({ available, kepzettsegDefs, onAdd }: {
  available: { label: string; value: string }[];
  kepzettsegDefs: KepzettsegDef[];
  onAdd: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="item-row item-row-new">
        <button className="field-select kep-select fort-picker-btn" onClick={() => setOpen(true)}>
          + Új képzettség...
        </button>
      </div>
      {open && (
        <KepzettsegPickerOverlay
          available={available}
          kepzettsegDefs={kepzettsegDefs}
          onAdd={onAdd}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
