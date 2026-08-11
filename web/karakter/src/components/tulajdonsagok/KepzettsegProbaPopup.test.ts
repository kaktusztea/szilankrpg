import { describe, it, expect } from 'vitest';
import type { Tulajdonsagok } from '../../engine/types';
import { tulKulcs, probaSiker, probaBiztosSiker, kiterjesztésElőnyHátrány, buildFortélyFokok, előnyHátrányLabel, probaLehetetlen, nehézségDisplay } from './KepzettsegProbaPopup';
import { rollElőnyHátrány } from '../../engine/dice';

// A 8 séma-kulcs (Tulajdonsagok) — a display→kulcs mapping-nek ezekre kell esnie.
const KULCSOK: (keyof Tulajdonsagok)[] = [
  'erő', 'edzettség', 'ügyesség', 'gyorsaság', 'intelligencia', 'emlékezet', 'önuralom', 'érzékenység',
];
const DISPLAY = ['Erő', 'Edzettség', 'Ügyesség', 'Gyorsaság', 'Intelligencia', 'Emlékezet', 'Önuralom', 'Érzékenység'];

describe('tulKulcs', () => {
  it('minden domináns display név érvényes séma kulcsra mappel', () => {
    for (const d of DISPLAY) expect(KULCSOK).toContain(tulKulcs(d));
  });
});

describe('probaSiker', () => {
  it('eredmény == célszám → siker (határeset)', () => {
    expect(probaSiker(5, 4, 3, 12)).toBe(true);
  });
  it('eredmény < célszám → sikertelen', () => {
    expect(probaSiker(5, 4, 2, 12)).toBe(false);
  });
});

describe('kiterjesztésElőnyHátrány (md/030_08_01)', () => {
  it('Normál, nincs felvéve (0.fok) → Hátrány-2', () => {
    expect(kiterjesztésElőnyHátrány('normál', 0)).toEqual({ szint: -2, tiltott: false });
  });
  it('Erős, nincs felvéve (0.fok) → tiltott', () => {
    expect(kiterjesztésElőnyHátrány('erős', 0)).toEqual({ szint: 0, tiltott: true });
  });
  it('1.fok → sima dobás (0)', () => {
    expect(kiterjesztésElőnyHátrány('normál', 1)).toEqual({ szint: 0, tiltott: false });
    expect(kiterjesztésElőnyHátrány('erős', 1)).toEqual({ szint: 0, tiltott: false });
  });
  it('2.fok → Előny+1, 3.fok → Előny+2', () => {
    expect(kiterjesztésElőnyHátrány('normál', 2)).toEqual({ szint: 1, tiltott: false });
    expect(kiterjesztésElőnyHátrány('erős', 3)).toEqual({ szint: 2, tiltott: false });
  });
});

describe('buildFortélyFokok', () => {
  it('név → max fok (többszörösnél a legmagasabb)', () => {
    const m = buildFortélyFokok([
      { név: 'Történelemismeret', fok: 2 } as never,
      { név: 'Kultúrkör', fok: 1 } as never,
      { név: 'Kultúrkör', fok: 3 } as never,
    ]);
    expect(m['Történelemismeret']).toBe(2);
    expect(m['Kultúrkör']).toBe(3); // max, nem az utolsó
  });
});

describe('előnyHátrányLabel', () => {
  it('címkék', () => {
    expect(előnyHátrányLabel(1)).toBe('Előny+1');
    expect(előnyHátrányLabel(2)).toBe('Előny+2');
    expect(előnyHátrányLabel(-2)).toBe('Hátrány-2');
    expect(előnyHátrányLabel(0)).toBe('');
  });
});

