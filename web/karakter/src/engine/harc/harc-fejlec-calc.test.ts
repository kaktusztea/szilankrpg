import { describe, it, expect } from 'vitest';
import { harcFejlécÉrtékek } from './harc-fejlec-calc';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

/** A Támadó dobás popup SP-je (aktívSP) = a fegyvertábla SP-je: a taktika SP-je is benne van (Roham +5). */
describe('harcFejlécÉrtékek: aktívSP', () => {
  const data = loadGameDataSync();
  const k = data.testKarakter;
  const sp = (taktikák: { név: string; fok?: number }[]) => {
    const session = { ...k.session, aktív_taktikák: taktikák, aktív_helyzetek: [], aktív_státuszok: [] };
    const r = harcFejlécÉrtékek(data, k, session);
    return { aktív: r.aktívSP!, fegyver: r.ctx!.result.SP, taktika: r.hc.taktikaMods['SP'] };
  };
  it('taktika nélkül a fegyver SP-je', () => {
    const r = sp([]);
    expect(r.taktika).toBe(0);
    expect(r.aktív).toBe(r.fegyver);
  });
  it('Roham: a taktika SP-je hozzáadódik', () => {
    const r = sp([{ név: 'Roham' }]);
    expect(r.taktika).toBe(5);
    expect(r.aktív).toBe(sp([]).aktív + 5);
  });
});
