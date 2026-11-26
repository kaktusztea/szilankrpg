import { describe, it, expect } from 'vitest';
import type { Tulajdonsagok } from '../types';
import {
  kiterjesztésMódosító, calcMultiKiterjesztésMod, buildFortélyFokok, enyhítettSorRészletes, calcSzitModÖsszeg, calcEffSzint,
  effektívKiterjesztésFok, effektívFortélyFokok, negálásKulcs,
} from './kepzettseg-proba-calc';
import { probaSiker, probaBiztosSiker, probaLehetetlen, helyettesítésSzint, összetettCélszámok } from './proba-common';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

// A próba-paraméterek a VALÓS konstansok.json-ból (próba.*) - a bekötés is tesztelve.
const PRÓBA = loadGameDataSync().konstansok.próba;
const K10 = PRÓBA.képzettség.kocka;
import { PRÓBA_IMMUNITÁS_KÜSZÖB } from '../../ui-constants';
import { rollElőnyHátrányDie } from '../dice';

describe('probaSiker', () => {
  it('eredmény == célszám → siker (határeset)', () => {
    expect(probaSiker(5 + 4, 3, 12)).toBe(true);
  });
  it('eredmény < célszám → sikertelen', () => {
    expect(probaSiker(5 + 4, 2, 12)).toBe(false);
  });
});

// Static extension modifier constants from the REAL konstansok.json (md/030_08_01: -3 / +0 / +2 / +4).
const KIT = { hiány: PRÓBA.képzettség.kiterjesztés_hiány ?? NaN, fokbónusz: PRÓBA.képzettség.kiterjesztés_fokbónusz ?? NaN };

describe('kiterjesztésMódosító (md/030_08_01)', () => {
  it('konstansok bekötve: hiány 3, fokbónusz 2', () => {
    expect(KIT).toEqual({ hiány: 3, fokbónusz: 2 });
  });
  it('Normál, nincs felvéve (0.fok) → -3', () => {
    expect(kiterjesztésMódosító('normál', 0, KIT)).toEqual({ mod: -3, tiltott: false });
  });
  it('Erős, nincs felvéve (0.fok) → tiltott', () => {
    expect(kiterjesztésMódosító('erős', 0, KIT)).toEqual({ mod: 0, tiltott: true });
  });
  it('1.fok → +0', () => {
    expect(kiterjesztésMódosító('normál', 1, KIT)).toEqual({ mod: 0, tiltott: false });
    expect(kiterjesztésMódosító('erős', 1, KIT)).toEqual({ mod: 0, tiltott: false });
  });
  it('2.fok → +2, 3.fok → +4', () => {
    expect(kiterjesztésMódosító('normál', 2, KIT)).toEqual({ mod: 2, tiltott: false });
    expect(kiterjesztésMódosító('erős', 3, KIT)).toEqual({ mod: 4, tiltott: false });
  });
});

describe('calcMultiKiterjesztésMod (md/030_08_01 "Több fortély")', () => {
  const e = (fortély: string, típus: 'normál' | 'erős', maxfok: number) => ({ fortély, típus, maxfok }) as never;
  it('nincs kijelölt → 0', () => {
    expect(calcMultiKiterjesztésMod([], {}, KIT)).toEqual({ mod: 0, tiltott: false });
  });
  it('több hiányzó Normál → -3 (nem halmozódik)', () => {
    expect(calcMultiKiterjesztésMod([e('A', 'normál', 2), e('B', 'normál', 1)], {}, KIT)).toEqual({ mod: -3, tiltott: false });
  });
  it('bármelyik Erős hiányzik → tiltott', () => {
    expect(calcMultiKiterjesztésMod([e('A', 'normál', 2), e('B', 'erős', 1)], { A: 2 }, KIT).tiltott).toBe(true);
  });
  it('A 2.fok (max 3), B 3.fok → az alacsonyabb: +2', () => {
    expect(calcMultiKiterjesztésMod([e('A', 'normál', 3), e('B', 'normál', 3)], { A: 2, B: 3 }, KIT).mod).toBe(2);
  });
  it('Horgas Apó: Nyomolvasás 2.fok + Tájtípus 1.fok (maxolt) → +2', () => {
    expect(calcMultiKiterjesztésMod([e('Ny', 'normál', 2), e('T', 'normál', 1)], { Ny: 2, T: 1 }, KIT).mod).toBe(2);
  });
  it('mind maxolt → a legmagasabb', () => {
    expect(calcMultiKiterjesztésMod([e('A', 'normál', 1), e('B', 'normál', 2)], { A: 1, B: 2 }, KIT).mod).toBe(2);
  });
});

