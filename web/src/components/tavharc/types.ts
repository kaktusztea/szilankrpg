import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, TavfegyverAlap } from '../../engine/types';

export interface TavharcProps {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
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

export type { GameData, Karakter, Session, TavfegyverAlap };
