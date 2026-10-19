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
  /** Számít-e a terhelésbe (fegyver: felszerelésben; pajzs/páncél: nincs kizárva; páncél: fedés is).
   * A "külső" (lásd lentebb) és a "nincs nálad" egyaránt false-ra állítja. */
  számít: boolean;
  /** A sor "külső tárolóban" (lovon/szekéren) jelzővel van-e ellátva. Tisztán megjelenítési
   * (🟤 helyett szöveg); terhelésbe nem számít - a `számít` már false ilyenkor. */
  külső: boolean;
  /** A sor stabil kulcsa a felszerelés.külső halmazhoz (fegyver:<idx> / pajzs / páncél / kézi név). */
  kulcs: string;
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

/**
 * Páncél lefedettsége - a reactive `páncél_lefedettség` szabály pure megfelelője: 50 + végtag*10 + sisak*10.
 * ponytail: a rules.json formula TS-másolata (a felszerelés-számítás nem épít reactive kontextust). A drift
 * ellen a `felszereles.rules-tukor.test.ts` köti a rules.json formulájához - ha a szabály változik, a teszt bukik.
 */
export function páncélLefedettség(karakter: Karakter): number {
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
  const külsőSet = new Set(karakter.felszerelés?.külső ?? []);

  // Fegyverek (auto): a felszerelésben flag dönt
  karakter.fegyverek.forEach((f, i) => {
    const def = lookupFegyver(data.fegyverek, f.alap);
    const kulcs = `fegyver:${i}`;
    const külső = külsőSet.has(kulcs);
    sorok.push({
      név: f.név || def?.név || f.alap,
      pont: fegyverPont(f.alap, data),
      típus: 'fegyver',
      autoId: kulcs,
      kulcs,
      külső,
      számít: f.felszerelésben !== false && !külső,
    });
  });

  // Pajzs (auto): a kizárt_auto dönt
  if (karakter.pajzs.méret) {
    const külső = külsőSet.has('pajzs');
    sorok.push({
      név: `Pajzs (${karakter.pajzs.méret})`,
      pont: fp.pajzs_pont[karakter.pajzs.méret] ?? 0,
      típus: 'pajzs',
      autoId: 'pajzs',
      kulcs: 'pajzs',
      külső,
      számít: !kizártAuto.includes('pajzs') && !külső,
    });
  }

  // Páncél (auto): a "Páncél viselve" (session.aktív_páncél) + legalább páncél_fedés_min lefedettség.
  // A session.aktív_páncél az EGYETLEN igazságforrás (összekötve a Harc fül "Páncél viselve" toggle-jével).
  if (karakter.páncél.alap) {
    const struktúra = data.konstansok.páncél_struktúrák.find(s => s.struktúra === karakter.páncél.alap);
    const merev = struktúra?.merev ?? false;
    const fedésOk = páncélLefedettség(karakter) >= fp.páncél_fedés_min;
    const külső = külsőSet.has('páncél');
    sorok.push({
      név: `Páncél (${karakter.páncél.alap})`,
      pont: merev ? fp.páncél_pont.merev : fp.páncél_pont.hajlékony,
      típus: 'páncél',
      autoId: 'páncél',
      kulcs: 'páncél',
      külső,
      számít: fedésOk && karakter.session?.aktív_páncél === true && !külső,
    });
  }

  // Kézi tárgyak (a háromállapot a tárgy `hely` mezőjéből: nálad / nincs / külső)
  for (const t of kéziTárgyak) {
    const külső = t.hely === 'külső';
    const nálad = t.hely == null;
    sorok.push({
      név: t.név,
      pont: fp.méret_pont[t.méret] ?? 0,
      típus: 'kézi',
      kulcs: t.név,
      külső,
      számít: nálad,
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

// ============================================================
// Akadály: hosszútávú viselet, barangolás (md/010_03_07_akadaly.md)
// ============================================================

/** Egy akadály-forrás (páncél vagy pajzs) hozzájárulása. */
export interface AkadályForrás {
  /** Megjelenítendő név (a felszerelés-sor neve). */
  név: string;
  /** Az általa kiváltott Akadály-állapot (1 vagy 2; 0 = nem vált ki). */
  állapot: number;
  /** A forrás "viselve" van-e (csak ekkor számít; a felszerelésSorok.számít alapján). */
  viselve: boolean;
}

export interface AkadályÁllapot {
  /** A végső Akadály-állapot: a viselt források állapotainak MAX-a (nem additív). 0 = nincs. */
  állapot: number;
  /** A két potenciális forrás (páncél / pajzs) - akkor is megjelenítve, ha épp nem viselt (0 állapot). */
  források: AkadályForrás[];
}

/**
 * Akadály-állapot a tartós viselet/cipelés szabálya szerint (md/010_03_07).
 *
 * Kiváltók (bármelyik a legnagyobbat adja - NEM additív):
 * - 1. állapot: hajlékony FÉM páncél (>= páncél_fedés_min lefedettség) VAGY közepes pajzs
 * - 2. állapot: merev FÉM páncél (>= páncél_fedés_min lefedettség) VAGY nagy pajzs
 *
 * ponytail: a páncél/pajzs "viselve" eldöntését a felszerelésSorok `számít` flagje adja (egy
 * igazságforrás a Felszerelés accordionnal) - csak a viselt forrás számít az állapotba. A nem-fém
 * páncél (bőr/posztó) és a kis pajzs soha nem vált ki Akadályt.
 */
export function akadályÁllapot(karakter: Karakter, data: GameData): AkadályÁllapot {
  const sorok = felszerelésSorok(karakter, data);
  const források: AkadályForrás[] = [];

  const páncélSor = sorok.find(s => s.típus === 'páncél');
  if (páncélSor) {
    const struktúra = data.konstansok.páncél_struktúrák.find(s => s.struktúra === karakter.páncél.alap);
    // Akadályt csak FÉM páncél vált ki (bőr/posztó nem); merev → 2, hajlékony → 1.
    const állapot = struktúra?.fém ? (struktúra.merev ? 2 : 1) : 0;
    források.push({ név: páncélSor.név, állapot, viselve: páncélSor.számít });
  }

  const pajzsSor = sorok.find(s => s.típus === 'pajzs');
  if (pajzsSor) {
    const állapot = { nagy: 2, közepes: 1, kis: 0 }[karakter.pajzs.méret] ?? 0;
    források.push({ név: pajzsSor.név, állapot, viselve: pajzsSor.számít });
  }

  const állapot = források.reduce((m, f) => (f.viselve ? Math.max(m, f.állapot) : m), 0);
  return { állapot, források };
}

/**
 * A ✏️ chip piros-pötty jelzője: akkor igaz, ha a Felszerelés túllépésben van (terhelés > keret),
 * VAGY az Akadály-állapot > 0 - azaz bármelyik panel headerében van legalább egy piros pötty.
 */
export function felszerelésVagyAkadályJelző(karakter: Karakter, data: GameData): boolean {
  const túlterhelt = felszerelésTerhelés(karakter, data) > felszerelésMax(karakter, data);
  return túlterhelt || akadályÁllapot(karakter, data).állapot > 0;
}
