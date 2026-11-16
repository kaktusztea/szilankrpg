import { describe, it, expect } from 'vitest';
import type { Karakter } from '../../engine/types';
import { harcértékVáltozásCímke } from './undo-cimke';

const f = (név: string, alap = 'Kard, lovag') => ({ alap, név, anyag: 'acél', idea: 0, felszerelésben: true });
const alap = { fegyverek: [f('Hajnalpenge'), f('', 'Tőr')], páncél: {}, pajzs: {}, fortélyok: [], session: {} } as unknown as Karakter;

describe('harcértékVáltozásCímke', () => {
  it('names the edited weapon (nickname, else the base name)', () => {
    const next = { ...alap, fegyverek: [alap.fegyverek[0], { ...alap.fegyverek[1], idea: 2 }] };
    expect(harcértékVáltozásCímke(alap, next)).toBe('Fegyver módosítás: Tőr');
  });
  it('new / deleted weapon', () => {
    expect(harcértékVáltozásCímke(alap, { ...alap, fegyverek: [...alap.fegyverek, f('', 'Íj')] })).toBe('Új fegyver: Íj');
    expect(harcértékVáltozásCímke(alap, { ...alap, fegyverek: [alap.fegyverek[1]] })).toBe('Fegyver törlése: Hajnalpenge');
  });
  it('armor, shield, fallback', () => {
    expect(harcértékVáltozásCímke(alap, { ...alap, páncél: { ...alap.páncél } })).toBe('Páncél módosítás');
    expect(harcértékVáltozásCímke(alap, { ...alap, pajzs: { ...alap.pajzs } })).toBe('Pajzs módosítás');
    expect(harcértékVáltozásCímke(alap, { ...alap })).toBe('Harcértékek módosítás');
    expect(harcértékVáltozásCímke(alap, null)).toBe('Harcértékek módosítás');
  });
});
