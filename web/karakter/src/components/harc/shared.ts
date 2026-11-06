import type { Effekt } from '../../engine/effekt';

/** Nagyobb/kisebb fegyver meghatározása fegyverhossz-kategória szerint. */
export function resolveNagyobbKisebb<T extends { fegyverhossz: number }>(
  jobbDef: T, balDef: T, jobbFp: { alap: string }, balFp: { alap: string },
): { nagyobb: T; kisebb: T; nagyobbFp: { alap: string }; kisebbFp: { alap: string }; jobbFh: number; balFh: number } {
  const jobbFh = jobbDef.fegyverhossz;
  const balFh = balDef.fegyverhossz;
  const jobbNagyobb = jobbFh >= balFh;
  return {
    nagyobb: jobbNagyobb ? jobbDef : balDef,
    kisebb: jobbNagyobb ? balDef : jobbDef,
    nagyobbFp: jobbNagyobb ? jobbFp : balFp,
    kisebbFp: jobbNagyobb ? balFp : jobbFp,
    jobbFh, balFh,
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

/**
 * VÉ veszteség szorzó az aktív harci helyzetekből ÉS státuszokból (pl. "Földön fekve",
 * "Helyhez kötve", "VÉ kiterjesztés", Fizikai státusz → duplázás, cél: vé_veszteség).
 * Halmozás: egy félen belül a legnagyobb szorzó számít (engine_spec §42.3).
 * Bemenet: a helyzet- és státusz-gyűjtő effektjei (engine/effekt.ts).
 */
export function véVesztésSzorzó(effektek: Effekt[]): { szorzó: number; forrás: string } {
  // §42.3: egy félen belül a legnagyobb szorzó számít (nem kumulál) - a forrás a nyertes neve.
  let szorzó = 1;
  let forrás = '';
  for (const e of effektek) {
    if (e.cél === 'vé_veszteség' && e.mód === 'szorzó' && (e.érték ?? 1) > szorzó) { szorzó = e.érték!; forrás = e.forrás.név; }
  }
  return { szorzó, forrás };
}

/**
 * VÉ history bejegyzés felfűzése összevonással.
 * Ha az előző változás óta kevesebb mint `ablakMs` telt el ÉS az utolsó bejegyzés
 * azonos irányú (előjelű) mint az új delta, akkor összevonja őket (pl. -3, -1, -1 → -5).
 * Különben új bejegyzésként fűzi hozzá.
 *
 * @param history  eddigi bejegyzések (előjeles: csökkenés negatív, visszanyerés pozitív)
 * @param delta    az új változás előjeles értéke (nem lehet 0)
 * @param elapsedMs  az előző VÉ változás óta eltelt idő (ms); ha nincs korábbi, adj végtelent
 * @param ablakMs  összevonási ablak
 */
export function coalesceVéHistory(history: number[], delta: number, elapsedMs: number, ablakMs: number): number[] {
  const last = history[history.length - 1];
  const azonosIrány = last !== undefined && Math.sign(last) === Math.sign(delta);
  if (azonosIrány && elapsedMs < ablakMs) {
    return [...history.slice(0, -1), last + delta];
  }
  return [...history, delta];
}
