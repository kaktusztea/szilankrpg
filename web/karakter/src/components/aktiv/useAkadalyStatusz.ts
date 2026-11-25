import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { akadályÁllapot } from '../../engine/felszereles';
import { autoStátuszSession } from '../../engine/statusz';

/**
 * Az Akadály-állapot (md/010_03_07) „Fizikai (N)" státuszának automatikus karbantartása a session-ben - a
 * `useSérültStátusz` mintájára. Az `akadályÁllapot` már gate-elt az „úton" kapcsolóval (csak úton=true esetén > 0).
 * Közös logika: `autoStátuszSession` (engine/statusz.ts) - a kézzel felvett, magasabb Fizikai fok megmarad (md/082:
 * a magasabb fok érvényes), az Akadály megszűnésekor a kézi fok áll vissza (`session.auto_státuszok.fizikai`).
 */
export function useAkadalyStatusz(karakter: Karakter | null, data: GameData | null, setSession: Dispatch<SetStateAction<Session>>) {
  const célFok = karakter && data ? akadályÁllapot(karakter, data).állapot : 0;
  const vanKarakter = !!karakter;
  useEffect(() => {
    if (!vanKarakter) return;
    setSession(prev => autoStátuszSession(prev, 'fizikai', célFok));
    // Only on target-level change: a manual status edit in between is kept (becomes the new `alatta`).
  }, [célFok]); // eslint-disable-line react-hooks/exhaustive-deps -- only on target-level change, must not override manual status choice
}
