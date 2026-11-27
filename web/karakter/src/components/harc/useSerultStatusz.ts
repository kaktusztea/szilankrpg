import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Session } from '../../engine/types';
import { calcSérültFok } from '../../engine/harc/ep-logic';
import { autoStátuszSession } from '../../engine/statusz';

/**
 * Az ÉP-rubrikák kitöltöttsége szerinti „sérült (N)" státusz automatikus karbantartása a session-ben. Közös logika:
 * `autoStátuszSession` (engine/statusz.ts) - a kézzel felvett, magasabb Sérült fok megmarad, az ÉP-fok megszűnésekor
 * a kézi fok áll vissza (`session.auto_státuszok.sérült`).
 */
export function useSérültStátusz(sebCount: number, oszlopMéret: number, kategóriák: number, setSession: Dispatch<SetStateAction<Session>>) {
  useEffect(() => {
    const célFok = calcSérültFok(sebCount, oszlopMéret, kategóriák);
    setSession(prev => autoStátuszSession(prev, 'sérült', célFok));
    // Only on wound change: a manual status edit in between is kept (becomes the new `alatta`).
  }, [sebCount, oszlopMéret, kategóriák]); // eslint-disable-line react-hooks/exhaustive-deps -- only on wound change, must not override manual status edits
}
