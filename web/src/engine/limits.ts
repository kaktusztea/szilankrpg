import type { Aranyok } from './types';

// §14: Manőver Pont
export function calcManoverPont(harcmodorSzintek: number[], tsz: number): number {
  const összeg = harcmodorSzintek.reduce((s, v) => s + v, 0);
  return 2 * Math.ceil(összeg / tsz);
}

// §15: Felszerelés MGT
export function calcFelszerelésMgt(tárgyakMGT: number[], erő: number): number {
  const keret = 2 + erő;
  const terhelés = tárgyakMGT.reduce((s, v) => s + v, 0);
  return Math.max(0, terhelés - keret);
}

// §18: HM / CM limitek
export function calcMaxHM(harciFortelyFokok: number, harcmodorSzintek: number[], alakzatharcSzint: number): number {
  return harciFortelyFokok + harcmodorSzintek.reduce((s, v) => s + v, 0) + alakzatharcSzint;
}

export function calcMaxCM(tsz: number, arányok: Aranyok): number {
  return tsz * arányok.max_cm_perszint;
}

export function calcMaxHMDiff(tsz: number): number {
  return Math.floor(tsz / 2);
}

// §19: Képzettség limitek
export function calcMaxKepzettsegSzint(primer: boolean, tsz: number, arányok: Aranyok): number {
  const base = primer ? tsz : tsz + arányok.képzettség_nemprimer_max_szint_plusz;
  return Math.min(arányok.képzettség_max_szint, base);
}
