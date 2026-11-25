import type { GameData } from '../engine/data-loader';
import type { Karakter, PushUndo, Session, SetSession } from '../engine/types';

/** What a session-editing component (pickers, roll popups, combat tabs) gets from the app. */
export interface SessionProps {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: SetSession;
  pushUndo: PushUndo;
}