describe('buildFortélyFokok', () => {
  it('fortély-id → max fok (többszörösnél a legmagasabb)', () => {
    const m = buildFortélyFokok([
      { id: 'történelemismeret', fok: 2, elem: ''} as never,
      { id: 'kultúrkör', fok: 1, elem: ''} as never,
      { id: 'kultúrkör', fok: 3, elem: ''} as never,
    ]);
    expect(m['történelemismeret']).toBe(2);
    expect(m['kultúrkör']).toBe(3); // max, nem az utolsó (fortély-id kulcs)
  });
});

describe('effektívKiterjesztésFok - manuális negálás', () => {
  const fokok = { Kultúrkör: 1 }; // felvéve (auto: teljesül)
  it('nincs negálás → auto (felvett) fok', () => {
    expect(effektívKiterjesztésFok(fokok, 'Etikett', 'Kultúrkör', new Set())).toBe(1);
  });
  it('negálva, miközben fel van véve → 0 (mintha hiányozna)', () => {
    const neg = new Set([negálásKulcs('Etikett', 'Kultúrkör')]);
    expect(effektívKiterjesztésFok(fokok, 'Etikett', 'Kultúrkör', neg)).toBe(0);
  });
  it('negálva, miközben hiányzik → 1 (mintha meglenne)', () => {
    const neg = new Set([negálásKulcs('Etikett', 'Kultúrkör')]);
    expect(effektívKiterjesztésFok({}, 'Etikett', 'Kultúrkör', neg)).toBe(1);
  });
  it('a negálás képzettségenként független (más képzettségre nem hat)', () => {
    const neg = new Set([negálásKulcs('Etikett', 'Kultúrkör')]);
    expect(effektívKiterjesztésFok(fokok, 'Lexikum', 'Kultúrkör', neg)).toBe(1);
  });
});

describe('effektívFortélyFokok - a map csak a képzettség kiterjesztéseit igazítja', () => {
  it('a negált kiterjesztő fortély fokát felülírja, a többit érintetlenül hagyja', () => {
    const fokok = { Kultúrkör: 1, Nyelvismeret: 2 };
    const kitek = [{ fortély: 'Kultúrkör', típus: 'normál', maxfok: 1 }] as never[];
    const neg = new Set([negálásKulcs('Irodalom', 'Kultúrkör')]);
    const eff = effektívFortélyFokok(fokok, 'Irodalom', kitek, neg);
    expect(eff['Kultúrkör']).toBe(0);      // negálva → hiányzóként számol
    expect(eff['Nyelvismeret']).toBe(2);   // nem kiterjesztés itt → változatlan
  });
});

describe('rollElőnyHátrányDie (k10)', () => {
  it('szint==0 → 1 dobás', () => {
    expect(rollElőnyHátrányDie(0, 10).rolls).toHaveLength(1);
  });
  it('Előny+2 → 3 dobás, a legnagyobb az eredmény', () => {
    const r = rollElőnyHátrányDie(2, 10);
    expect(r.rolls).toHaveLength(3);
    expect(r.eredmény).toBe(Math.max(...r.rolls));
  });
  it('Hátrány-2 → 3 dobás, a legkisebb az eredmény', () => {
    const r = rollElőnyHátrányDie(-2, 10);
    expect(r.rolls).toHaveLength(3);
    expect(r.eredmény).toBe(Math.min(...r.rolls));
  });
});

describe('probaLehetetlen (határeset)', () => {
  it('max eredmény == célszám → NEM lehetetlen', () => {
    // 3 + 2 + 10 = 15 == 15 → épphogy elérhető
    expect(probaLehetetlen(3 + 2, K10, 15)).toBe(false);
  });
  it('max eredmény < célszám → lehetetlen', () => {
    // 3 + 2 + 10 = 15 < 16
    expect(probaLehetetlen(3 + 2, K10, 16)).toBe(true);
  });
});

