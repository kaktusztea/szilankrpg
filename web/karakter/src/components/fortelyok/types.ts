import type { Kepzettseg } from '../../engine/types';
import type { GameData, FortelySummary } from '../../engine/data-loader';
import type { Fortely, Karakter } from '../../engine/types';

export interface FortelyokScreenProps {
  data: GameData;
  gameMode: boolean;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  tsz: number;
  fegyverNevek: string[];
  nyelvtanulásSzint: number;
  képzettségek: Kepzettseg[];
}

export interface FortelyCsoportProps {
  csoport: string;
  csoportLabel: string;
  csoportDefs: FortelySummary[];
  slotok: Fortely[];
  collapsed: boolean;
  gameMode: boolean;
  tsz: number;
  többszörösNevek: Set<string>;
  fortélyok: Fortely[];
  fegyverNevek: string[];
  nyelvtanulásSzint: number;
  nyelvFokLabels: Record<number, string>;
  képzettségek: Kepzettseg[];
  /** A karakter fajának ajánlott fortélyai (max fok) - `faj` követelmény. */
  fajFortélyok: Record<string, number>;
  data: GameData;
  onToggleCollapse: () => void;
  onAddFortely: (név: string) => void;
  onToggleInfo: (globalIdx: number) => void;
  onFokChange: (globalIdx: number, fok: number) => void;
  onRemove: (idx: number) => void;
  onHint: (msg: string) => void;
  infoTarget: string | null;
}

export interface FortelyRowProps {
  slot: Fortely;
  def?: FortelySummary;
  globalIdx: number;
  gameMode: boolean;
  isOpen: boolean;
  isIngyenes: boolean;
  overLimit: boolean;
  kiterjesztHiányos: boolean;
  nyelvPontKeret?: number;
  nyelvFokLabels: Record<number, string>;
  képzettségek: Kepzettseg[];
  fortélyok: Fortely[];
  data: GameData;
  /** A karakter fajának ajánlott fortélyai (max fok) - `faj` követelmény. */
  fajFortélyok: Record<string, number>;
  fegyverHarcmodorNév?: string;
  onToggleInfo: () => void;
  onFokChange: (fok: number) => void;
  onHint: (msg: string) => void;
  onRemove: () => void;
}

export interface DeleteTarget {
  idx: number;
  név: string;
  fok: number;
}

/** Felvétel előtti fortély (kiérdemelt-kérdés): a karakter-fortély alakja fok nélkül. */
export interface SzabadTypePicker {
  id: string;
  elem: string;
  kiterjeszti?: string[];
}
