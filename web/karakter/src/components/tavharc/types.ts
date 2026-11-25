import type { Karakter, Kepzettseg } from '../../engine/types';
import type { TavfegyverAlap } from '../../engine/data-types';
import type { SessionProps } from '../session-props';

export interface TavharcProps extends SessionProps {
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  képzettségek: Kepzettseg[];
  setKépzettségek: React.Dispatch<React.SetStateAction<Kepzettseg[]>>;
  gameMode: boolean;
  /** ProbaHub CÉ chip: if 'célzó', the Távharc tab flashes the CÉ-SP-VÉ box (then consumes it). */
  pendingDobás?: 'célzó' | null;
  onPendingDobásConsumed?: () => void;
}

export interface VirtuálisFegyver {
  alap: string;
  locked: boolean;
}

export interface AlkalmatlanInfo {
  nevek: string[];
  def: TavfegyverAlap | undefined;
  alkalmiTárgyNév: string | null;
  alkalmiTárgyDef: TavfegyverAlap | undefined;
}

/** CÉ részletes összetevők (Részletek box-hoz és kalkulációhoz) */
export interface CÉBontás {
  céAlap: number;
  önuralom: number;
  CM: number;
  harcmodorCÉ: number;
  harcmodorNév: string;
  harcmodorSzint: number;
  fegyverCÉ: number;
  mfCÉ: number;
  idea: number;
  fortélyCÉ: number;
  cé: number;
  osztó: number;
  isMágikus: boolean;
  mágikusTulajdonságCÉ: number;
}

/** Popup állapotok (TavharcScreen state csomagolás) */
export interface TavharcPopupState {
  mfTarget: number | null;
  deleteTarget: number | null;
  ideaPopup: number | null;
  távolságPopup: boolean;
}
