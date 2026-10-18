import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { calcTávSP } from './helpers';
import { SP_NINCS, type Karakter } from '../../engine/types';

// Távharci SP (engine_spec §17.6, 2026-10-18): alap + Erőbónusz (hajító: mindig; íj: csak kapcsolva) + Mesterfegyver.
const data = loadGameDataSync();
const alap: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));
const def = (név: string) => data.tavfegyverek.find(f => f.név === név)!;
const k = (erő: number, mf?: { elem: string; fok: number }) => ({
  ...alap, tulajdonságok: { ...alap.tulajdonságok, erő },
  fortélyok: mf ? [{ id: 'mesterfegyver', elem: mf.elem, fok: mf.fok }] : [],
}) as Karakter;

describe('calcTávSP', () => {
  it('hajítófegyver: Erőbónusz a limitig (Hajítótőr limit 1, Dárda limit 99)', () => {
    expect(calcTávSP(k(3), data, def('Hajítótőr'), 'Hajítótőr')).toEqual(
      { sp: def('Hajítótőr').SP + 1, bónuszok: [{ forrás: 'Erőbónusz', érték: 1 }], tervezettÍjErő: 0, íjErőLimitált: false });
    expect(calcTávSP(k(3), data, def('Dárda'), 'Dárda').sp).toBe(def('Dárda').SP + 3);
    expect(calcTávSP(k(-1), data, def('Dárda'), 'Dárda').sp).toBe(def('Dárda').SP); // negatív Erő nem von le
  });

  it('íj: az Erőbónusz NEM az SP-ben, hanem kapcsolhatóként (Hosszú íj limit 3)', () => {
    const r = calcTávSP(k(5), data, def('Hosszú íj'), 'Hosszú íj');
    expect([r.sp, r.bónuszok, r.tervezettÍjErő]).toEqual([def('Hosszú íj').SP, [], 3]);
    expect(r.íjErőLimitált).toBe(true);   // Erő 5 > limit 3
    expect(calcTávSP(k(3), data, def('Hosszú íj'), 'Hosszú íj').íjErőLimitált).toBe(false);   // Erő = limit
  });

  it('nyílpuska: nincs Erőbónusz (limit 0)', () => {
    expect(calcTávSP(k(5), data, def('Nyílpuska'), 'Nyílpuska')).toEqual({ sp: def('Nyílpuska').SP, bónuszok: [], tervezettÍjErő: 0, íjErőLimitált: false });
  });

  it('Mesterfegyver SP csak a megjelölt távfegyverre', () => {
    const mf = data.konstansok.mesterfegyver_bónuszok.find(b => b.fok === 2)!.SP;
    expect(calcTávSP(k(0, { elem: 'Nyílpuska', fok: 2 }), data, def('Nyílpuska'), 'Nyílpuska').bónuszok)
      .toEqual([{ forrás: 'Mesterfegyver - Nyílpuska', érték: mf }]);
    expect(calcTávSP(k(0, { elem: 'Rövid íj', fok: 2 }), data, def('Nyílpuska'), 'Nyílpuska').bónuszok).toEqual([]);
  });

  it('nem sebző (SP_NINCS) és mágikus: változatlan nyers érték, bontás nélkül', () => {
    expect(calcTávSP(k(5), data, def('Bola'), 'Bola').sp).toBe(SP_NINCS);
    expect(calcTávSP(k(5), data, def('Mágiatáv I'), 'Mágiatáv I')).toEqual({ sp: 0, bónuszok: [], tervezettÍjErő: 0, íjErőLimitált: false });
  });
});
