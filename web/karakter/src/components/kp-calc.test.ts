import { describe, it, expect, beforeAll } from 'vitest';
import type { GameData } from '../engine/data-loader';
import { calcKpDetails, type KpDetails } from './kp-calc';
import { loadGameDataSync } from '../__tests__/load-gamedata';

let data: GameData;
beforeAll(() => { data = loadGameDataSync(); });

describe('calcKpDetails (real game data)', () => {
  it('produces finite numbers for every field with the empty character', () => {
    const r = calcKpDetails(data, data.emptyKarakter);
    for (const [k, v] of Object.entries(r)) {
      expect(Number.isFinite(v), `${k} should be finite`).toBe(true);
    }
    // An empty character has spent no KP.
    expect(r.elköltöttKp).toBe(0);
  });

  it('produces a positive budget and non-zero spend for the test character', () => {
    const r: KpDetails = calcKpDetails(data, data.testKarakter);
    for (const [k, v] of Object.entries(r)) {
      expect(Number.isFinite(v), `${k} should be finite`).toBe(true);
    }
    expect(r.összesKp).toBeGreaterThan(0);
    expect(r.elköltöttKp).toBeGreaterThan(0);
  });
});
