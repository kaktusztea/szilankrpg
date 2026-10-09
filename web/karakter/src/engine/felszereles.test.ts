/**
 * Felszerelés pure logika önteszt (engine/felszereles.ts).
 * Fedi: sávhatárok, auto-kudarc, VAGY-VAGY fegyverpont (Balta), felszerelésben/kizárt_auto
 * kihagyás, páncél-fedés küszöb.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  felszerelésMax, felszerelésTerhelés, felszerelésHátrány, felszerelésSorok, fizikaiTulajdonság,
} from '../engine/felszereles';
import { loadGameDataSync } from '../__tests__/load-gamedata';
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
      felszerelés: { tárgyak: [{ név: 'Láda', méret: 'nagy' }, { név: 'Kötél', méret: 'kicsi' }], kizárt_auto: [] },
    };
    expect(felszerelésTerhelés(k, data)).toBe(2);
  });

  it('pajzs kizárva (kizárt_auto) → nem számít', () => {
    const k: Karakter = {
      ...base,
      pajzs: { méret: 'nagy' },
      felszerelés: { tárgyak: [], kizárt_auto: ['pajzs'] },
    };
    expect(felszerelésTerhelés(k, data)).toBe(0);
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
