import { előnyHátrányLabel, EH_SZINT_MIN, EH_SZINT_MAX, type ProbaDobás } from '../../engine/dice';
import type { PróbaKonstansok } from '../../engine/data-types';

export { előnyHátrányLabel };

/**
 * Próba (Tulajdonság- és Képzettségpróba) közös logikája és típusai (§37).
 * A két popup (`TulajdonsagProbaPopup`, `KepzettsegProbaPopup`) csak a kockában, a bázisértékben és a
 * `konstansok.próba.<típus>` paraméterekben tér el - a szabálylogika és a dobás-állapot (`useProbaDobas`) közös.
 */

/** Előny/Hátrány választható szintek (mindkét próbatípusnál azonos skála). */
export const ELŐNY_HÁTRÁNY_SZINTEK: { szint: number; label: string }[] =
  Array.from({ length: EH_SZINT_MAX - EH_SZINT_MIN + 1 }, (_, i) => EH_SZINT_MIN + i)
    .map(szint => ({ szint, label: előnyHátrányLabel(szint) || '-' }));

/** Tulajdonság-kulcs → felirat ("erő" → "Erő"). */
export function tulLabel(kulcs: string): string {
  return kulcs.charAt(0).toUpperCase() + kulcs.slice(1);
}

/** Lehetetlen a próba: a bázis + a kocka MAXIMUMA sem éri el a célszámot. */
export function probaLehetetlen(bázis: number, maxDobás: number, célszám: number): boolean {
  return bázis + maxDobás < célszám;
}

/** Biztos siker: a bázis + a kocka MINIMUMA (1) is eléri a célszámot. */
export function probaBiztosSiker(bázis: number, célszám: number): boolean {
  return bázis + 1 >= célszám;
}

/** Sikeres próba: bázis + dobás ≥ célszám. */
export function probaSiker(bázis: number, dobás: number, célszám: number): boolean {
  return bázis + dobás >= célszám;
}

/** Sima próba eredmény-felirata; `kiemeltKülönbség`: ekkora eltérés a célszámtól Kiemelt siker / kudarc. */
export function eredményFelirat(eredmény: number, célszám: number, kiemeltKülönbség: number): string {
  if (eredmény >= célszám) return eredmény - célszám >= kiemeltKülönbség ? '⚜️ Kiemelt siker' : 'Siker';
  return célszám - eredmény >= kiemeltKülönbség ? '⚜️ Kiemelt kudarc' : 'Sikertelen';
}

/** Képzettség-helyettesítés: a helyettesítő képzettség szintjéből adódó érték (FLOOR(szint / osztó), max). */
export function helyettesítésSzint(szint: number, h: PróbaKonstansok['helyettesítés']): number {
  return Math.min(h.max, Math.floor(szint / h.osztó));
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

/** Összetett próba célszámai: elsődleges + N db másodlagos (célszám - levonás). */
export function összetettCélszámok(nehézség: number, másodlagosDb: number, levonás: number): { label: string; célszám: number }[] {
  return [
    { label: 'Elsődleges', célszám: nehézség },
    ...Array.from({ length: másodlagosDb }, () => ({ label: 'Másodlagos', célszám: nehézség - levonás })),
  ];
}

/** Összetett próba kiértékelése: a dobások sorrendben az összetettCélszámok soraihoz. */
export function összetettEredmény(bázis: number, dobások: ProbaDobás[], célok: { label: string; célszám: number }[]): ÖsszetettEredmény {
  const sorok = célok.map((c, i) => {
    const összeg = bázis + dobások[i].eredmény;
    return { ...c, dobás: dobások[i], összeg, siker: összeg >= c.célszám };
  });
  return { sorok, összSiker: sorok.every(s => s.siker) };
}

/** Kézi összetett dobásnál a következő dobás felirata (null, ha nincs folyamatban). */
export function összetettKéziFelirat(másodlagosDb: number, gyűjtött: number): string | null {
  if (másodlagosDb <= 0 || gyűjtött >= másodlagosDb + 1) return null;
  return gyűjtött === 0 ? 'Elsődleges' : `Másodlagos ${gyűjtött}/${másodlagosDb}`;
}
