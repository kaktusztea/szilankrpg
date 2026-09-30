import { describe, it, expect } from 'vitest';
import { SP_NINCS } from '../../engine/types';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import type { TavfegyverAlap } from '../../engine/types';

/**
 * A SebzesPopup az SP_NINCS (-99) sentinelt "nem sebez"-ként kezeli. Ez a teszt a data↔kód
 * drift ellen véd: ha valaki a sentinel-értéket vagy egy fegyver SP-jét elrontja, itt bukik.
 */
describe('SP_NINCS sentinel (Sebzés ablak: "nem sebez")', () => {
  const data = loadGameDataSync();
  const tavfegyverek = data.tavfegyverek as TavfegyverAlap[];

  it('SP_NINCS a dokumentált -99 érték', () => {
    expect(SP_NINCS).toBe(-99);
  });

  it('van SP_NINCS-jelölt (nem sebző) távfegyver, és a -99 kizárólag sentinel (nem valódi SP-érték)', () => {
    const sentinelesek = tavfegyverek.filter(t => t.SP === SP_NINCS);
    expect(sentinelesek.length).toBeGreaterThan(0); // pl. Bola, Dobóháló, Lasszó, Fúvócső kicsi
    // A valódi (nem-sentinel) SP-k mind > SP_NINCS - a -99 sosem "épp ennyit sebez" érték.
    // (Negatív SP önmagában megengedett, pl. Dobócsillag -3; csak a -99 jelent "nem sebez"-t.)
    for (const t of tavfegyverek) {
      if (t.SP !== SP_NINCS) expect(t.SP, `${t.név}`).toBeGreaterThan(SP_NINCS);
    }
  });

  it('melee fegyver (fegyverek_v2) egyetlen módja sem SP_NINCS (a sentinel csak távharc)', () => {
    const fegyverek = data.fegyverek as { név: string; módok: { SP: number }[] }[];
    const meleeSentinel = fegyverek.flatMap(f => (f.módok ?? []).filter(m => m.SP === SP_NINCS).map(() => f.név));
    expect(meleeSentinel).toEqual([]);
  });
});
