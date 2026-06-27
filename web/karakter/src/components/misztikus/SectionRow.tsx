import type { SectionContext } from './types';
import type { KiterjesztesEntry } from '../../engine/data-loader';
import { MisztikusRow } from './MisztikusRow';

/** Renders a MisztikusRow with shared context props injected */
export function SectionRow({ ctx, név, szint, canDelete = true, warning = false, onEdit, onDelete }: {
  ctx: SectionContext;
  név: string;
  szint: number;
  canDelete?: boolean;
  warning?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const infoKey = `kep-${név}`;
  return (
    <MisztikusRow
      név={név} szint={szint} maxSzint={ctx.maxSzint} canDelete={canDelete}
      warning={warning} gameMode={ctx.gameMode}
      infoOpen={ctx.infoTarget === infoKey}
      onInfoToggle={() => ctx.onInfoToggle(infoKey)}
      def={ctx.findDef(név)}
      kit={ctx.kiterjesztesek[név] as KiterjesztesEntry[] | undefined}
      felvettFortelyok={ctx.felvettFortelyok}
      onEdit={onEdit} onDelete={onDelete}
    />
  );
}
