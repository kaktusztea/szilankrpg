import type { Karakter, TavfegyverAlap } from '../../engine/types';
import { képzettségSzint } from '../../engine/utils';

// Lövéskitérés (védekező Akrobatika próba, md/073 + kategóriák md/078) + range-gát segédek.
// Kiemelve a tavharc/helpers.ts-ből (2026-09-30 refaktor, modularizáció).

/** Osztó → lövéskitérés célszám-kategória (md/078: a kategóriát az Osztó adja). */
export function osztóToLöveskitérésKategória(osztó: number): string | null {
  switch (osztó) {
    case 1: return 'nem_alkalmas_tárgyak';   // Mágiatáv I
    case 2: return 'korlátosan_alkalmas';    // Mágiatáv II
    case 3: return 'dobófegyverek';          // Mágiatáv III (apró hajító/szálfegyver)
    case 4: return 'íjak';                   // Mágiatáv IV
    default: return osztó >= 5 ? 'nyílpuskák' : null;
  }
}

/** Bejövő távfegyver → célszám-kategória az Osztója alapján. */
export function weaponToLöveskitérésKategória(def: TavfegyverAlap): string | null {
  return osztóToLöveskitérésKategória(def.Osztó || 0);
}

/**
 * Hatótáv méterben a lövéskitérés range-gátjához. Fix hatótáv (erő_szorzó 0, bázis>0) → a bázis;
 * Erő-függő (erő_szorzó>0) → Infinity, mert a támadó Ereje ismeretlen (nem blokkolunk hamisan);
 * bázis 0 → Infinity (pl. Mágiatáv: nincs range-korlát).
 */
export function tavHatótáv(def: TavfegyverAlap): number {
  if (def.hatótáv_erő_szorzó > 0) return Infinity;
  return def.hatótáv_bázis > 0 ? def.hatótáv_bázis : Infinity;
}

/**
 * Akrobatika próba célszáma: az első sor, ahol táv <= max_táv (közelebb = magasabb célszám).
 * A tábla maximumán túl a legkönnyebb (utolsó) sor érvényes; hiányzó tábla → null.
 * A tényleges „hatótávon kívül vagy" a fegyver Hatótávja alapján dől el (nem itt).
 */
export function calcLöveskitérésCélszám(
  sorok: { max_táv: number; célszám: number }[] | undefined,
  távolság: number,
): number | null {
  if (!sorok || sorok.length === 0) return null;
  for (const sor of sorok) {
    if (távolság <= sor.max_táv) return sor.célszám;
  }
  return sorok[sorok.length - 1].célszám;
}

/** A kitérő karakter Akrobatika próba módosítója: Akrobatika szint + Gyorsaság (+2 fortély). */
export function calcAkrobatikaÉrték(k: Karakter): number {
  const akrobatika = képzettségSzint(k, 'Akrobatika');
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const fejlesztés = k.fortélyok.some(f => f.név === 'Lövéskitérés fejlesztése') ? 2 : 0;
  return akrobatika + gyorsaság + fejlesztés;
}

/** Egy választható bejövő fegyver / kategória a lövéskitéréshez. */
export interface LKOpció { név: string; kategória: string | null; hatótáv: number; separator?: boolean }

// A lista tetején rögzített (gyakori) fegyverek ebben a sorrendben.
const KIEMELT = ['Hajítótőr', 'Rövid íj', 'Hosszú íj', 'Nyílpuska'];

/** A lövéskitérés fegyver-picker opciólistája: kiemelt → mágikus → maradék → improvizált, separatorokkal. */
export function buildOpciók(tavfegyverek: TavfegyverAlap[]): LKOpció[] {
  const all = tavfegyverek.filter(f => !f.név.startsWith('🔆'));
  const mágikus = all.filter(f => f.kategória === 'mágikus')
    .sort((a, b) => a.név.localeCompare(b.név, 'hu'))
    .map(f => ({ név: f.név, kategória: weaponToLöveskitérésKategória(f), hatótáv: tavHatótáv(f) }));

  const nemMágikus = all.filter(f => f.kategória !== 'mágikus');
  const kiemelt = nemMágikus
    .filter(f => KIEMELT.includes(f.név))
    .sort((a, b) => KIEMELT.indexOf(a.név) - KIEMELT.indexOf(b.név))
    .map(f => ({ név: f.név, kategória: weaponToLöveskitérésKategória(f), hatótáv: tavHatótáv(f) }));

  const maradék = nemMágikus
    .filter(f => !KIEMELT.includes(f.név))
    .sort((a, b) => a.név.localeCompare(b.név, 'hu'))
    .map(f => ({ név: f.név, kategória: weaponToLöveskitérésKategória(f), hatótáv: tavHatótáv(f) }));

  // Improvizált 🔆 tárgyak a data-ból (Erő-függő hatótáv → nincs range-gát).
  const improv = tavfegyverek
    .filter(f => f.név.startsWith('🔆'))
    .map(f => ({ név: f.név, kategória: weaponToLöveskitérésKategória(f), hatótáv: Infinity }));

  // Separatorok a csoportok között.
  const result: LKOpció[] = [...kiemelt];
  if (mágikus.length > 0) {
    result.push({ név: '__sep1__', kategória: null, hatótáv: 0, separator: true });
    result.push(...mágikus);
  }
  if (maradék.length > 0) {
    result.push({ név: '__sep2__', kategória: null, hatótáv: 0, separator: true });
    result.push(...maradék);
  }
  result.push({ név: '__sep3__', kategória: null, hatótáv: 0, separator: true });
  result.push({ név: '🔆 Korlátosan alkalmas fegyver', kategória: 'korlátosan_alkalmas', hatótáv: Infinity });
  result.push(...improv);

  return result;
}

