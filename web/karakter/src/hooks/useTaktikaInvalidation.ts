import { useEffect } from 'react';
import type { Karakter } from '../engine/types';
import type { GameData } from '../engine/data-loader';

export function useTaktikaInvalidation(
  karakter: Karakter | null,
  data: GameData | null,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  useEffect(() => {
    if (!karakter || !data) return;
    const session = karakter.session;
    let changed = false;
    const újTaktikák = session.aktív_taktikák.filter(at => {
      const def = data.taktikak.find(t => t.név === at.név);
      if (!def?.fokozatos || !def.fokok || at.fok == null) return true;
      const alapMax = def.fokok[def.fokok.length - 1].fok;
      if (at.fok <= alapMax) return true;
      if (!def.fortély_bővítés) { changed = true; return false; }
      const fortélyFok = karakter.fortélyok.find(f => f.név === def.fortély_bővítés!.fortély)?.fok ?? 0;
      const maxFok = alapMax + fortélyFok * def.fortély_bővítés.extra_fokok_per_fok;
      if (at.fok > maxFok) { changed = true; return false; }
      return true;
    });
    if (changed) setKarakter(prev => prev ? { ...prev, session: { ...prev.session, aktív_taktikák: újTaktikák } } : prev);
  }, [karakter?.fortélyok, data, setKarakter]);
}
