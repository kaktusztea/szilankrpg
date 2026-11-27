import type { Karakter } from '../../engine/types';
import type { SessionProps } from '../session-props';

export interface HarcBaseProps extends SessionProps {
  setKarakter?: React.Dispatch<React.SetStateAction<Karakter | null>>;
  onNavigate?: (tabId: string) => void;
  gameMode?: boolean;
  /** A ProbaHub 🗡️ chipje: ha 'támadó', a Harc fül mountkor megnyitja a Támadó dobás popupot (majd consume). */
  pendingDobás?: 'támadó' | 'manőver' | 'ké' | null;
  onPendingDobásConsumed?: () => void;
}
