import type { GameData, FortelySummary } from '../../engine/data-loader';
import type { Fortely } from '../../engine/types';

export interface FortelyokScreenProps {
  data: GameData;
  gameMode: boolean;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  tsz: number;
  fegyverNevek: string[];
  távfegyverNevek: string[];
  nyelvtanulásSzint: number;
  képzettségek: { név: string; szint: number }[];
}

export interface FortelyCsoportProps {
  csoport: string;
  csoportLabel: string;
  csoportDefs: FortelySummary[];
  slotok: Fortely[];
  collapsed: boolean;
  gameMode: boolean;
  tsz: number;
  lockedSet: Set<string>;
  többszörösNevek: Set<string>;
  fortélyok: Fortely[];
  fegyverNevek: string[];
  távfegyverNevek: string[];
  nyelvtanulásSzint: number;
  nyelvFokLabels: Record<number, string>;
  képzettségek: { név: string; szint: number }[];
  harcmodorNevek: string[];
  data: GameData;
  onToggleCollapse: () => void;
  onAddFortely: (név: string) => void;
  onToggleInfo: (globalIdx: number) => void;
  onFokChange: (globalIdx: number, fok: number) => void;
  onRemove: (idx: number) => void;
  onHint: (msg: string, duration?: number) => void;
  infoTarget: string | null;
}

export interface FortelyRowProps {
  slot: Fortely;
  def?: FortelySummary;
  globalIdx: number;
  gameMode: boolean;
  isOpen: boolean;
  isIngyenes: boolean;
  locked: boolean;
  overLimit: boolean;
  nyelvPontKeret?: number;
  nyelvFokLabels: Record<number, string>;
  képzettségek: { név: string; szint: number }[];
  fortélyok: Fortely[];
  harcmodorNevek: string[];
  távfegyverNevek: string[];
  fegyverHarcmodorNév?: string;
  onToggleInfo: () => void;
  onFokChange: (fok: number) => void;
  onHint: (msg: string, duration?: number) => void;
  onRemove: () => void;
}

export interface DeleteTarget {
  idx: number;
  név: string;
  fok: number;
}

export interface SzabadTypePicker {
  név: string;
  spec_típus: string;
  spec_elem: string;
}
