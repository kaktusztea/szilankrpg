import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';

interface Props {
  ctx: SectionContext;
  fajNév: string;
  /** A faj misztérium képzettség id-je ('' ha nincs ilyen képzettség). */
  fajMisztId: string;
  szint: number;
  onEdit: (név: string) => void;
}

export function FajMisztériumSection({ ctx, fajNév, fajMisztId, szint, onEdit }: Props) {
  if (ctx.gameMode && szint === 0) return null;


  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Faj misztérium</h3>
      {!fajNév || !fajMisztId ? (
        <span className="miszt-no-faj">Faj nincs kiválasztva</span>
      ) : (
        <SectionRow ctx={ctx} név={fajMisztId} szint={szint} canDelete={false}
          onEdit={() => onEdit(fajMisztId)} />
      )}
    </section>
  );
}
