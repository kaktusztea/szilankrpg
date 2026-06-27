import type { GameData } from './data-types';
import type { Session } from './types';

export function buildAktívFeltételek(session: Session, data: GameData): Set<string> {
  const s = new Set<string>();
  s.add(`fegyverfogás:${session.fegyverfogás}`);
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (def) s.add(def.feltétel_kulcs);
  }
  for (const h of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(d => d.név === h);
    if (def) s.add(def.feltétel_kulcs);
  }
  return s;
}
