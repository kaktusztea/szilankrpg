import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { FegyverResult } from '../HarcCalc';

export interface HarcBaseProps {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string) => void;
  onNavigate?: (tabId: string) => void;
}

export interface HarcComputed {
  ké: number;
  épValue: number;
  manöverPont: number;
  sfé_fizikai: number;
  sfé_energia: number;
  páncélLefedettség: number;
  taktikaMods: Record<string, number>;
  fortelyMods: Record<string, number>;
  fegyverResults: FegyverResult[];
  kétkezesResult: (FegyverResult & { sumPengehossz: number }) | null;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
  pajzsVÉ: number;
  pajzsFegyverNév: string | null;
  belharciAktív: boolean;
  maxVéCsökk: number;
  oszlopMéret: number;
  téLevonások: number[];
  feltételTeljesül: (feltétel: unknown) => boolean;
}
