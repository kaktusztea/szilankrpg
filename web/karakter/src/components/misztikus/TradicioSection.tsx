import type { Kepzettseg } from '../../engine/types';
import { képzKulcs } from '../../engine/azonosito';
import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';

interface Props {
  ctx: SectionContext;
  tradíció: Kepzettseg | undefined;
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onPickTradíció: () => void;
}

export function TradícióSection({ ctx, tradíció, onEdit, onDelete, onPickTradíció }: Props) {
  if (ctx.gameMode && !tradíció) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Tradíció</h3>
      {tradíció && (
        <SectionRow ctx={ctx} név={képzKulcs(tradíció)} szint={tradíció.szint}
          onEdit={() => onEdit(képzKulcs(tradíció))} onDelete={() => onDelete(képzKulcs(tradíció))} />
      )}
      {!tradíció && !ctx.gameMode && (
        <button className="he-add-select" onClick={onPickTradíció}>+ Tradíció választása...</button>
      )}
    </section>
  );
}
