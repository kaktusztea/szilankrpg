import type { GameData, KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import type { Tulajdonsagok, Karakter } from '../../engine/types';

export interface KepzettsegSlot {
  név: string;
  szint: number;
}

export interface Props {
  data: GameData;
  gameMode: boolean;
  karakter: Karakter;
  tulajdonságok: Tulajdonsagok;
  setTulajdonságok: React.Dispatch<React.SetStateAction<Tulajdonsagok>>;
  képzettségek: KepzettsegSlot[];
  setKépzettségek: React.Dispatch<React.SetStateAction<KepzettsegSlot[]>>;
  név: string;
  setNév: (v: string) => void;
  becenév: string;
  setBecenév: (v: string) => void;
  játékos: string;
  setJátékos: (v: string) => void;
  tsz: number;
  setTsz: (v: number) => void;
  kor: number;
  setKor: (v: number) => void;
  faj: string;
  setFaj: (v: string) => void;
  anyanyelv: string;
  setAnyanyelv: (v: string) => void;
}

export interface KepzettsegRowProps {
  slot: KepzettsegSlot;
  gameMode: boolean;
  onSzintChange: (szint: number) => void;
  onRemove: () => void;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  infoOpen: boolean;
  onInfoToggle: () => void;
  displayName: string;
  findDef: (név: string) => KepzettsegDef | undefined;
  overLimit: boolean;
  warning?: boolean;
  felvettFortelyok: string[];
}
