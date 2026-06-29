import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { getExtraFokok, formatFokMods } from './AktivHelpers';

interface Props {
  fokválasztó: string;
  data: GameData;
  karakter: Karakter;
  session: Session;
  onSelect: (fok: number, isNew: boolean) => void;
}

export function TaktikaFokPicker({ fokválasztó, data, karakter, session, onSelect }: Props) {
  const def = data.taktikak.find(t => t.név === fokválasztó);
  if (!def?.fokok) return null;
  const existing = session.aktív_taktikák.findIndex(a => a.név === fokválasztó);
  const fokok = getExtraFokok(def, karakter);
  const maxBaseFok = def.fokok[def.fokok.length - 1].fok;

  return <>
    {fokok.map(f => (
      <div key={f.fok}
        className={`aktiv-picker-item${existing >= 0 && session.aktív_taktikák[existing].fok === f.fok ? ' active' : ''}`}
        onClick={() => onSelect(f.fok, existing < 0)}>
        <span className="aktiv-picker-item-name">{f.fok}. fok{f.fok > maxBaseFok && <span className="aktiv-extra-fok-dot">●</span>}</span>
        <span className="aktiv-picker-item-details">{formatFokMods(f)}</span>
        {f.hatások?.length > 0 && <span className="aktiv-picker-item-hatas">{f.hatások.map((h: any) => h.megjegyzés || `${h.operátor} ${h.érték ?? ''} ${h.cél}`).join(', ')}</span>}
      </div>
    ))}
  </>;
}
