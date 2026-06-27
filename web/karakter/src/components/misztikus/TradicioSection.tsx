import { MisztikusRow } from './MisztikusRow';

interface TradícióSectionProps {
  tradíció: { név: string; szint: number } | undefined;
  maxSzint: number;
  gameMode: boolean;
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onPickTradíció: () => void;
}

export function TradícióSection({ tradíció, maxSzint, gameMode, onEdit, onDelete, onPickTradíció }: TradícióSectionProps) {
  if (gameMode && !tradíció) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Tradíció</h3>
      {tradíció && (
        <MisztikusRow
          név={tradíció.név} szint={tradíció.szint} maxSzint={maxSzint}
          gameMode={gameMode} onEdit={() => onEdit(tradíció.név)} onDelete={() => onDelete(tradíció.név)}
        />
      )}
      {!tradíció && !gameMode && (
        <button className="he-add-select" onClick={onPickTradíció}>+ Tradíció választása...</button>
      )}
    </section>
  );
}
