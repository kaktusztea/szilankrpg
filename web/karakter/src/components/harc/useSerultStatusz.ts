import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Session } from '../../engine/types';
import { calcSérültFok } from '../../engine/harc/ep-logic';

const SÉRÜLT_ELŐTAG = 'sérült (';   // státusz-id (statuszok.yaml)

/** Az ÉP-rubrikák kitöltöttsége szerinti „sérült (N)" státusz automatikus karbantartása a session-ben. */
export function useSérültStátusz(sebCount: number, oszlopMéret: number, aktívStátuszok: string[], setSession: Dispatch<SetStateAction<Session>>) {
  useEffect(() => {
    const célFok = calcSérültFok(sebCount, oszlopMéret);
    const jelenlegi = aktívStátuszok.find(s => s.startsWith(SÉRÜLT_ELŐTAG));
    const jelenlegiFok = jelenlegi ? parseInt(jelenlegi.match(/\((\d+)\)/)?.[1] ?? '0', 10) : 0;
    if (célFok === jelenlegiFok) return;
    setSession(prev => {
      const többi = prev.aktív_státuszok.filter(s => !s.startsWith(SÉRÜLT_ELŐTAG));
      return { ...prev, aktív_státuszok: célFok === 0 ? többi : [...többi, `sérült (${célFok})`] };
    });
    // ponytail: szándékosan csak a seb-szám / oszlopméret változására fut (mint eddig) - a kézi státusz-
    // változtatást nem írja felül azonnal.
  }, [sebCount, oszlopMéret]); // eslint-disable-line react-hooks/exhaustive-deps -- only on wound change, must not override manual status edits
}
