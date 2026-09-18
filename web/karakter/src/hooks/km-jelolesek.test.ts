import { describe, it, expect, beforeEach } from 'vitest';
import { readKmJelölések, getKmJelölés, writeKmJelölés, removeKmJelölés, választSzínt } from './km-jelolesek';
import { KM_JEL_SZÍNEK } from '../ui-constants';
import { installLocalStorage } from '../__tests__/localstorage-stub';

describe('KM jelölések I/O', () => {
  beforeEach(() => installLocalStorage());

  it('round-trip: írás → olvasás', () => {
    writeKmJelölés('u1', { betű: 'A', szín: '#e05252', jegyzet: 'félkezű' });
    expect(getKmJelölés('u1')).toEqual({ betű: 'A', szín: '#e05252', jegyzet: 'félkezű' });
    expect(readKmJelölések()).toEqual({ u1: { betű: 'A', szín: '#e05252', jegyzet: 'félkezű' } });
  });

  it('több NJK hordhatja ugyanazt a betűt (nincs egyediség)', () => {
    writeKmJelölés('u1', { betű: 'A', szín: '#e05252', jegyzet: '' });
    writeKmJelölés('u2', { betű: 'A', szín: '#e05252', jegyzet: 'másik' });
    expect(getKmJelölés('u1')?.betű).toBe('A');
    expect(getKmJelölés('u2')?.betű).toBe('A');
  });

  it('üres betű ÉS üres jegyzet → törlődik a bejegyzés', () => {
    writeKmJelölés('u1', { betű: 'A', szín: '#e05252', jegyzet: 'x' });
    writeKmJelölés('u1', { betű: '', szín: '', jegyzet: '' });
    expect(getKmJelölés('u1')).toBeNull();
  });

  it('removeKmJelölés törli az adott uid-ot, a többit nem', () => {
    writeKmJelölés('u1', { betű: 'A', szín: '#e05252', jegyzet: '' });
    writeKmJelölés('u2', { betű: 'B', szín: '#e08a52', jegyzet: '' });
    removeKmJelölés('u1');
    expect(getKmJelölés('u1')).toBeNull();
    expect(getKmJelölés('u2')?.betű).toBe('B');
  });

  it('hibás JSON → üres tár', () => {
    localStorage.setItem('szilank_km_jelolesek', '{nem json');
    expect(readKmJelölések()).toEqual({});
  });
});

describe('választSzínt — felvételkori színválasztás', () => {
  it('üres tár: első betű a paletta első színét kapja', () => {
    expect(választSzínt('A', {}, KM_JEL_SZÍNEK)).toBe(KM_JEL_SZÍNEK[0]);
  });

  it('minden eltérő betű eltérő színt kap (nincs ütközés, míg van szabad szín)', () => {
    const tár: Record<string, { betű: string; szín: string; jegyzet: string }> = {};
    const betűk = 'ABCDEFGHIJKL'.split(''); // 12 betű = a teljes paletta
    const kiosztott = new Set<string>();
    betűk.forEach((b, i) => {
      const szín = választSzínt(b, tár, KM_JEL_SZÍNEK);
      expect(kiosztott.has(szín)).toBe(false); // eltérő
      kiosztott.add(szín);
      tár[`u${i}`] = { betű: b, szín, jegyzet: '' };
    });
    expect(kiosztott.size).toBe(KM_JEL_SZÍNEK.length);
  });

  it('ugyanaz a betű ugyanazt a színt kapja (betű↔szín konzisztens)', () => {
    const tár = { u1: { betű: 'A', szín: KM_JEL_SZÍNEK[3], jegyzet: '' } };
    expect(választSzínt('A', tár, KM_JEL_SZÍNEK)).toBe(KM_JEL_SZÍNEK[3]);
  });

  it('paletta kimerülésekor a legritkább szín ismétlődik', () => {
    const tár: Record<string, { betű: string; szín: string; jegyzet: string }> = {};
    // Töltsük fel a teljes palettát különböző betűkkel.
    'ABCDEFGHIJKL'.split('').forEach((b, i) => {
      tár[`u${i}`] = { betű: b, szín: KM_JEL_SZÍNEK[i], jegyzet: '' };
    });
    // 13. eltérő betű → valamelyik meglévő színt kapja (mind egyszer használt → első).
    expect(választSzínt('M', tár, KM_JEL_SZÍNEK)).toBe(KM_JEL_SZÍNEK[0]);
  });
});
