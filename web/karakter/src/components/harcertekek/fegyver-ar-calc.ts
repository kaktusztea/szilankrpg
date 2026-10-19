import type { KonstansokRaw } from '../../engine/data-types';

type ÁrKonstansok = Pick<KonstansokRaw, 'alapanyag_ár_szorzó' | 'ár_szorzó_idea'>;

/**
 * Fegyver példány ár-szorzó (md/068_01_05_fegyverek_ara.md):
 *   ár = ár_alap × alapanyag_ár_szorzó[anyag] × idea_szorzó
 * Az `ár_alap` a fegyver fix felépítésének alapára (ár-osztály × fejdarab × hossz), amit a
 * generátor számol a v2 JSON-ba. A webapp csak a hangolható tengelyeket (anyag, idea) teszi rá -
 * nem ismeri az ár-osztály/fejdarab logikát. Ismeretlen anyag/idea → 1 (semleges), hogy a chip ne
 * dobjon NaN-t (trust boundary: a karakter localStorage-ból jöhet elavult értékkel). `ár_alap` null
 * (fixed fegyver, nincs ár-modell) → null (a chip nem jelenít árat).
 */
export function fegyverÁr(árAlap: number | null, anyag: string, idea: number, k: ÁrKonstansok): number | null {
  if (árAlap == null) return null;
  const anyagSzorzó = k.alapanyag_ár_szorzó[anyag] ?? 1;
  const ideaSzorzó = k.ár_szorzó_idea.find(r => r.idea === idea)?.ár_szorzó ?? 1;
  return árAlap * anyagSzorzó * ideaSzorzó;
}