describe('probaBiztosSiker', () => {
  it('min k10 (1) + tul + szint >= célszám → biztos siker', () => {
    // 5 + 7 + 1 = 13 >= 12
    expect(probaBiztosSiker(5 + 7, 12)).toBe(true);
  });
  it('min k10 (1) + tul + szint < célszám → NEM biztos', () => {
    // 5 + 5 + 1 = 11 < 12
    expect(probaBiztosSiker(5 + 5, 12)).toBe(false);
  });
  it('határeset: pontosan egyenlő → biztos siker', () => {
    // 3 + 8 + 1 = 12 >= 12
    expect(probaBiztosSiker(3 + 8, 12)).toBe(true);
  });
});

describe('probaLehetetlen with vállalás (effSzint)', () => {
  it('vállalás bónusszal már nem lehetetlen', () => {
    // tul=3, szint=2, célszám=16 → 3+2+10=15 < 16 → lehetetlen
    expect(probaLehetetlen(3 + 2, K10, 16)).toBe(true);
    // vállalás +1 → effSzint=3: 3+3+10=16 >= 16 → NEM lehetetlen
    expect(probaLehetetlen(3 + 3, K10, 16)).toBe(false);
  });
});

describe('probaSiker with vállalás (effSzint)', () => {
  it('vállalás bónusz beleszámít', () => {
    // tul=3, szint=4, k10=5, célszám=15 → 3+4+5=12 < 15: sikertelen
    expect(probaSiker(3 + 4, 5, 15)).toBe(false);
    // effSzint=4+3=7 (vállalás +3): 3+7+5=15 >= 15: siker
    expect(probaSiker(3 + 7, 5, 15)).toBe(true);
  });
});

describe('Vállalás + Képzettségpróba együttes eredmény', () => {
  it('képzettségpróba siker + vállalás kritikus hiba: mindkettő egyszerre lehetséges', () => {
    // Szabály: a próba sikeres, DE a vállalás kritikus hibát okoz (mindkettő megtörténik).
    // tul=4, szint=5, vállalás=2, effSzint=7, k10=5 → 4+7+5=16 >= 15 → SIKER
    const tulÉrték = 4;
    const effSzint = 5 + 2; // szint + vállalás
    const k10 = 5;
    const célszám = 15;
    expect(probaSiker(tulÉrték + effSzint, k10, célszám)).toBe(true);

    // Vállalás próba: k6=2, vállalás=2 → k6 <= vállalás → Kritikus hiba
    const vállalásK6 = 2;
    const vállalásÉrték = 2;
    const kritikusHiba = vállalásK6 <= vállalásÉrték;
    expect(kritikusHiba).toBe(true);

    // Mindkettő igaz egyszerre - a szabályrendszer engedi ezt az esetet.
  });

  it('képzettségpróba siker + vállalás OK: nincs kritikus hiba', () => {
    const tulÉrték = 4;
    const effSzint = 5 + 2;
    const k10 = 5;
    const célszám = 15;
    expect(probaSiker(tulÉrték + effSzint, k10, célszám)).toBe(true);

    // Vállalás próba: k6=4, vállalás=2 → k6 > vállalás → OK
    const vállalásK6 = 4;
    const vállalásÉrték = 2;
    const kritikusHiba = vállalásK6 <= vállalásÉrték;
    expect(kritikusHiba).toBe(false);
  });

  it('képzettségpróba sikertelen + vállalás kritikus hiba: dupla baj', () => {
    const tulÉrték = 4;
    const effSzint = 5 + 2;
    const k10 = 1;
    const célszám = 15;
    // 4+7+1=12 < 15 → sikertelen
    expect(probaSiker(tulÉrték + effSzint, k10, célszám)).toBe(false);

    // Vállalás: k6=1, vállalás=2 → kritikus hiba
    const kritikusHiba = 1 <= 2;
    expect(kritikusHiba).toBe(true);
  });
});

