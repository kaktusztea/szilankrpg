import { useEffect } from 'react';
import type { Karakter } from '../engine/types';
import { fortélyFok } from '../engine/azonosito';
import type { GameData } from '../engine/data-loader';
import { isTaktikaAllowed } from '../engine/taktika/taktika-megkotes';
import { taktikaDef } from '../engine/lookup';

export function useTaktikaInvalidation(
  karakter: Karakter | null,
  data: GameData | null,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  const session = karakter?.session;
  useEffect(() => {
    if (!karakter || !data) return;
    const session = karakter.session;
    let changed = false;
    const újTaktikák = session.aktív_taktikák.filter(at => {
      const def = taktikaDef(data, at.név);
      // Megkötés/szűrő (fegyver, harcmodor, helyzet, szűrő_harcmodorok): ha már nem engedélyezett
      // az aktuális fegyver/session mellett (pl. íjról hajítóra váltás → Kitartott célzás), kiesik.
      if (!isTaktikaAllowed(at.név, session, karakter, data)) { changed = true; return false; }
      if (!def?.fokozatos || !def.fokok || at.fok == null) return true;
      const alapMax = def.fokok[def.fokok.length - 1].fok;
      if (at.fok <= alapMax) return true;
      if (!def.fortély_bővítés) { changed = true; return false; }
      const bővítőFok = fortélyFok(karakter.fortélyok, def.fortély_bővítés.fortély);
      const maxFok = alapMax + bővítőFok * def.fortély_bővítés.extra_fokok_per_fok;
      if (at.fok > maxFok) { changed = true; return false; }
      return true;
    });
    if (changed) setKarakter(prev => prev ? { ...prev, session: { ...prev.session, aktív_taktikák: újTaktikák } } : prev);
    // Fegyver/fegyverfogás/helyzet váltás is érvénytelenít (nem csak a fortélyok), ezért ezek is dep-ek.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on the inputs that can invalidate a tactic; full karakter dep would re-run on every edit
  }, [
    karakter?.fortélyok, data, setKarakter,
    session?.aktív_fegyver_index, session?.aktív_fegyver_bal_index, session?.aktív_távfegyver_index,
    session?.fegyverfogás, session?.aktív_helyzetek,
  ]);
}
