import type { GameData } from './data-types';
import type { Session } from './types';
import { helyzetDef, taktikaDef } from './lookup';

export function buildAktívFeltételek(session: Session, data: GameData): Set<string> {
  const s = new Set<string>();
  s.add(`fegyverfogás:${session.fegyverfogás}`);
  for (const at of session.aktív_taktikák) {
    const def = taktikaDef(data, at.név);
    if (def) s.add(def.feltétel_kulcs);
  }
  for (const h of session.aktív_helyzetek) {
    const def = helyzetDef(data, h);
    if (def) s.add(def.feltétel_kulcs);
  }
  return s;
}
