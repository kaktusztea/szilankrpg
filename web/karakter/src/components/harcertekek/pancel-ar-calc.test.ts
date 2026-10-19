import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { evaluate, buildContext } from '../../engine/reactive';
import { buildPancelLookups } from '../harc/pancel-calc';

/** Páncél ár reactive lánc (rules.json: páncél_ár) a valós data layerrel. */
function páncélÁr(opts: {
  alap: string; fémalapanyag: string; kidolgozottság?: string;
  idea?: number; végtag?: number; sisak?: boolean;
}): number {
  const data = loadGameDataSync();
  const { konstansok } = data;
  const lookupArrays = buildPancelLookups(konstansok);
  const stringCtx = new Map<string, string>([
    ['páncél_alap', opts.alap],
    ['páncél_fémalapanyag', opts.fémalapanyag],
    ['páncél_kidolgozottság', opts.kidolgozottság ?? 'átlagos'],
    ['páncél_méret_illeszkedés', 'passzol'],
  ]);
  const ctx = buildContext({ erő: 0 } as never, 1, konstansok, {
    páncél_van: 1, páncél_végtagvédettség: opts.végtag ?? 0,
    páncél_sisak: opts.sisak ? 1 : 0, páncél_idea: opts.idea ?? 0, páncél_rongálódás: 0,
  });
  return evaluate(data.rules, ctx, lookupArrays, stringCtx).get('páncél_ár') ?? -1;
}

describe('páncél_ár (rules.json)', () => {
  it('átlagos bőrpáncél, 0 tag = torzó ár (struktúra 10)', () => {
    expect(páncélÁr({ alap: 'bőr', fémalapanyag: 'acél' })).toBe(10);
  });

  it('teljes bőrpáncél (5 tag) = torzó kétszerese (md: 100% páncél)', () => {
    // torzó 10 + 5 × (10/5 × 1) = 20
    expect(páncélÁr({ alap: 'bőr', fémalapanyag: 'acél', végtag: 4, sisak: true })).toBe(20);
  });

  it('fém páncél abbitacéllal szorzódik (lánc 100 × abbitacél 10)', () => {
    expect(páncélÁr({ alap: 'lánc/sodrony', fémalapanyag: 'abbitacél' })).toBe(1000);
  });

  // REGRESSZIÓ: fém páncél üres/választatlan fémalapanyaggal NEM nullázhatja az árat
  // (a UI default acél-t mutat, de a karakterben a mező üres lehet felvételkor).
  it('fém páncél üres fémalapanyaggal → semleges 1 szorzó (nem 0)', () => {
    expect(páncélÁr({ alap: 'lánc/sodrony', fémalapanyag: '' })).toBe(100);
  });
});
