import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';

interface Props {
  ctx: SectionContext;
  tradíció: { név: string; szint: number } | undefined;
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
        <SectionRow ctx={ctx} név={tradíció.név} szint={tradíció.szint}
          onEdit={() => onEdit(tradíció.név)} onDelete={() => onDelete(tradíció.név)} />
      )}
      {!tradíció && !ctx.gameMode && (
        <button className="he-add-select" onClick={onPickTradíció}>+ Tradíció választása...</button>
      )}
    </section>
  );
}