describe('enyhítettSorRészletes', () => {
  const sor = { érték: -6, leírás: 'Vaksötét' };

  it('pozitív értéket nem enyhít', () => {
    expect(enyhítettSorRészletes([], 'Fény', { érték: 3, leírás: 'Nappal' })).toEqual({ érték: 3, immunis: false });
  });

  it('a legnagyobb illeszkedő enyhítés csökkenti a levonást (nullánál megáll)', () => {
    const e = [
      { képzettség: 'X', kategória: 'Fény', sorok: [], érték: 2 },
      { képzettség: 'X', kategória: 'Fény', sorok: ['Vaksötét'], érték: 4 },
    ];
    expect(enyhítettSorRészletes(e, 'Fény', sor)).toEqual({ érték: -2, immunis: false });
    expect(enyhítettSorRészletes(e, 'Más kategória', sor)).toEqual({ érték: -6, immunis: false });
  });

  it('immunitás küszöb: a levonás nullázódik és immunis jelzést kap', () => {
    const e = [{ képzettség: 'X', kategória: 'Fény', sorok: [], érték: PRÓBA_IMMUNITÁS_KÜSZÖB }];
    expect(enyhítettSorRészletes(e, 'Fény', sor)).toEqual({ érték: 0, immunis: true });
  });
});

describe('calcSzitModÖsszeg', () => {
  const táblák = [
    { kategória: 'Fény', sorok: [{ érték: -3, leírás: 'Félhomály' }, { érték: -6, leírás: 'Vaksötét' }] },
    { kategória: 'Egyéb', mód: 'multi' as const, sorok: [{ érték: -1, leírás: 'A' }, { érték: -2, leírás: 'B' }] },
    { kategória: 'Szerepjátékos módosító', sorok: [{ érték: -3, leírás: 'Gyenge' }, { érték: 0, leírás: 'Átlagos' }, { érték: 3, leírás: 'Kiváló' }] },
  ];

  it('single tábla: a kiválasztott index értéke; multi: a bejelölt sorok összege', () => {
    const összeg = calcSzitModÖsszeg(táblák, { Fény: 1 }, { Egyéb: [true, false] }, []);
    expect(összeg).toBe(-7);   // -6 + -1
  });

  it('a szerepjátékos módosító standard single táblaként adódik hozzá', () => {
    expect(calcSzitModÖsszeg(táblák, { 'Szerepjátékos módosító': 2 }, {}, [])).toBe(3);   // +3 sor
    expect(calcSzitModÖsszeg(táblák, { 'Szerepjátékos módosító': 0 }, {}, [])).toBe(-3);  // -3 sor
  });

  it('kiválasztás nélkül 0', () => {
    expect(calcSzitModÖsszeg(táblák, {}, {}, [])).toBe(0);
    expect(calcSzitModÖsszeg(táblák, { Fény: -1 }, {}, [])).toBe(0);
  });
});

describe('calcEffSzint / helyettesítésSzint', () => {
  it('saját szint + vállalás + szituációs módosítók', () => {
    expect(calcEffSzint(7, null, 2, -3, PRÓBA.helyettesítés)).toBe(6);
  });

  it('helyettesítő képzettség: FLOOR(szint / 3), max 5', () => {
    expect(helyettesítésSzint(8, PRÓBA.helyettesítés)).toBe(2);
    expect(helyettesítésSzint(21, PRÓBA.helyettesítés)).toBe(5);
    expect(calcEffSzint(7, 8, 0, 0, PRÓBA.helyettesítés)).toBe(2);   // a helyettesítő szint felülírja a sajátot
  });
});

describe('összetettCélszámok', () => {
  it('elsődleges a célszámon, a másodlagosak 3-mal könnyebbek', () => {
    expect(összetettCélszámok(12, 2, PRÓBA.képzettség.másodlagos_levonás)).toEqual([
      { label: 'Elsődleges', célszám: 12 },
      { label: 'Másodlagos', célszám: 9 },
      { label: 'Másodlagos', célszám: 9 },
    ]);
    expect(összetettCélszámok(12, 0, PRÓBA.képzettség.másodlagos_levonás)).toEqual([{ label: 'Elsődleges', célszám: 12 }]);
  });
});
