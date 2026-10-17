/**
 * njkHarcértékStat - az NJK switcher gyors harcérték-statja (KÉ/TÉ/VÉ).
 * Cél: a stat a HarcScreen pure building blockjaival konzisztens értéket adjon.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { njkHarcértékStat } from '../hooks/njk-slots';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';

let data: GameData;
let karakter: Karakter;

beforeAll(() => {
  data = loadGameDataSync();
  karakter = data.testKarakter;
});

describe('njkHarcértékStat', () => {
  it('a Harc fül fejlécével AZONOS (KÉ 19 / TÉ 52 / VÉ 59 a teszt karakteren - kétkezes, fortélyok, taktika)', () => {
    expect(njkHarcértékStat(karakter, data)).toEqual({ KÉ: 19, TÉ: 52, VÉ: 59 });
  });

  it('a teszt karakternek van aktív fegyvere → TÉ/VÉ nem null, és pozitív', () => {
    const stat = njkHarcértékStat(karakter, data);
    expect(stat.TÉ).not.toBeNull();
    expect(stat.VÉ).not.toBeNull();
    expect(stat.TÉ!).toBeGreaterThan(0);
    expect(stat.VÉ!).toBeGreaterThan(0);
  });

  it('a VÉ a session.vé_csökkenés-sel csökken (nem a max VÉ-t mutatja)', () => {
    const alap = njkHarcértékStat(karakter, data);
    // Csak akkor értelmes, ha van kiszámolt VÉ.
    expect(alap.VÉ).not.toBeNull();
    const csökkentett: Karakter = {
      ...karakter,
      session: { ...karakter.session, vé_csökkenés: 5 },
    };
    const stat = njkHarcértékStat(csökkentett, data);
    // 5 ponttal kisebb (feltéve, hogy a VÉ nem clamp-elődött 0-ra - a teszt karakter VÉ-je nagy).
    expect(stat.VÉ!).toBe(Math.max(0, alap.VÉ! - 5));
    expect(stat.VÉ!).toBeLessThan(alap.VÉ!);
  });

  it('üres (fegyvertelen) karakternél is ad értéket - puszta kéz az aktív, nem dob', () => {
    const üres: Karakter = {
      ...data.emptyKarakter,
      session: { ...data.emptyKarakter.session, aktív_fegyver_index: -1 },
    };
    const stat = njkHarcértékStat(üres, data);
    expect(stat.KÉ).toBeTypeOf('number');
    // puszta kéz az aktív jobb kéz → TÉ/VÉ kiszámolt (nem null)
    expect(stat.TÉ).not.toBeNull();
    expect(stat.VÉ).not.toBeNull();
  });
});
