import { describe, it, expect } from 'vitest';
import { előnyHátrányLabel, ELŐNY_HÁTRÁNY_SZINTEK, probaLehetetlen, probaBiztosSiker } from './proba-common';

describe('előnyHátrányLabel', () => {
  it('címkék', () => {
    expect(előnyHátrányLabel(1)).toBe('Előny+1');
    expect(előnyHátrányLabel(2)).toBe('Előny+2');
    expect(előnyHátrányLabel(-2)).toBe('Hátrány-2');
    expect(előnyHátrányLabel(0)).toBe('');
  });
});

describe('ELŐNY_HÁTRÁNY_SZINTEK', () => {
  it('-2..+2, a 0 semleges jellel', () => {
    expect(ELŐNY_HÁTRÁNY_SZINTEK.map(e => e.szint)).toEqual([-2, -1, 0, 1, 2]);
    expect(ELŐNY_HÁTRÁNY_SZINTEK.map(e => e.label)).toEqual(['Hátrány-2', 'Hátrány-1', '—', 'Előny+1', 'Előny+2']);
  });
});

describe('probaLehetetlen / probaBiztosSiker', () => {
  it('k10: a bázis + 10 sem éri el a célszámot → lehetetlen', () => {
    expect(probaLehetetlen(5, 10, 16)).toBe(true);
    expect(probaLehetetlen(5, 10, 15)).toBe(false);
  });
  it('k6: a bázis + 6 sem éri el a célszámot → lehetetlen', () => {
    expect(probaLehetetlen(3, 6, 10)).toBe(true);
    expect(probaLehetetlen(3, 6, 9)).toBe(false);
  });
  it('biztos siker, ha a bázis + 1 is elég', () => {
    expect(probaBiztosSiker(9, 10)).toBe(true);
    expect(probaBiztosSiker(9, 11)).toBe(false);
  });
});
