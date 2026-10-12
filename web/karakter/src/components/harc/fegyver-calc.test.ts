import { describe, it, expect } from 'vitest';
import { buildFegyverRows } from './fegyver-calc';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

/**
 * Regresszió: a Mesterfegyver-fok egyeztetés legyen kis/nagybetű-FÜGGETLEN.
 * Korábban a buildFegyverRows egy `f.spec_elem === fp.alap` (case-sensitive) lookupot használt,
 * ami csendben elvesztette a MF-bónuszt, ha a fegyver `alap` és a fortély `spec_elem` betűzése eltért.
 * A bug csak azért nem bukott a golden teszteken, mert ott mindkét oldal azonos (kisbetűs) volt.
 */
describe('buildFegyverRows - Mesterfegyver fok (case-insensitive)', () => {
  const data = {
    fegyverek: [{ név: 'Kard, lovag', idea_default: 0, módok: [] }],
    fegyverIdeaTabla: [],
  } as unknown as GameData;

  function karakterWith(fegyverAlap: string, specElem: string): Karakter {
    return {
      fegyverek: [{ alap: fegyverAlap, név: '', anyag: 'acél', idea: 0, felszerelésben: true }],
      fortélyok: [{ név: 'Mesterfegyver', fok: 2, spec_típus: 'fegyver', spec_elem: specElem }],
    } as unknown as Karakter;
  }

  it('matches MF fok when alap and spec_elem have the SAME casing', () => {
    const rows = buildFegyverRows(karakterWith('Kard, lovag', 'Kard, lovag'), data, null);
    expect(rows.find(r => r.név === 'Kard, lovag')?.mfFok).toBe(2);
  });

  it('matches MF fok when alap and spec_elem have DIFFERENT casing (regression)', () => {
    // fegyver nagybetűs, fortély kisbetűs - a régi === lookup itt 0-t adott.
    const rows = buildFegyverRows(karakterWith('Kard, lovag', 'kard, lovag'), data, null);
    expect(rows.find(r => r.név === 'Kard, lovag')?.mfFok).toBe(2);
  });

  it('no MF fok for an unrelated weapon spec', () => {
    const rows = buildFegyverRows(karakterWith('Kard, lovag', 'Tőr'), data, null);
    expect(rows.find(r => r.név === 'Kard, lovag')?.mfFok).toBe(0);
  });
});
