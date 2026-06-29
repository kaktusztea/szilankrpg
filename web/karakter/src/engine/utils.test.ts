import { describe, it, expect } from 'vitest';
import { lookupFegyver, evaluateFeltétel, describeKepChange } from './utils';
import type { FegyverAlap, Session, Karakter } from './types';

describe('lookupFegyver', () => {
  const fegyverek = [
    { Fegyver: 'Hosszúkard (1K)' },
    { Fegyver: 'Rövidkard' },
  ] as FegyverAlap[];

  it('finds case-insensitive', () => {
    expect(lookupFegyver(fegyverek, 'hosszúkard (1k)')?.Fegyver).toBe('Hosszúkard (1K)');
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
