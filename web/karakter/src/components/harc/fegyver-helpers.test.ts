import { describe, it, expect } from 'vitest';
import { kétkezesLehetséges } from './fegyver-helpers';
import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';

const FEGYVEREK = [
  { Fegyver: 'Tőr', Pengehossz: '0', 'Forgatás módja': 'egykezes', Hárító: '0' },
  { Fegyver: 'Pásztorbot', Pengehossz: '0', 'Forgatás módja': 'kétkezes', Hárító: '0' },
  { Fegyver: 'Kardtörő', Pengehossz: '0', 'Forgatás módja': 'egykezes', Hárító: '1' },
];
const data = { fegyverek: FEGYVEREK } as unknown as GameData;

function char(...alapok: string[]): Karakter {
  return { fegyverek: alapok.map(alap => ({ alap })) } as unknown as Karakter;
}

describe('kétkezesLehetséges', () => {
  it('egyetlen nem-hárító fegyverrel is lehetséges (2 db azonos fegyver, pl. tőr)', () => {
    expect(kétkezesLehetséges(data, char('Tőr'), 0)).toBe(true);
  });

  it('kétkezes fegyver (pásztorbot) jobb kézben → nem lehetséges', () => {
    expect(kétkezesLehetséges(data, char('Pásztorbot'), 0)).toBe(false);
  });

  it('puszta kéz jobb kézben → nem lehetséges', () => {
    expect(kétkezesLehetséges(data, char('Puszta kéz'), 0)).toBe(false);
  });

  it('csak hárítófegyver → nincs nem-hárító fegyver → nem lehetséges', () => {
    expect(kétkezesLehetséges(data, char('Kardtörő'), 0)).toBe(false);
  });

  it('érvénytelen jobb index → nem lehetséges', () => {
    expect(kétkezesLehetséges(data, char('Tőr'), -1)).toBe(false);
  });
});
