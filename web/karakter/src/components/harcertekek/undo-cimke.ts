import type { Karakter } from '../../engine/types';

/**
 * Undo label for a Harcértékek change that has no explicit patch (fegyverek / páncél / pajzs editors):
 * names WHAT changed, instead of the generic "Harcértékek módosítás" repeated on every row.
 */
export function harcértékVáltozásCímke(prev: Karakter, next: Karakter | null): string {
  if (!next) return 'Harcértékek módosítás';
  const fNév = (f: { név: string; alap: string }) => f.név || f.alap;
  if (prev.fegyverek !== next.fegyverek) {
    if (next.fegyverek.length > prev.fegyverek.length) return `Új fegyver: ${fNév(next.fegyverek[next.fegyverek.length - 1])}`;
    if (next.fegyverek.length < prev.fegyverek.length) {
      const törölt = prev.fegyverek.find(f => !next.fegyverek.includes(f));
      return `Fegyver törlése${törölt ? `: ${fNév(törölt)}` : ''}`;
    }
    const i = next.fegyverek.findIndex((f, idx) => f !== prev.fegyverek[idx]);
    if (i >= 0) return `Fegyver módosítás: ${fNév(next.fegyverek[i])}`;
  }
  if (prev.páncél !== next.páncél) return 'Páncél módosítás';
  if (prev.pajzs !== next.pajzs) return 'Pajzs módosítás';
  if (prev.fortélyok !== next.fortélyok) return 'Fortély fok módosítás';
  if (prev.session !== next.session) return 'Viselet / felszerelés váltás';
  return 'Harcértékek módosítás';
}
