import type { Kepzettseg } from '../../engine/types';
import type { GameData, KepzettsegDef, KiterjesztesEntry, FortelySummary } from '../../engine/data-loader';
import type { Karakter, Fortely, Tulajdonsagok } from '../../engine/types';

export interface MisztikusScreenProps {
  data: GameData;
  karakter: Karakter;
  képzettségek: Kepzettseg[];
  setKépzettségek: React.Dispatch<React.SetStateAction<Kepzettseg[]>>;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  gameMode: boolean;
}

/** Shared context for all Misztikus section components */
export interface SectionContext {
  maxSzint: number;
  gameMode: boolean;
  infoTarget: string | null;
  onInfoToggle: (key: string) => void;
  /** A misztikus modulban a „név" paraméterek képzettség hivatkozási KULCSok (pl. "tradíció/Vulgármágia"). */
  findDef: (kulcs: string) => KepzettsegDef | undefined;
  /** Kulcs → teljes megjelenített név ("Tradíció: Vulgármágia", "Arkánum: Asztrálmágia"). */
  név: (kulcs: string) => string;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  fortélyFokok: Record<string, number>;
  tulajdonságok: Tulajdonsagok;
}

/** Popup state managed by useMisztikusPopups hook */
export interface PopupState {
  deleteTarget: string | null;
  szintTarget: string | null;
  promptTarget: string | null;
  promptValue: string;
  tradícióPicker: boolean;
  tradícióAltípusPicker: string | null;
  felvételDef: FortelySummary | null;
  misztFokTarget: number | null;
  deleteFortIdx: number | null;
  mágiaAkarata: boolean;
}

export interface TradícióOpció {
  név: string;
  típus: string;
  altípusok: { név: string; leírás?: string; pantheon?: string }[];
}
