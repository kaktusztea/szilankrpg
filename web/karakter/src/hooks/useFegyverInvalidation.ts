import { useEffect } from 'react';
import type { Karakter } from '../engine/types';

/**
 * Ha egy épp AKTÍV fegyvert „Felszerelésben: nem"-re állítanak (nincs a karakternél), a Harc fül
 * essen vissza Puszta kézre: a hivatkozó session-index(ek) reset (-1), kétkezes/fogás alaphelyzet.
 * (A `removeFegyver` session-takarítás mintájára - l. useKarakterMutators.ts.)
 */
export function useFegyverInvalidation(
  karakter: Karakter | null,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  useEffect(() => {
    if (!karakter) return;
    const s = karakter.session;
    const kizárt = (idx: number) => idx >= 0 && karakter.fegyverek[idx]?.felszerelésben === false;

    const jobbKizárt = kizárt(s.aktív_fegyver_index);
    const balKizárt = kizárt(s.aktív_fegyver_bal_index);
    if (!jobbKizárt && !balKizárt) return;

    setKarakter(prev => {
      if (!prev) return prev;
      const ps = prev.session;
      const next = { ...ps };
      if (kizárt(ps.aktív_fegyver_index)) {
        // Jobb kéz kiesett → Puszta kéz, egyfegyveres alaphelyzet.
        next.aktív_fegyver_index = -1;
        next.aktív_fegyver_bal_index = -1;
        next.kétkezes_harc = false;
        next.fegyverfogás = 'egyfegyveres';
      } else if (kizárt(ps.aktív_fegyver_bal_index)) {
        // Csak a bal kéz esett ki → bal reset, kétkezes vége.
        next.aktív_fegyver_bal_index = -1;
        next.kétkezes_harc = false;
      }
      return { ...prev, session: next };
    });
  }, [karakter?.fegyverek, setKarakter]);
}
