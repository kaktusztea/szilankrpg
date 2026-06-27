import { MisztikusRow } from './MisztikusRow';

interface ŐsiNyelvSectionProps {
  ősiNyelvek: { név: string; szint: number }[];
  maxSzint: number;
  gameMode: boolean;
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onAdd: () => void;
}

export function ŐsiNyelvSection({ ősiNyelvek, maxSzint, gameMode, onEdit, onDelete, onAdd }: ŐsiNyelvSectionProps) {
  if (gameMode && ősiNyelvek.length === 0) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Ősi nyelv ismerete</h3>
      {ősiNyelvek.map(k => (
        <MisztikusRow
          key={k.név} név={k.név} szint={k.szint} maxSzint={maxSzint}
          gameMode={gameMode} onEdit={() => onEdit(k.név)} onDelete={() => onDelete(k.név)}
        />
      ))}
      {!gameMode && (
        <button className="he-add-select" onClick={onAdd}>+ Ősi nyelv ismerete...</button>
      )}
    </section>
  );
}
