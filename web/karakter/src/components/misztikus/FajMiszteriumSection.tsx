import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';

interface Props {
  ctx: SectionContext;
  fajNév: string;
  szint: number;
  onEdit: (név: string) => void;
}

export function FajMisztériumSection({ ctx, fajNév, szint, onEdit }: Props) {
  if (ctx.gameMode && szint === 0) return null;

  const fajMisztNév = fajNév ? `Faj misztérium: ${fajNév}` : '';

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Faj misztérium</h3>
      {!fajNév ? (
        <span className="miszt-no-faj">Faj nincs kiválasztva</span>
      ) : (
        <SectionRow ctx={ctx} név={fajMisztNév} szint={szint} canDelete={false}
          onEdit={() => onEdit(fajMisztNév)} />
      )}
    </section>
  );
}
