import { describe, it, expect } from 'vitest';
import { interpolateFokDef, formatFokMods, getExtraFokok } from './taktika-helpers';

describe('interpolateFokDef', () => {
  const fokok = [
    { fok: 1, TÉ: -5, VÉ: 5 },
    { fok: 2, TÉ: -10, VÉ: 10 },
  ];

  it('returns existing fok', () => {
    expect(interpolateFokDef(fokok, 1, false)).toEqual({ fok: 1, TÉ: -5, VÉ: 5 });
  });
  it('interpolates when fortély_bővítés', () => {
    const result = interpolateFokDef(fokok, 3, true);
    expect(result?.fok).toBe(3);
    expect(result?.TÉ).toBe(-15);
    expect(result?.VÉ).toBe(15);
  });
  it('returns undefined without bővítés for missing fok', () => {
    expect(interpolateFokDef(fokok, 3, false)).toBeUndefined();
  });
});

describe('formatFokMods', () => {
  it('formats non-zero mods', () => {
    expect(formatFokMods({ fok: 2, TÉ: -10, VÉ: 5, hatások: 'x' })).toBe('TÉ: -10, VÉ: +5');
  });
  it('skips zero values', () => {
    expect(formatFokMods({ fok: 1, TÉ: 0, VÉ: 3 })).toBe('VÉ: +3');
  });
});

describe('getExtraFokok', () => {
  it('returns base fokok without bővítés', () => {
    const def = { fokok: [{ fok: 1, TÉ: -5 }] };
    const karakter = { fortélyok: [] } as any;
    expect(getExtraFokok(def, karakter)).toHaveLength(1);
  });
  it('adds extra fokok from fortély_bővítés', () => {
    const def = {
      fokok: [{ fok: 1, TÉ: -5 }, { fok: 2, TÉ: -10 }],
      fortély_bővítés: { fortély: 'Harcos', extra_fokok_per_fok: 1 },
    };
    const karakter = { fortélyok: [{ név: 'Harcos', fok: 2 }] } as any;
    const result = getExtraFokok(def, karakter);
    expect(result).toHaveLength(4); // 2 base + 2 extra
    expect(result[3].fok).toBe(4);
    expect(result[3].TÉ).toBe(-20);
  });
});
