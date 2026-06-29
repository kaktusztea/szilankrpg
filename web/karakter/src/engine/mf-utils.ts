import type { Karakter, FegyverAlap } from './types';

/** Mesterfegyver fok keresés (canonical, case-insensitive). */
export function findMfFok(karakter: Karakter, fegyverek: FegyverAlap[], alap: string): number {
  const fDef = fegyverek.find(d => d.Fegyver.toLowerCase() === alap.toLowerCase());
  const displayName = fDef?.Alapnév || fDef?.Fegyver || alap;
  const entry = karakter.fortélyok.find(f => f.név === 'Mesterfegyver' && (
    f.spec_elem?.toLowerCase() === displayName.toLowerCase() ||
    f.spec_elem?.toLowerCase() === alap.toLowerCase()
  ));
  return entry?.fok ?? 0;
}

/** MF bónusz lookup fokszám alapján. */
export function getMfBónusz(konstansok: { mesterfegyver_bónuszok: { fok: number; TÉ: number; VÉ: number; SP: number }[] }, fok: number): { TÉ: number; VÉ: number; SP: number } {
  return konstansok.mesterfegyver_bónuszok.find(b => b.fok === fok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
}
