import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';

interface Props {
  ctx: SectionContext;
  ősiNyelvek: { név: string; szint: number }[];
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onAdd: () => void;
}

export function ŐsiNyelvSection({ ctx, ősiNyelvek, onEdit, onDelete, onAdd }: Props) {
  if (ctx.gameMode && ősiNyelvek.length === 0) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Ősi nyelv ismerete</h3>
      {ősiNyelvek.map(k => (
        <SectionRow key={k.név} ctx={ctx} név={k.név} szint={k.szint}
          onEdit={() => onEdit(k.név)} onDelete={() => onDelete(k.név)} />
      ))}
      {!ctx.gameMode && (
        <button className="he-add-select" onClick={onAdd}>+ Ősi nyelv ismerete...</button>
      )}
    </section>
  );
}
