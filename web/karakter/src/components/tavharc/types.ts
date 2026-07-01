import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, TavfegyverAlap } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';

export interface TavharcProps {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  gameMode: boolean;
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
  ideaPopup: boolean;
  távolságPopup: boolean;
}
