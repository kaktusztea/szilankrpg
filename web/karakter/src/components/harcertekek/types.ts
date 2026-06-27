import type { GameData } from '../../engine/data-loader';
import type { Karakter, FegyverPeldany, PancelPeldany } from '../../engine/types';

export interface HarcertekekProps {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  gameMode: boolean;
}

export type PopupType = 'struktúra' | 'fémalapanyag' | 'kidolgozottság' | 'méret' | 'végtagvédettség' | 'rongálódás' | 'merevvért';

export type { GameData, Karakter, FegyverPeldany, PancelPeldany };
