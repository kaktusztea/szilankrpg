import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { akadályÁllapot } from '../../engine/felszereles';

const FIZIKAI_ELŐTAG = 'Fizikai (';

/**
 * Az Akadály-állapot (md/010_03_07) „Fizikai (N)" státuszának automatikus karbantartása a
 * session-ben - a `useSérültStátusz` mintájára. Az `akadályÁllapot` már gate-elt az „úton"
 * kapcsolóval (csak úton=true esetén > 0), így a hatás CSAK ekkor érvényesül.
 *
 * (a) felülír: amíg az Akadály aktív (fok > 0), a „Fizikai" fokát az Akadály adja (a legnagyobb
 * forrás számít, md „nem additív"). Amikor az Akadály 0-ra vált (úton ki VAGY páncél/pajzs le),
 * a hook törli a „Fizikai"-t.
 *
 * ponytail (ismert ceiling): az `aktív_státuszok` sima string-tömb, nincs eredet-jelölés, így a
 * KÉZZEL felvett „Fizikai" (pl. alváshiány) és az Akadály-eredetű nem különböztethető meg. Ezért
 * az Akadály levétele a „Fizikai"-t egységesen törli (a ritka kézi+akadály együttállás elveszik).
 * Upgrade-út: eredet-mező a státusz-modellben, ha ez zavaróvá válik.
 */
export function useAkadalyStatusz(karakter: Karakter | null, data: GameData | null, setSession: Dispatch<SetStateAction<Session>>) {
  const célFok = karakter && data ? akadályÁllapot(karakter, data).állapot : 0;
  const aktívStátuszok = karakter?.session.aktív_státuszok;
  useEffect(() => {
    if (!aktívStátuszok) return;
    const jelenlegi = aktívStátuszok.find(s => s.startsWith(FIZIKAI_ELŐTAG));
    const jelenlegiFok = jelenlegi ? parseInt(jelenlegi.match(/\((\d+)\)/)?.[1] ?? '0', 10) : 0;
    if (célFok === jelenlegiFok) return;
    setSession(prev => {
      const többi = prev.aktív_státuszok.filter(s => !s.startsWith(FIZIKAI_ELŐTAG));
      return { ...prev, aktív_státuszok: célFok === 0 ? többi : [...többi, `Fizikai (${célFok})`] };
    });
    // ponytail: csak a cél-fok változására fut (mint a useSérültStátusz) - a kézi státusz-választást
    // nem írja felül azonnal, csak amikor az Akadály-fok ténylegesen változik.
  }, [célFok]); // eslint-disable-line react-hooks/exhaustive-deps
}
