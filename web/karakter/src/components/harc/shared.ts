import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
export { getMfBónusz } from '../../engine/mf-utils';

/** Pajzs fegyver név összerakása a karakter pajzs méretéből. */
export function buildPajzsFegyverNév(karakter: Karakter): string | null {
  if (!karakter.pajzs?.méret) return null;
  return karakter.pajzs.méret.charAt(0).toUpperCase() + karakter.pajzs.méret.slice(1) + ' Pajzs';
}

/** Mesterfegyver fok keresés fegyver név/alap alapján (case-insensitive). */
export function findMfFok(karakter: Karakter, fegyverNév: string, fegyverAlap: string): number {
  const entry = karakter.fortélyok.find(f => f.név === 'Mesterfegyver' && (
    f.spec_elem?.toLowerCase() === fegyverNév.toLowerCase() ||
    f.spec_elem?.toLowerCase() === fegyverAlap.toLowerCase()
  ));
  return entry?.fok ?? 0;
}

/** SP override keresés fegyver definícióból (pl. Természetes fegyver → puszta kéz SP). */
export function calcSpOverride(fegyverNév: string, karakter: Karakter, data: GameData): number | null {
  const fDef = data.fegyverek.find(f => f.Fegyver.toLowerCase() === fegyverNév.toLowerCase());
  if (!fDef?.SP_override) return null;
  const ovr = fDef.SP_override as { fortély: string; SP: number };
  if (karakter.fortélyok.some(kf => kf.név === ovr.fortély)) return ovr.SP;
  return null;
}

/** Nagyobb/kisebb fegyver meghatározása pengehossz szerint. */
export function resolveNagyobbKisebb<T extends { Pengehossz: string }>(
  jobbDef: T, balDef: T, jobbFp: { alap: string }, balFp: { alap: string },
): { nagyobb: T; kisebb: T; nagyobbFp: { alap: string }; kisebbFp: { alap: string }; jobbPenge: number; balPenge: number } {
  const jobbPenge = parseFloat(jobbDef.Pengehossz) || 0;
  const balPenge = parseFloat(balDef.Pengehossz) || 0;
  const jobbNagyobb = jobbPenge >= balPenge;
  return {
    nagyobb: jobbNagyobb ? jobbDef : balDef,
    kisebb: jobbNagyobb ? balDef : jobbDef,
    nagyobbFp: jobbNagyobb ? jobbFp : balFp,
    kisebbFp: jobbNagyobb ? balFp : jobbFp,
    jobbPenge, balPenge,
  };
}

/** Közös TÉ kalkuláció (alap + levonás + taktika + fogás + többtám). */
export function computeTÉ(baseTÉ: number, téLevonás: number, taktikaTÉ: number, fogásTÉ: number, támadások: number, többTámTÉ: number): number {
  return baseTÉ + téLevonás + taktikaTÉ + fogásTÉ + (támadások > 1 ? többTámTÉ : 0);
}

/** Közös VÉ kalkuláció (alap + bónusz + taktika - csökkenés, min 0). */
export function computeVÉ(baseVÉ: number, bónusz: number, taktikaVÉ: number, csökkenés: number): number {
  return Math.max(0, baseVÉ + bónusz + taktikaVÉ - csökkenés);
}
