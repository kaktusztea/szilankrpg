import type { Kepzettseg } from '../../engine/types';
import { képzKulcs } from '../../engine/azonosito';
import type { SectionContext } from './types';
import { Ikon } from '../common/Ikon';
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
    <section className="miszt-section miszt-section-single">
      <h3 className="miszt-section-title">
        Tradíció
        {!tradíció && !ctx.gameMode && (
          <button type="button" className="csoport-uj-btn miszt-uj" title="Tradíció választása" aria-label="Tradíció választása"
            onClick={onPickTradíció}><Ikon név="új" /></button>
        )}
      </h3>
      {tradíció && (
        <SectionRow ctx={ctx} név={képzKulcs(tradíció)} szint={tradíció.szint}
          onEdit={() => onEdit(képzKulcs(tradíció))} onDelete={() => onDelete(képzKulcs(tradíció))} />
      )}
    </section>
  );
}
