import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import { MisztikusRow } from './MisztikusRow';

interface FajMisztériumSectionProps {
  fajNév: string;
  szint: number;
  maxSzint: number;
  gameMode: boolean;
  infoTarget: string | null;
  onInfoToggle: (key: string) => void;
  findDef: (név: string) => KepzettsegDef | undefined;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  felvettFortelyok: string[];
  onEdit: (név: string) => void;
}

export function FajMisztériumSection({ fajNév, szint, maxSzint, gameMode, infoTarget, onInfoToggle, findDef, kiterjesztesek, felvettFortelyok, onEdit }: FajMisztériumSectionProps) {
  if (gameMode && szint === 0) return null;

  const fajMisztNév = fajNév ? `Faj misztérium: ${fajNév}` : '';

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Faj misztérium</h3>
      {!fajNév ? (
        <span className="miszt-no-faj">Faj nincs kiválasztva</span>
      ) : (
        <MisztikusRow
          név={fajMisztNév} szint={szint} maxSzint={maxSzint} canDelete={false}
          gameMode={gameMode} onEdit={() => onEdit(fajMisztNév)}
          infoOpen={infoTarget === `kep-${fajMisztNév}`}
          onInfoToggle={() => onInfoToggle(`kep-${fajMisztNév}`)}
          def={findDef(fajMisztNév)} kit={kiterjesztesek[fajMisztNév]} felvettFortelyok={felvettFortelyok}
        />
      )}
    </section>
  );
}
