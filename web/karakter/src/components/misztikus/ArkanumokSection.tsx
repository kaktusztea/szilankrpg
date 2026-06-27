import { MisztikusRow } from './MisztikusRow';

interface ArkánumokSectionProps {
  arkánumok: { név: string; szint: number }[];
  elérhetőArkánumok: { név: string }[];
  hasTradíció: boolean;
  maxSzint: number;
  gameMode: boolean;
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onAdd: (név: string) => void;
}

export function ArkánumokSection({ arkánumok, elérhetőArkánumok, hasTradíció, maxSzint, gameMode, onEdit, onDelete, onAdd }: ArkánumokSectionProps) {
  if (gameMode && arkánumok.length === 0) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Arkánumok</h3>
      {arkánumok.map(a => (
        <MisztikusRow
          key={a.név} név={a.név} szint={a.szint} maxSzint={maxSzint}
          warning={!hasTradíció} gameMode={gameMode}
          onEdit={() => onEdit(a.név)} onDelete={() => onDelete(a.név)}
        />
      ))}
      {!gameMode && elérhetőArkánumok.length > 0 && (
        <select className="he-add-select" value="" disabled={!hasTradíció} onChange={e => { if (e.target.value) onAdd(e.target.value); }}>
          <option value="">{!hasTradíció ? '⚠ Tradíció szükséges' : '+ Arkánum...'}</option>
          {elérhetőArkánumok.map(d => <option key={d.név} value={d.név}>{d.név.split(':')[1].trim()}</option>)}
        </select>
      )}
    </section>
  );
}
