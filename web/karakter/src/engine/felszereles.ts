/**
 * Felszerelés keret és terhelés (md/010_03_06_felszereles.md).
 *
 * Keret = 2 + Erő. A karakternél lévő tárgyak/fegyver/pajzs/páncél pontot vonnak le
 * (kicsi:0, közepes:1, nagy:2). Ha a terhelés meghaladja a keretet, a túllépés Hátrányt
 * ad a Fizikai Tulajdonság-/Képzettségpróbákra (NEM a harckeretre - az a modell kivezetve,
 * l. engine_spec §15/§33.1). A pont-leképezések a `konstansok.felszerelés` data-ból jönnek.
 *
 * ponytail: a fegyver „számít-e" a `FegyverPeldany.felszerelésben` flagből; a pajzs/páncél
 * a `karakter.felszerelés.kizárt_auto`-ból. A pure fn session-független (nyugalmi terhelés).
 */
import type { Karakter } from './types';
import type { GameData } from './data-loader';
import { lookupFegyver } from './utils';

export interface FelszerelésSor {
  /** Megjelenítendő név (fegyver/pajzs/páncél neve, vagy kézi tárgy neve). */
  név: string;
  /** A sor pontja (0/1/2). */
  pont: number;
  /** Sor típusa: auto (fegyver/pajzs/páncél, read-only név) vagy kézi. */
  típus: 'fegyver' | 'pajzs' | 'páncél' | 'kézi';
  /** Auto-sor azonosítója (fegyvernél index-alapú kulcs, pajzs/páncél fix). Kézinél undefined. */
  autoId?: string;
  /** Számít-e a terhelésbe (fegyver: felszerelésben; pajzs/páncél: nincs kizárva; páncél: fedés is). */
  számít: boolean;
}

export interface FelszerelésHátrány {
  /** Előny/Hátrány szint a Fizikai próbákra (0 vagy negatív). */
  ehSzint: number;
  /** A próba automatikus kudarc (túllépés > a sávok). */
  autoKudarc: boolean;
  /** A karakter nem tud harcolni (jelzés, KM dönt). */
  nemHarcol: boolean;
}

/** Felszerelés keret: 2 + Erő (nyers tulajdonság-érték). */
export function felszerelésMax(karakter: Karakter, data: GameData): number {
  return data.konstansok.felszerelés.keret_bázis + (karakter.tulajdonságok.erő ?? 0);
}

/** Egy fegyver Felszerelés-pontja: MAX(hossz_pont, súly_pont) - VAGY-VAGY (md/010_03_06). */
function fegyverPont(fegyverAlap: string, data: GameData): number {
  const f = lookupFegyver(data.fegyverek, fegyverAlap);
  if (!f) return 0;
  const fp = data.konstansok.felszerelés;
  const forgatás = f.módok[0]?.Forgatás ?? 'egykezes';
  const hosszPont = fp.forgatás_pont[forgatás] ?? 0;
  const súlyPont = fp.súly_pont[f.súly] ?? 0;
  return Math.max(hosszPont, súlyPont);
}

/** Páncél lefedettsége (a reactive `páncél_lefedettség` pure megfelelője): 50 + végtag*10 + sisak*10. */
function páncélLefedettség(karakter: Karakter): number {
  if (!karakter.páncél.alap) return 0;
  return 50 + karakter.páncél.végtagvédettség * 10 + (karakter.páncél.sisak ? 10 : 0);
}

/**
 * A Felszerelés táblázat sorai (auto: fegyverek + pajzs + páncél; kézi tárgyak).
 * A `számít` flag dönti el, bekerül-e a terhelésbe.
 */
export function felszerelésSorok(karakter: Karakter, data: GameData): FelszerelésSor[] {
  const fp = data.konstansok.felszerelés;
  const sorok: FelszerelésSor[] = [];
  // A karakter localStorage-ból/URL-ből jön (trust boundary): a felszerelés almezők hiányozhatnak.
  const kizártAuto = karakter.felszerelés?.kizárt_auto ?? [];
  const kéziTárgyak = karakter.felszerelés?.tárgyak ?? [];

  // Fegyverek (auto): a felszerelésben flag dönt
  karakter.fegyverek.forEach((f, i) => {
    const def = lookupFegyver(data.fegyverek, f.alap);
    sorok.push({
      név: f.név || def?.név || f.alap,
      pont: fegyverPont(f.alap, data),
      típus: 'fegyver',
      autoId: `fegyver:${i}`,
      számít: f.felszerelésben !== false,
    });
  });

  // Pajzs (auto): a kizárt_auto dönt
  if (karakter.pajzs.méret) {
    sorok.push({
      név: `Pajzs (${karakter.pajzs.méret})`,
      pont: fp.pajzs_pont[karakter.pajzs.méret] ?? 0,
      típus: 'pajzs',
      autoId: 'pajzs',
      számít: !kizártAuto.includes('pajzs'),
    });
  }

  // Páncél (auto): kizárt_auto + legalább páncél_fedés_min lefedettség
  if (karakter.páncél.alap) {
    const struktúra = data.konstansok.páncél_struktúrák.find(s => s.struktúra === karakter.páncél.alap);
    const merev = struktúra?.merev ?? false;
    const fedésOk = páncélLefedettség(karakter) >= fp.páncél_fedés_min;
    sorok.push({
      név: `Páncél (${karakter.páncél.alap})`,
      pont: merev ? fp.páncél_pont.merev : fp.páncél_pont.hajlékony,
      típus: 'páncél',
      autoId: 'páncél',
      számít: fedésOk && !kizártAuto.includes('páncél'),
    });
  }

  // Kézi tárgyak
  for (const t of kéziTárgyak) {
    sorok.push({
      név: t.név,
      pont: fp.méret_pont[t.méret] ?? 0,
      típus: 'kézi',
      számít: true,
    });
  }

  return sorok;
}

/** A karakter aktuális Felszerelés-terhelése (a `számít` sorok pontjainak összege). */
export function felszerelésTerhelés(karakter: Karakter, data: GameData): number {
  return felszerelésSorok(karakter, data).reduce((s, sor) => s + (sor.számít ? sor.pont : 0), 0);
}

/** A túllépésből (terhelés - max) adódó próba-Hátrány. */
export function felszerelésHátrány(terhelés: number, max: number, data: GameData): FelszerelésHátrány {
  const túllépés = terhelés - max;
  if (túllépés <= 0) return { ehSzint: 0, autoKudarc: false, nemHarcol: false };
  const sáv = data.konstansok.felszerelés.hátrány_sáv[String(túllépés)];
  if (sáv !== undefined) return { ehSzint: sáv, autoKudarc: false, nemHarcol: false };
  // A legnagyobb definiált sáv fölött: auto kudarc + nem harcol.
  const maxSáv = Math.min(...Object.values(data.konstansok.felszerelés.hátrány_sáv));
  return { ehSzint: maxSáv, autoKudarc: true, nemHarcol: true };
}

/** Egy tulajdonság Fizikai-e (kap-e felszerelés-Hátrányt a Tulajdonságpróbánál). */
export function fizikaiTulajdonság(tulajdonság: string, data: GameData): boolean {
  return data.konstansok.felszerelés.hátrány_tulajdonságok.includes(tulajdonság);
}