describe('rollElőnyHátrány', () => {
  it('szint==0 → 1 dobás', () => {
    expect(rollElőnyHátrány(0).rolls).toHaveLength(1);
  });
  it('Előny+2 → 3 dobás, a legnagyobb az eredmény', () => {
    const r = rollElőnyHátrány(2);
    expect(r.rolls).toHaveLength(3);
    expect(r.eredmény).toBe(Math.max(...r.rolls));
  });
  it('Hátrány-2 → 3 dobás, a legkisebb az eredmény', () => {
    const r = rollElőnyHátrány(-2);
    expect(r.rolls).toHaveLength(3);
    expect(r.eredmény).toBe(Math.min(...r.rolls));
  });
});

describe('probaLehetetlen (határeset)', () => {
  it('max eredmény == célszám → NEM lehetetlen', () => {
    // 3 + 2 + 10 = 15 == 15 → épphogy elérhető
    expect(probaLehetetlen(3, 2, 15)).toBe(false);
  });
  it('max eredmény < célszám → lehetetlen', () => {
    // 3 + 2 + 10 = 15 < 16
    expect(probaLehetetlen(3, 2, 16)).toBe(true);
  });
});

describe('nehézségDisplay', () => {
  it('elnevezett célszám: "érték (label)"', () => {
    expect(nehézségDisplay(12)).toBe('12 (Nehéz)');
  });
  it('21 feletti (nincs elnevezés): csak a szám', () => {
    expect(nehézségDisplay(24)).toBe('24');
    expect(nehézségDisplay(30)).toBe('30');
  });
});

describe('probaBiztosSiker', () => {
  it('min k10 (1) + tul + szint >= célszám → biztos siker', () => {
    // 5 + 7 + 1 = 13 >= 12
    expect(probaBiztosSiker(5, 7, 12)).toBe(true);
  });
  it('min k10 (1) + tul + szint < célszám → NEM biztos', () => {
    // 5 + 5 + 1 = 11 < 12
    expect(probaBiztosSiker(5, 5, 12)).toBe(false);
  });
  it('határeset: pontosan egyenlő → biztos siker', () => {
    // 3 + 8 + 1 = 12 >= 12
    expect(probaBiztosSiker(3, 8, 12)).toBe(true);
  });
});

describe('probaLehetetlen with vállalás (effSzint)', () => {
  it('vállalás bónusszal már nem lehetetlen', () => {
    // tul=3, szint=2, célszám=16 → 3+2+10=15 < 16 → lehetetlen
    expect(probaLehetetlen(3, 2, 16)).toBe(true);
    // vállalás +1 → effSzint=3: 3+3+10=16 >= 16 → NEM lehetetlen
    expect(probaLehetetlen(3, 3, 16)).toBe(false);
  });
});

describe('probaSiker with vállalás (effSzint)', () => {
  it('vállalás bónusz beleszámít', () => {
    // tul=3, szint=4, k10=5, célszám=15 → 3+4+5=12 < 15: sikertelen
    expect(probaSiker(3, 4, 5, 15)).toBe(false);
    // effSzint=4+3=7 (vállalás +3): 3+7+5=15 >= 15: siker
    expect(probaSiker(3, 7, 5, 15)).toBe(true);
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
    expect(probaSiker(tulÉrték, effSzint, k10, célszám)).toBe(true);

    // Vállalás próba: k6=2, vállalás=2 → k6 <= vállalás → Kritikus hiba
    const vállalásK6 = 2;
    const vállalásÉrték = 2;
    const kritikusHiba = vállalásK6 <= vállalásÉrték;
    expect(kritikusHiba).toBe(true);

    // Mindkettő igaz egyszerre — a szabályrendszer engedi ezt az esetet.
  });

  it('képzettségpróba siker + vállalás OK: nincs kritikus hiba', () => {
    const tulÉrték = 4;
    const effSzint = 5 + 2;
    const k10 = 5;
    const célszám = 15;
    expect(probaSiker(tulÉrték, effSzint, k10, célszám)).toBe(true);

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
    expect(probaSiker(tulÉrték, effSzint, k10, célszám)).toBe(false);

    // Vállalás: k6=1, vállalás=2 → kritikus hiba
    const kritikusHiba = 1 <= 2;
    expect(kritikusHiba).toBe(true);
  });
});
