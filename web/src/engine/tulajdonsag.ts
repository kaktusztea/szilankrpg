import type { Tulajdonsagok } from './types';

export interface TulajdonsagResult {
  keret: number;
  elköltött: number;
  maradék: number;
  valid: boolean;
}

export function calcTulajdonsagPontok(
  tulajdonságok: Tulajdonsagok,
  tsz: number,
  pontTábla: Record<number, number>,
  alap: number,
): TulajdonsagResult {
  const keret = alap + Math.floor(tsz / 2);
  const values = Object.values(tulajdonságok) as number[];
  const elköltött = values.reduce((sum, v) => sum + (pontTábla[v] ?? 0), 0);
  const maradék = keret - elköltött;
  return { keret, elköltött, maradék, valid: maradék >= 0 };
}
