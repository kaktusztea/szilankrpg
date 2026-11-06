import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, UndoPatch } from '../../engine/types';

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
