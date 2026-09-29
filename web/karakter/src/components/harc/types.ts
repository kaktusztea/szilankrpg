import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';

/** Egy fegyver-mód (Aktor) kiszámított harcértékei. */
export interface FegyverResultMód {
  aktor: string;
  jelleg: string;
  sebzéstípus: 'elsődleges' | 'másodlagos';
  TÉ: number;
  VÉ: number;
  SP: number;
  Átütés: number;
  támadások: number;
  harckeret: number;
  sebesség: number;
  alap_TÉ: number;
  alap_VÉ: number;
  // Harckeret részletezés
  hk_harcmodor: number;
  hk_gyorsaság: number;
  hk_mgt: number;
  hk_felszerelés_mgt: number;
  hk_fortély: number;
}

/** Egy fegyver összesített eredménye: az elsődleges mód adatai a gyökéren (táblázat-nézet),
 * PLUSZ az összes mód listája (`módok`) a Támadó dobás mód-választójához. */
export interface FegyverResult extends FegyverResultMód {
  fegyver_név: string;
  fegyverhossz: number;
  módok: FegyverResultMód[];
}

export interface HarcBaseProps {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  setKarakter?: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  onNavigate?: (tabId: string) => void;
  gameMode?: boolean;
}

export interface HarcComputed {
  ké: number;
  épValue: number;
  manöverPont: number;
  manőverAlap: number;
  sfé_fizikai: number;
  sfé_energia: number;
  páncélLefedettség: number;
  páncélMGT: number;
  merevvértBüntetés: number;
  taktikaMods: Record<string, number>;
  fortelyMods: Record<string, number>;
  fegyverResults: FegyverResult[];
  kétkezesResult: (FegyverResult & { sumFegyverhossz: number }) | null;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
  pajzsVÉ: number;
  véVeszSzorzó: number;
  véVeszSzorzóForrás: string;
  pajzsFegyverNév: string | null;
  belharciAktív: boolean;
  maxVéCsökk: number;
  oszlopMéret: number;
  téLevonások: number[];
  feltételTeljesül: (feltétel: unknown) => boolean;
  extraKontextus: import('./extrak-info-calc').ExtraKontextus;
}
