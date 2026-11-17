import type { Kepzettseg } from '../../engine/types';
import type { SectionContext } from './types';
import { SectionRow } from './SectionRow';
import { PluszGomb } from '../picker/ListaPicker';

interface Props {
  ctx: SectionContext;
  arkánumok: Kepzettseg[];
  elérhetőArkánumok: { id: string; név: string }[];
  feloldva: boolean;
  onEdit: (név: string) => void;
  onDelete: (név: string) => void;
  onAdd: (név: string) => void;
}

export function ArkánumokSection({ ctx, arkánumok, elérhetőArkánumok, feloldva, onEdit, onDelete, onAdd }: Props) {
  if (ctx.gameMode && arkánumok.length === 0) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">
        Arkánumok
        {!ctx.gameMode && elérhetőArkánumok.length > 0 && (
          <span className="csoport-uj">
            <PluszGomb cím="Arkánum" disabled={!feloldva}
              opciók={elérhetőArkánumok.map(d => ({ érték: d.id, név: d.név.split(':')[1].trim() }))} onVálaszt={onAdd} />
          </span>
        )}
      </h3>
      {!ctx.gameMode && elérhetőArkánumok.length > 0 && !feloldva && (
        <span className="miszt-no-faj">⚠ Tradíció vagy faj misztérium szükséges</span>
      )}
      {arkánumok.map(a => (
        <SectionRow key={a.id} ctx={ctx} név={a.id} szint={a.szint} warning={!feloldva}
          onEdit={() => onEdit(a.id)} onDelete={() => onDelete(a.id)} />
      ))}
    </section>
  );
}
