import { describe, it, expect } from 'vitest';
import { helyzetFelvéve } from './helyzet-helpers';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import type { Session } from '../types';

describe('helyzetFelvéve (helyzet switched on from the picker)', () => {
  const data = loadGameDataSync();
  const alap = data.testKarakter.session;
  const s = (patch: Partial<Session>): Session => ({ ...alap, aktív_helyzetek: [], aktív_taktikák: [], ...patch });

  it('adds the helyzet and drops the helyzetek it excludes (kizár_helyzetek: id → név)', () => {
    const ki = helyzetFelvéve(s({ aktív_helyzetek: ['Meglepetés', 'Belharci helyzet'] }), 'Orvtámadás', data);
    expect(ki.aktív_helyzetek).toEqual(['Belharci helyzet', 'Orvtámadás']);
  });
  it('tiltja_taktikákat clears the taktikák, otherwise they stay', () => {
    const taktikák = [{ név: 'Roham' }];
    expect(helyzetFelvéve(s({ aktív_taktikák: taktikák }), 'Orvtámadás', data).aktív_taktikák).toEqual([]);
    expect(helyzetFelvéve(s({ aktív_taktikák: taktikák }), 'Belharci helyzet', data).aktív_taktikák).toBe(taktikák);
  });
  it('a forbidden fegyverfogás falls back to egyfegyveres (Lovas harc: no kétkezes)', () => {
    const ki = helyzetFelvéve(s({ fegyverfogás: 'kétkezes', kétkezes_harc: true, aktív_pajzs: true, aktív_fegyver_bal_index: 1 }), 'Lovas harc', data);
    expect(ki).toMatchObject({ fegyverfogás: 'egyfegyveres', kétkezes_harc: false, aktív_pajzs: false, aktív_fegyver_bal_index: -1 });
    expect(helyzetFelvéve(s({ fegyverfogás: 'egyfegyveres', aktív_pajzs: true }), 'Lovas harc', data).aktív_pajzs).toBe(true);
  });
});
