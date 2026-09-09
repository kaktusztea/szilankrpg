import { előnyHátrányLabel, type ProbaDobás } from '../../engine/dice';

export { előnyHátrányLabel };

/**
 * Próba (Tulajdonság- és Képzettségpróba) közös logikája és típusai.
 * A két popup (`TulajdonsagProbaPopup`, `KepzettsegProbaPopup`) csak a kockában
 * és a bázisértékben tér el, a szabálylogika közös (§37).
 */

/** Előny/Hátrány választható szintek (mindkét próbatípusnál azonos skála). */
export const ELŐNY_HÁTRÁNY_SZINTEK: { szint: number; label: string }[] =
  [-2, -1, 0, 1, 2].map(szint => ({ szint, label: előnyHátrányLabel(szint) || '—' }));

/** Lehetetlen a próba: a bázis + a kocka MAXIMUMA sem éri el a célszámot. */
export function probaLehetetlen(bázis: number, maxDobás: number, célszám: number): boolean {
  return bázis + maxDobás < célszám;
}

/** Biztos siker: a bázis + a kocka MINIMUMA (1) is eléri a célszámot. */
export function probaBiztosSiker(bázis: number, célszám: number): boolean {
  return bázis + 1 >= célszám;
}

/** Egy sor az összetett próba eredményében (elsődleges/másodlagos képzettség vagy tulajdonság). */
export interface ÖsszetettSor {
  label: string;
  célszám: number;
  dobás: ProbaDobás;
  /** bázis (tul [+ szint] [+ vállalás]) + a dobás eredménye */
  összeg: number;
  siker: boolean;
}

/** Összetett próba: minden sornak sikerülnie kell. */
export interface ÖsszetettEredmény {
  sorok: ÖsszetettSor[];
  összSiker: boolean;
}
