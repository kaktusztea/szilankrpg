import { describe, it, expect } from 'vitest';
import { tapKlasszifikáció } from './useLongPress';

// A dupla-tap detektálás küszöb-logikáját teszteljük DOM/React nélkül (a projekt
// hook-teszt konvenciója: pure logika, nincs jsdom/testing-library - l. useEscapeClose.test.ts).
describe('tapKlasszifikáció', () => {
  const dblMs = 280;

  it('a dblMs ablakon belüli második tap → dupla', () => {
    expect(tapKlasszifikáció(1000, 900, dblMs)).toBe('dupla');   // 100ms < 280
    expect(tapKlasszifikáció(1000, 721, dblMs)).toBe('dupla');   // 279ms < 280
  });

  it('a dblMs-nél lassabb (vagy pont annyi) tap → első (külön single)', () => {
    expect(tapKlasszifikáció(1000, 720, dblMs)).toBe('első');    // 280ms, NEM < 280
    expect(tapKlasszifikáció(1000, 500, dblMs)).toBe('első');    // 500ms
  });

  it('nincs előző tap (utolsóTap = 0) → első', () => {
    expect(tapKlasszifikáció(1000, 0, dblMs)).toBe('első');
  });
});
