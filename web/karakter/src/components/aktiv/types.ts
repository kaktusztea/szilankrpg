import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';

export interface AktivBaseProps {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[]) => void;
}
