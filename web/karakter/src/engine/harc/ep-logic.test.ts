import { describe, it, expect } from 'vitest';
import { buildRubrikák, toSebzések, getNextSorszám, applySeb, applyGyógy, calcSérültFok } from './ep-logic';

describe('buildRubrikák', () => {
  it('creates array of correct length', () => {
    const r = buildRubrikák([], 5);
    expect(r).toHaveLength(5);
    expect(r.every(x => x.típus === '')).toBe(true);
  });
  it('fills from existing sebzések', () => {
    const r = buildRubrikák([{ típus: 'S', sorszám: 1 }], 3);
    expect(r[0]).toEqual({ típus: 'S', sorszám: 1 });
    expect(r[1].típus).toBe('');
  });
});

describe('toSebzések', () => {
  it('filters empty rubrikák', () => {
    const rubrikák = [{ típus: 'S' as const, sorszám: 1 }, { típus: '' as const, sorszám: 0 }];
    expect(toSebzések(rubrikák)).toEqual([{ típus: 'S', sorszám: 1 }]);
  });
});

describe('getNextSorszám', () => {
  it('returns 1 for empty', () => {
    expect(getNextSorszám([{ típus: '', sorszám: 0 }])).toBe(1);
  });
  it('finds gap', () => {
    expect(getNextSorszám([{ típus: 'S', sorszám: 1 }, { típus: 'V', sorszám: 3 }])).toBe(2);
  });
});

describe('applySeb', () => {
  it('fills FP slots first for non-FP damage', () => {
    const rubrikák = [
      { típus: 'FP' as const, sorszám: 1 },
      { típus: '' as const, sorszám: 0 },
      { típus: '' as const, sorszám: 0 },
    ];
    const result = applySeb(rubrikák, 'S', 2);
    expect(result[0].típus).toBe('S');
    expect(result[1].típus).toBe('S');
  });
  it('FP damage does not overwrite FP', () => {
    const rubrikák = [
      { típus: 'FP' as const, sorszám: 1 },
      { típus: '' as const, sorszám: 0 },
    ];
    const result = applySeb(rubrikák, 'FP', 1);
    expect(result[0].típus).toBe('FP');
    expect(result[1].típus).toBe('FP');
  });
});

describe('applyGyógy', () => {
  it('heals FP from the end', () => {
    const rubrikák = [
      { típus: 'FP' as const, sorszám: 1 },
      { típus: 'FP' as const, sorszám: 1 },
      { típus: '' as const, sorszám: 0 },
    ];
    const result = applyGyógy(rubrikák, 'FP', 1);
    const fpCount = result.filter(r => r.típus === 'FP').length;
    expect(fpCount).toBe(1);
  });
  it('heals ÉP from the end', () => {
    const rubrikák = [
      { típus: 'S' as const, sorszám: 1 },
      { típus: 'V' as const, sorszám: 2 },
      { típus: '' as const, sorszám: 0 },
    ];
    const result = applyGyógy(rubrikák, 'ÉP', 1);
    const epCount = result.filter(r => r.típus !== '' && r.típus !== 'FP').length;
    expect(epCount).toBe(1);
  });
});

describe('calcSérültFok', () => {
  it('returns 0 below threshold', () => {
    expect(calcSérültFok(4, 5)).toBe(0);
  });
  it('returns 1 above 2x', () => {
    expect(calcSérültFok(11, 5)).toBe(1);
  });
  it('returns 2 above 3x', () => {
    expect(calcSérültFok(16, 5)).toBe(2);
  });
});
