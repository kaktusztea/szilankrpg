import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';

export interface AktivBaseProps {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string) => void;
}
