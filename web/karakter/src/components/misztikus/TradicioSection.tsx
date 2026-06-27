import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import { MisztikusRow } from './MisztikusRow';

interface TradícióSectionProps {
  tradíció: { név: string; szint: number } | undefined;
  maxSzint: number;
  gameMode: boolean;
  infoTarget: string | null;
  onInfoToggle: (key: string) => void;
  findDef: (név: string) => KepzettsegDef | undefined;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  felvettFortelyok: string[];
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onPickTradíció: () => void;
}

export function TradícióSection({ tradíció, maxSzint, gameMode, infoTarget, onInfoToggle, findDef, kiterjesztesek, felvettFortelyok, onEdit, onDelete, onPickTradíció }: TradícióSectionProps) {
  if (gameMode && !tradíció) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Tradíció</h3>
      {tradíció && (
        <MisztikusRow
          név={tradíció.név} szint={tradíció.szint} maxSzint={maxSzint}
          gameMode={gameMode} onEdit={() => onEdit(tradíció.név)} onDelete={() => onDelete(tradíció.név)}
          infoOpen={infoTarget === `kep-${tradíció.név}`}
          onInfoToggle={() => onInfoToggle(`kep-${tradíció.név}`)}
          def={findDef(tradíció.név)} kit={kiterjesztesek[tradíció.név]} felvettFortelyok={felvettFortelyok}
        />
      )}
      {!tradíció && !gameMode && (
        <button className="he-add-select" onClick={onPickTradíció}>+ Tradíció választása...</button>
      )}
    </section>
  );
}
