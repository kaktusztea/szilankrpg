import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import type { KepzettsegSlot } from './types';
import { KepzettsegRow } from './KepzettsegRow';
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
  felvettFortelyok: string[];
  onAddKepzettseg: (csoport: string, név: string) => void;
  onSzintChange: (globalIdx: number, szint: number) => void;
  onRemove: (globalIdx: number, slot: KepzettsegSlot) => void;
}

export function KepzettsegCsoport({
  csoport, csoportLabel, gameMode, képzettségek, defsByGroup, kepzettsegDefs,
  kiterjesztesek, tsz, collapsed, onToggleCollapse, infoTarget, setInfoTarget,
  felvettFortelyok, onAddKepzettseg, onSzintChange, onRemove
}: Props) {
  const slotok = sortKepzettsegSlotok(getKepzettsegekForCsoport(csoport, képzettségek, defsByGroup));
  if (gameMode && slotok.length === 0) return null;

  const usedNames = slotok.map(s => s.név);
  const available = getAvailableNames(csoport, usedNames, defsByGroup);
  const boundFindDef = (név: string) => findDefHelper(név, kepzettsegDefs);

  return (
    <div className="kep-csoport">
      <h3 className="kep-csoport-label" onClick={onToggleCollapse}>
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
              felvettFortelyok={felvettFortelyok}
            />
          );
        })}
        {!gameMode && available.length > 0 && (
          <div className="kep-row kep-row-new">
            <select className="kep-select" value="" onChange={e => { if (e.target.value) onAddKepzettseg(csoport, e.target.value); }}>
              <option value="">+ Új képzettség...</option>
              {available.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
      </>)}
    </div>
  );
}
