import type { Karakter, FegyverAlap } from './types';
import type { KonstansokRaw } from './data-types';

/**
 * Mesterfegyver fok keresés név alapján (case-insensitive).
 * A `Mesterfegyver` fortély `spec_elem`-je vagy a megjelenített névvel, vagy a
 * fegyver alapnevével egyezik — mindkettő elfogadott.
 */
export function findMfFokByName(karakter: Karakter, fegyverNév: string, alap: string): number {
  const entry = karakter.fortélyok.find(f => f.név === 'Mesterfegyver' && (
    f.spec_elem?.toLowerCase() === fegyverNév.toLowerCase() ||
    f.spec_elem?.toLowerCase() === alap.toLowerCase()
  ));
  return entry?.fok ?? 0;
}

/**
 * Mesterfegyver fok keresés fegyver alapnévből: a fegyvertáblából a `név` mezőt oldja fel.
 * (A régi rendszerben az "Alapnév" a másfélkezes-pár közös megjelenítendő nevét adta —
 * az új generátor-modellben egy fegyvernek nincs külön 1K/2K rekordja, a `módok[]` tömb
 * tartja mindkét variánst egy `név` alatt, tehát a lookup mindig a fegyver saját nevét adja.)
 */
export function findMfFok(karakter: Karakter, fegyverek: FegyverAlap[], alap: string): number {
  const fDef = fegyverek.find(d => d.név.toLowerCase() === alap.toLowerCase());
  return findMfFokByName(karakter, fDef?.név || alap, alap);
}

/** MF bónusz lookup fokszám alapján. */
export function getMfBónusz(konstansok: Pick<KonstansokRaw, 'mesterfegyver_bónuszok'>, fok: number): { TÉ: number; VÉ: number; SP: number } {
  return konstansok.mesterfegyver_bónuszok.find(b => b.fok === fok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
}
