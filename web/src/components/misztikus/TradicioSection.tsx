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
    <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
      <h3 style={{ fontSize: '17px', color: '#42a5f5', margin: '0 0 6px' }}>Tradíció</h3>
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
