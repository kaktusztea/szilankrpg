import type { Karakter } from '../../engine/types';

/** Mesterfegyver fok keresés fegyver név/alap alapján (case-insensitive). */
export function findMfFok(karakter: Karakter, fegyverNév: string, fegyverAlap: string): number {
  const entry = karakter.fortélyok.find(f => f.név === 'Mesterfegyver' && (
    f.spec_elem?.toLowerCase() === fegyverNév.toLowerCase() ||
    f.spec_elem?.toLowerCase() === fegyverAlap.toLowerCase()
  ));
  return entry?.fok ?? 0;
}

/** MF bónusz lookup fokszám alapján. */
export function getMfBónusz(konstansok: { mesterfegyver_bónuszok: { fok: number; TÉ: number; VÉ: number; SP: number }[] }, fok: number): { TÉ: number; VÉ: number; SP: number } {
  return konstansok.mesterfegyver_bónuszok.find(b => b.fok === fok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
}

/** Nagyobb/kisebb fegyver meghatározása pengehossz szerint. */
export function resolveNagyobbKisebb<T extends { Pengehossz: string }>(
  jobbDef: T, balDef: T, jobbFp: { alap: string }, balFp: { alap: string },
): { nagyobb: T; kisebb: T; nagyobbFp: { alap: string }; kisebbFp: { alap: string }; jobbPenge: number; balPenge: number } {
  const jobbPenge = parseFloat(jobbDef.Pengehossz) || 0;
  const balPenge = parseFloat(balDef.Pengehossz) || 0;
  const jobbNagyobb = jobbPenge >= balPenge;
  return {
    nagyobb: jobbNagyobb ? jobbDef : balDef,
    kisebb: jobbNagyobb ? balDef : jobbDef,
    nagyobbFp: jobbNagyobb ? jobbFp : balFp,
    kisebbFp: jobbNagyobb ? balFp : jobbFp,
    jobbPenge, balPenge,
  };
}
