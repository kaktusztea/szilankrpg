import { describe, it, expect } from 'vitest';
import { fülKulcs, FÜL_SORREND } from './aktiv-calc';

describe('fülKulcs (alcsoport → box-kombó fülkulcs)', () => {
  it('maps harci/tavharc/misztikus directly', () => {
    expect(fülKulcs('harci')).toBe('harci');
    expect(fülKulcs('tavharc')).toBe('tavharc');
    expect(fülKulcs('misztikus')).toBe('misztikus');
  });

  it('maps every non-combat/non-magic alcsoport to "egyeb"', () => {
    expect(fülKulcs('altalanos')).toBe('egyeb');
    expect(fülKulcs('erzekek')).toBe('egyeb');
    expect(fülKulcs('kiemelt')).toBe('egyeb');
    expect(fülKulcs('szabad')).toBe('egyeb');
    expect(fülKulcs(undefined)).toBe('egyeb');
    expect(fülKulcs('')).toBe('egyeb');
  });

  it('FÜL_SORREND covers exactly the four keys in display order', () => {
    expect(FÜL_SORREND.map(f => f.kulcs)).toEqual(['harci', 'tavharc', 'misztikus', 'egyeb']);
  });
});
