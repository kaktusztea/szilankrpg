import { describe, it, expect } from 'vitest';
import { lookupFegyver, evaluateFeltétel, describeKepChange, képzettségSzint, fortélyFok, harcmodorÖsszeg, clamp } from './utils';
import type { FegyverAlap, Session, Karakter } from './types';

describe('lookupFegyver', () => {
  const fegyverek = [
    { név: 'Hosszúkard' },
    { név: 'Rövidkard' },
  ] as FegyverAlap[];

  it('finds case-insensitive', () => {
    expect(lookupFegyver(fegyverek, 'hosszúkard')?.név).toBe('Hosszúkard');
  });
  it('returns undefined if not found', () => {
    expect(lookupFegyver(fegyverek, 'Nincs')).toBeUndefined();
  });
});

describe('evaluateFeltétel', () => {
  const session = {
    fegyverfogás: '1K',
    aktív_fegyver_index: 0,
    aktív_helyzetek: ['Meglepetés'],
    aktív_taktikák: [{ név: 'Támadó' }],
    aktív_páncél: true,
  } as unknown as Session;
  const karakter = { fegyverek: [{ alap: 'Hosszúkard' }] } as unknown as Karakter;

  it('matches fegyverfogás', () => {
    expect(evaluateFeltétel('fegyverfogás:1K', session, karakter)).toBe(true);
    expect(evaluateFeltétel('fegyverfogás:2K', session, karakter)).toBe(false);
  });
  it('matches fegyver', () => {
    expect(evaluateFeltétel('fegyver:hosszúkard', session, karakter)).toBe(true);
  });
  it('matches harci_helyzet', () => {
    expect(evaluateFeltétel('harci_helyzet:Meglepetés', session, karakter)).toBe(true);
    expect(evaluateFeltétel('harci_helyzet:Hátrány', session, karakter)).toBe(false);
  });
  it('matches taktika', () => {
    expect(evaluateFeltétel('taktika:Támadó', session, karakter)).toBe(true);
  });
  it('returns true for no prefix', () => {
    expect(evaluateFeltétel('valami', session, karakter)).toBe(true);
  });
});

describe('describeKepChange', () => {
  it('describes addition', () => {
    const prev = [{ név: 'A', szint: 3 }];
    const next = [{ név: 'A', szint: 3 }, { név: 'B', szint: 1 }];
    expect(describeKepChange(prev, next)).toBe('Képzettség: B 0→1');
  });
  it('describes removal', () => {
    const prev = [{ név: 'A', szint: 3 }, { név: 'B', szint: 2 }];
    const next = [{ név: 'A', szint: 3 }];
    expect(describeKepChange(prev, next)).toBe('Képzettség: B 2→0❌');
  });
  it('describes level change', () => {
    const prev = [{ név: 'A', szint: 2 }];
    const next = [{ név: 'A', szint: 4 }];
    expect(describeKepChange(prev, next)).toBe('Képzettség: A 2→4');
  });
});

describe('képzettségSzint / fortélyFok / harcmodorÖsszeg', () => {
  const karakter = {
    képzettségek: [{ név: 'Kardvívás', szint: 5 }, { név: 'Akrobatika', szint: 2 }],
    fortélyok: [{ név: 'Kétkezes harc', fok: 3 }],
  } as unknown as Karakter;

  it('képzettségSzint: felvett szint vagy 0', () => {
    expect(képzettségSzint(karakter, 'Kardvívás')).toBe(5);
    expect(képzettségSzint(karakter, 'Nincs ilyen')).toBe(0);
  });
  it('képzettségSzint case-sensitive (viselkedés-megőrző)', () => {
    expect(képzettségSzint(karakter, 'kardvívás')).toBe(0);
  });
  it('fortélyFok: felvett fok vagy 0', () => {
    expect(fortélyFok(karakter, 'Kétkezes harc')).toBe(3);
    expect(fortélyFok(karakter, 'Nincs ilyen')).toBe(0);
  });
  it('harcmodorÖsszeg: több képzettség szintjének összege (hiányzó = 0)', () => {
    expect(harcmodorÖsszeg(karakter, ['Kardvívás', 'Akrobatika'])).toBe(7);
    expect(harcmodorÖsszeg(karakter, ['Kardvívás', 'Nincs'])).toBe(5);
    expect(harcmodorÖsszeg(karakter, [])).toBe(0);
  });
});

describe('clamp', () => {
  it('szorít tartományba', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it('határértékek benne vannak', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
