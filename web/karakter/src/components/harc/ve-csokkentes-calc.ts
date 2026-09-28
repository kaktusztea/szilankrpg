/**
 * Sikertelen támadás VÉ csökkentésének kalkulációja (harcszimulacio.spec.md §5.3).
 *
 * VÉ csökkentés = Fegyverviszony bázisérték + k20P(a Támadó dobás k20-ja).
 * A k20P mindig a már eldobott támadó k20-ból jön (közös kocka, §13.1 - 2026-09-26 döntés),
 * nincs külön dobás.
 */
import { k20P } from '../../engine/dice';

export type Fegyverviszony = 'fegyverhátrány' | 'fegyverazonosság' | 'fegyverelőny';

export interface VéCsökkentésEredmény {
  fegyverviszony: Fegyverviszony;
  bázis: number;
  k20: number;
  k20p: number;
  végső: number;
}

/**
 * @param fegyverviszony a választott Fegyverviszony (Fegyverhátrány/Fegyverazonosság/Fegyverelőny)
 * @param k20 a Támadó dobás k20 eredménye (1-20), amiből a k20P adódik
 * @param alapTáblázat a konstansok.yaml `vé_csökkentés_alap` táblája
 */
export function calcVéCsökkentés(
  fegyverviszony: Fegyverviszony,
  k20: number,
  alapTáblázat: Record<Fegyverviszony, number>,
): VéCsökkentésEredmény {
  const bázis = alapTáblázat[fegyverviszony];
  const k20p = k20P(k20);
  return { fegyverviszony, bázis, k20, k20p, végső: bázis + k20p };
}
