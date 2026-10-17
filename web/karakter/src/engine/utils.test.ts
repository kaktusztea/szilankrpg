import { describe, it, expect } from 'vitest';
import { lookupFegyver, evaluateFeltétel, describeKepChange, harcmodorÖsszeg, clamp } from './utils';
import { képzettségSzint, fortélyFok } from './azonosito';
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
  // A felirat a képzettség-def nevéből jön (id → név), az egyezés kulcs szerint.
  const data = { kepzettsegDefs: [{ id: 'a', név: 'A', többszörös: [] }, { id: 'b', név: 'B', többszörös: [] }] } as never;
  const kp = (id: string, szint: number) => ({ id, elem: '', szint });
  it('describes addition', () => {
    expect(describeKepChange([kp('a', 3)], [kp('a', 3), kp('b', 1)], data)).toBe('Képzettség: B 0→1');
  });
  it('describes removal', () => {
    expect(describeKepChange([kp('a', 3), kp('b', 2)], [kp('a', 3)], data)).toBe('Képzettség: B 2→0❌');
  });
  it('describes level change', () => {
    expect(describeKepChange([kp('a', 2)], [kp('a', 4)], data)).toBe('Képzettség: A 2→4');
  });
});

describe('képzettségSzint / fortélyFok / harcmodorÖsszeg', () => {
  const karakter = {
    képzettségek: [{ id: 'harcmodor', elem: 'kardvívás', szint: 5 }, { id: 'akrobatika', elem: '', szint: 2 }],
    fortélyok: [{ id: 'kétkezes_harc', fok: 3, elem: ''}],
  } as unknown as Karakter;

  it('képzettségSzint: hivatkozási kulcs szerint (felvett szint vagy 0)', () => {
    expect(képzettségSzint(karakter.képzettségek, 'harcmodor/kardvívás')).toBe(5);
    expect(képzettségSzint(karakter.képzettségek, 'akrobatika')).toBe(2);
    expect(képzettségSzint(karakter.képzettségek, 'harcmodor/rombolás')).toBe(0);
  });
  it('fortélyFok: id szerint, felvett fok vagy 0', () => {
    expect(fortélyFok(karakter.fortélyok, 'kétkezes_harc')).toBe(3);
    expect(fortélyFok(karakter.fortélyok, 'nincs_ilyen')).toBe(0);
  });
  it('harcmodorÖsszeg: közelharci harcmodor-elemek szintjének összege (hiányzó = 0)', () => {
    expect(harcmodorÖsszeg(karakter, ['kardvívás', 'rombolás'])).toBe(5);
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
