import type { Kepzettseg } from '../../engine/types';
import { képzKulcs } from '../../engine/azonosito';
import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';
import { MAX_AZONOS_KÉPZETTSÉG } from '../../ui-constants';

interface Props {
  ctx: SectionContext;
  ősiNyelvek: Kepzettseg[];
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
        <SectionRow key={képzKulcs(k)} ctx={ctx} név={képzKulcs(k)} szint={k.szint}
          onEdit={() => onEdit(képzKulcs(k))} onDelete={() => onDelete(képzKulcs(k))} />
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
