import type { GameData, KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import type { PróbaEnyhítés, PróbaKonstansok, StatuszEntry } from '../../engine/data-types';
import type { Tulajdonsagok, Karakter, Kepzettseg } from '../../engine/types';

/** A karakter egy képzettsége (engine/types Kepzettseg). */
export type KepzettsegSlot = Kepzettseg;

export interface Props {
  data: GameData;
  gameMode: boolean;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  tulajdonságok: Tulajdonsagok;
  setTulajdonságok: React.Dispatch<React.SetStateAction<Tulajdonsagok>>;
  képzettségek: KepzettsegSlot[];
  setKépzettségek: React.Dispatch<React.SetStateAction<KepzettsegSlot[]>>;
  név: string;
  setNév: (v: string) => void;
  becenév: string;
  setBecenév: (v: string) => void;
  jk: boolean;
  setJk: (v: boolean) => void;
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
  onTestReset?: () => void;
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
  fortélyFokok: Record<string, number>;
  többszörösNevek: ReadonlySet<string>;
  negáltKulcsok: ReadonlySet<string>;
  onToggleNegál: (fortélyNév: string) => void;
  tulajdonságok: Tulajdonsagok;
  képzettségek: KepzettsegSlot[];
  aktívStátuszok: string[];
  statuszDefs: StatuszEntry[];
  próbaEnyhítések: PróbaEnyhítés[];
  /** Fortély szituációs próba-bónuszai erre a képzettségre (kapcsolható „Fortélyok" tábla a popupban). */
  fortélyBónuszok?: { érték: number; leírás: string }[];
  /** Képzettség-definíciók (id → név feloldás a próba-popupban). */
  kepzettsegDefs: KepzettsegDef[];
  /** Felszerelés-túlterhelés Hátrány (Fizikai csoportnál), különben 0/false. */
  felszEH?: number;
  felszNemHarcol?: boolean;
  /** konstansok.próba - a Képzettségpróba popuphoz. */
  próba: PróbaKonstansok;
}
