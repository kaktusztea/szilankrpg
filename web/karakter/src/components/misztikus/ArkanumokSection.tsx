import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';

interface Props {
  ctx: SectionContext;
  arkánumok: { név: string; szint: number }[];
  elérhetőArkánumok: { név: string }[];
  hasTradíció: boolean;
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onAdd: (név: string) => void;
}

export function ArkánumokSection({ ctx, arkánumok, elérhetőArkánumok, hasTradíció, onEdit, onDelete, onAdd }: Props) {
  if (ctx.gameMode && arkánumok.length === 0) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Arkánumok</h3>
      {arkánumok.map(a => (
        <SectionRow key={a.név} ctx={ctx} név={a.név} szint={a.szint} warning={!hasTradíció}
          onEdit={() => onEdit(a.név)} onDelete={() => onDelete(a.név)} />
      ))}
      {!ctx.gameMode && elérhetőArkánumok.length > 0 && (
        <select className="he-add-select" value="" disabled={!hasTradíció}
          onChange={e => { if (e.target.value) onAdd(e.target.value); }}>
          <option value="">{!hasTradíció ? '⚠ Tradíció szükséges' : '+ Arkánum...'}</option>
          {elérhetőArkánumok.map(d => <option key={d.név} value={d.név}>{d.név.split(':')[1].trim()}</option>)}
        </select>
      )}
    </section>
  );
}
