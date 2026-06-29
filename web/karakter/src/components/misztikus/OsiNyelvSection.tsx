import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';
import { MAX_AZONOS_KÉPZETTSÉG } from '../../ui-constants';

interface Props {
  ctx: SectionContext;
  ősiNyelvek: { név: string; szint: number }[];
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onAdd: () => void;
  onHint: (msg: string) => void;
}

export function ŐsiNyelvSection({ ctx, ősiNyelvek, onEdit, onDelete, onAdd, onHint }: Props) {
  if (ctx.gameMode && ősiNyelvek.length === 0) return null;
  const maxed = ősiNyelvek.length >= MAX_AZONOS_KÉPZETTSÉG;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Ősi nyelv ismerete</h3>
      {ősiNyelvek.map(k => (
        <SectionRow key={k.név} ctx={ctx} név={k.név} szint={k.szint}
          onEdit={() => onEdit(k.név)} onDelete={() => onDelete(k.név)} />
      ))}
      {!ctx.gameMode && (
        <button className={`he-add-select${maxed ? ' he-add-disabled' : ''}`}
          onClick={() => maxed ? onHint(`Ebből a képzettségből max ${MAX_AZONOS_KÉPZETTSÉG} darab vehető fel!`) : onAdd()}>
          + Ősi nyelv ismerete...
        </button>
      )}
    </section>
  );
}
