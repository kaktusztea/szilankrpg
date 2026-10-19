import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';

/** Egy fegyver-mód (Aktor) kiszámított harcértékei. */
export interface FegyverResultMód {
  aktor: string;
  jelleg: string;
  sebzéstípus: 'elsődleges' | 'másodlagos';
  Forgatás: string;
  TÉ: number;
  VÉ: number;
  SP: number;
  Átütés: number;
  támadások: number;
  harckeret: number;
  sebesség: number;
  alap_TÉ: number;
  alap_VÉ: number;
  /** A Mesterfegyver-bónusz TÉ/VÉ része - a fegyver-járulék post-szorzóhoz (Beszorítva). */
  mf_TÉ: number;
  mf_VÉ: number;
  /** Az SP-ben lévő Erőbónusz (min(Erő, mód Erőlimit) × (1 + fortély-arány), FLOOR) - a Sebzés popup bontásához. */
  sp_erőbónusz: number;
  /** Az SP-ben lévő Mesterfegyver-bónusz (konstansok.mesterfegyver_bónuszok) - a Sebzés popup bontásához. */
  sp_mf: number;
  // Harckeret részletezés
  hk_harcmodor: number;
  hk_gyorsaság: number;
  hk_mgt: number;
  hk_fortély: number;
}

/** Egy fegyver összesített eredménye: az elsődleges mód adatai a gyökéren (táblázat-nézet),
 * PLUSZ az összes mód listája (`módok`) a Támadó dobás mód-választójához. */
export interface FegyverResult extends FegyverResultMód {
  fegyver_név: string;
  /** Példány-becenév (FegyverPeldany.név) - ha nem üres, a megjelenítésben felülírja a fegyver_név-et. */
  becenév?: string;
  fegyverhossz: number;
  módok: FegyverResultMód[];
  /** Erre a fegyverre ható aktív tiltás-id-k (pl. "belharc_fegyverhossz") - figyelmeztetéshez (§42.4). */
  tiltások?: string[];
  /** A sorra ható fortély-módosítók (soronként kiértékelt feltételekkel, pl. Belharcos, Pajzshasználat) - bontáshoz. */
  fortély?: Record<string, number>;
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
  /** A ProbaHub 🗡️ chipje: ha 'támadó', a Harc fül mountkor megnyitja a Támadó dobás popupot (majd consume). */
  pendingDobás?: 'támadó' | 'manőver' | null;
  onPendingDobásConsumed?: () => void;
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
  /** Harci helyzetek saját oldali harcérték-módosítói (pl. Láthatatlan VÉ +10) - §42 effekt-gyűjtő. */
  helyzetMods: Record<string, number>;
  /** Harci helyzetek `vé_csökkentés` flat bővítései forrás-bontással (pl. Meglepetés +2). */
  helyzetVéCsökkentés: { forrás: string; érték: number }[];
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
