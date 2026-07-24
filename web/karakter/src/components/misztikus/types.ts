import type { GameData, KepzettsegDef, KiterjesztesEntry, FortelySummary } from '../../engine/data-loader';
import type { Karakter, Fortely } from '../../engine/types';

export interface MisztikusScreenProps {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
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
  findDef: (név: string) => KepzettsegDef | undefined;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  felvettFortelyok: string[];
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
