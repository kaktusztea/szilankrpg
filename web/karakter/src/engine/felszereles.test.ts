/**
 * Felszerelés pure logika önteszt (engine/felszereles.ts).
 * Fedi: sávhatárok, auto-kudarc, VAGY-VAGY fegyverpont (Balta), felszerelésben/kizárt_auto
 * kihagyás, páncél-fedés küszöb.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  felszerelésMax, felszerelésTerhelés, felszerelésHátrány, felszerelésSorok, fizikaiTulajdonság, külsőJelző, páncélPajzsNincs,
} from '../engine/felszereles';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { validKarakter } from '../__tests__/karakter-fixture';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';

let data: GameData;
let base: Karakter;

beforeAll(() => {
  data = loadGameDataSync();
  base = data.emptyKarakter;
});

describe('felszerelésMax / felszerelésHátrány', () => {
  it('keret = 2 + Erő', () => {
    const k: Karakter = { ...base, tulajdonságok: { ...base.tulajdonságok, erő: 5 } };
    expect(felszerelésMax(k, data)).toBe(7);
  });

  it('sávhatárok: 0 → nincs, 1 → -1, 2 → -2', () => {
    expect(felszerelésHátrány(5, 5, data)).toMatchObject({ ehSzint: 0, autoKudarc: false, nemHarcol: false });
    expect(felszerelésHátrány(6, 5, data)).toMatchObject({ ehSzint: -1, autoKudarc: false });
    expect(felszerelésHátrány(7, 5, data)).toMatchObject({ ehSzint: -2, autoKudarc: false });
  });

  it('a legnagyobb sáv fölött: auto kudarc + nem harcol', () => {
    const r = felszerelésHátrány(8, 5, data); // túllépés 3
    expect(r).toMatchObject({ ehSzint: -2, autoKudarc: true, nemHarcol: true });
  });
});

describe('felszerelésTerhelés / sorok', () => {
  it('VAGY-VAGY fegyverpont: Balta (egykezes=0 VAGY nehéz=1) → 1', () => {
    const k: Karakter = {
      ...base,
      fegyverek: [{ alap: 'Balta', név: '', anyag: 'acél', idea: 0, felszerelésben: true }],
    };
    expect(felszerelésTerhelés(k, data)).toBe(1);
  });

  it('felszerelésben=false fegyver NEM számít', () => {
    const k: Karakter = {
      ...base,
      fegyverek: [{ alap: 'Balta', név: '', anyag: 'acél', idea: 0, felszerelésben: false }],
    };
    expect(felszerelésTerhelés(k, data)).toBe(0);
    // de a sorban megjelenik (read-only), csak nem számít
    const sor = felszerelésSorok(k, data).find(s => s.típus === 'fegyver');
    expect(sor?.számít).toBe(false);
  });

  it('kézi tárgy mérete pontozódik (nagy=2), kicsi=0', () => {
    const k: Karakter = {
      ...base,
      felszerelés: { tárgyak: [{ név: 'Láda', méret: 'nagy' }, { név: 'Kötél', méret: 'kicsi' }], kizárt_auto: [], külső: [] },
    };
    expect(felszerelésTerhelés(k, data)).toBe(2);
  });

  it('pajzs kizárva (kizárt_auto) → nem számít', () => {
    const k: Karakter = {
      ...base,
      pajzs: { méret: 'nagy' },
      felszerelés: { tárgyak: [], kizárt_auto: ['pajzs'], külső: [] },
    };
    expect(felszerelésTerhelés(k, data)).toBe(0);
  });

  it('"külső" kézi tárgy NEM számít a terhelésbe, de a sor külső=true', () => {
    const k: Karakter = {
      ...base,
      felszerelés: { tárgyak: [{ név: 'Láda', méret: 'nagy', hely: 'külső' }], kizárt_auto: [], külső: [] },
    };
    expect(felszerelésTerhelés(k, data)).toBe(0);
    const sor = felszerelésSorok(k, data).find(s => s.típus === 'kézi');
    expect(sor).toMatchObject({ külső: true, számít: false, kulcs: 'Láda' });
  });

  it('"nincs nálad" kézi tárgy NEM számít (hely: nincs), a sor külső=false', () => {
    const k: Karakter = {
      ...base,
      felszerelés: { tárgyak: [{ név: 'Láda', méret: 'nagy', hely: 'nincs' }], kizárt_auto: [], külső: [] },
    };
    expect(felszerelésTerhelés(k, data)).toBe(0);
    const sor = felszerelésSorok(k, data).find(s => s.típus === 'kézi');
    expect(sor).toMatchObject({ külső: false, számít: false });
  });

  it('"külső" fegyver NEM számít (kulcs: fegyver:<idx>)', () => {
    const k: Karakter = {
      ...base,
      fegyverek: [{ alap: 'Balta', név: '', anyag: 'acél', idea: 0, felszerelésben: true }],
      felszerelés: { tárgyak: [], kizárt_auto: [], külső: ['fegyver:0'] },
    };
    expect(felszerelésTerhelés(k, data)).toBe(0);
    const sor = felszerelésSorok(k, data).find(s => s.típus === 'fegyver');
    expect(sor).toMatchObject({ külső: true, számít: false });
  });

  it('hiányzó felszerelés mező (régi/sérült karakter) nem dob, 0 terhelés', () => {
    // trust boundary: a karakter localStorage-ból/URL-ből jöhet felszerelés nélkül
    const k = { ...base, felszerelés: undefined } as unknown as Karakter;
    expect(() => felszerelésTerhelés(k, data)).not.toThrow();
    expect(felszerelésTerhelés(k, data)).toBe(0);
  });
});

describe('fizikaiTulajdonság', () => {
  it('Erő/Edzettség/Ügyesség/Gyorsaság/Érzékenység fizikai; Intelligencia nem', () => {
    for (const t of ['erő', 'edzettség', 'ügyesség', 'gyorsaság', 'érzékenység']) {
      expect(fizikaiTulajdonság(t, data)).toBe(true);
    }
    expect(fizikaiTulajdonság('intelligencia', data)).toBe(false);
    expect(fizikaiTulajdonság('önuralom', data)).toBe(false);
  });
});

describe('külsőJelző / páncélPajzsNincs (Felszerelés + Akadály közös frissítők)', () => {
  const alap = () => validKarakter({ felszerelés: { tárgyak: [], kizárt_auto: [], külső: ['páncél', 'fegyver:0'] } });
  it('külső jelző be / ki, duplikátum nélkül, a többi mező marad', () => {
    expect(külsőJelző(alap(), 'pajzs', true).felszerelés.külső).toEqual(['páncél', 'fegyver:0', 'pajzs']);
    expect(külsőJelző(alap(), 'páncél', true).felszerelés.külső).toEqual(['páncél', 'fegyver:0']);
    expect(külsőJelző(alap(), 'páncél', false).felszerelés.külső).toEqual(['fegyver:0']);
  });
  it('páncél nincs: aktív_páncél false + külső törölve; nálad: true', () => {
    const k = páncélPajzsNincs(alap(), 'páncél', true);
    expect([k.session.aktív_páncél, k.felszerelés.külső]).toEqual([false, ['fegyver:0']]);
    expect(páncélPajzsNincs(k, 'páncél', false).session.aktív_páncél).toBe(true);
  });
  it('pajzs nincs: kizárt_auto-ba kerül (egyszer), nálad: kikerül', () => {
    const k = páncélPajzsNincs(páncélPajzsNincs(alap(), 'pajzs', true), 'pajzs', true);
    expect(k.felszerelés.kizárt_auto).toEqual(['pajzs']);
    expect(páncélPajzsNincs(k, 'pajzs', false).felszerelés.kizárt_auto).toEqual([]);
  });
  it('régi mentés (felszerelés nélkül) nem dob', () => {
    const k = { ...alap(), felszerelés: undefined } as unknown as Karakter;
    expect(külsőJelző(k, 'pajzs', true).felszerelés).toEqual({ tárgyak: [], kizárt_auto: [], külső: ['pajzs'], úton: undefined });
  });
});
