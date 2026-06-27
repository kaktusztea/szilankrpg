import type { GameData } from '../../engine/data-loader';
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

export interface KépzettségActions {
  addKépzettség: (név: string) => void;
  removeKépzettség: (név: string) => void;
  setSzint: (név: string, szint: number) => void;
}
