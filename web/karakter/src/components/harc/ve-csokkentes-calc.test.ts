import { describe, it, expect } from 'vitest';
import { calcVéCsökkentés } from './ve-csokkentes-calc';

const alapTáblázat = { fegyverhátrány: 0, fegyverazonosság: 1, fegyverelőny: 2 };

describe('calcVéCsökkentés', () => {
  it('fegyverhátrány + páratlan k20 → bázis 0 + k20P 0', () => {
    const r = calcVéCsökkentés('fegyverhátrány', 5, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverhátrány', bázis: 0, k20: 5, k20p: 0, végső: 0 });
  });

  it('fegyverazonosság + páros k20 → bázis 1 + k20P 1', () => {
    const r = calcVéCsökkentés('fegyverazonosság', 16, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverazonosság', bázis: 1, k20: 16, k20p: 1, végső: 2 });
  });

  it('fegyverelőny + k20=20 → bázis 2 + k20P 2 (maximum)', () => {
    const r = calcVéCsökkentés('fegyverelőny', 20, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverelőny', bázis: 2, k20: 20, k20p: 2, végső: 4 });
  });

  it('fegyverelőny + k20=10 → k20P is 2 (a speciális eset, nem csak a 20-as)', () => {
    const r = calcVéCsökkentés('fegyverelőny', 10, alapTáblázat);
    expect(r.k20p).toBe(2);
    expect(r.végső).toBe(4);
  });
});
