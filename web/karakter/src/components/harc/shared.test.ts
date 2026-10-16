import { describe, it, expect } from 'vitest';
import { buildPajzsFegyverNév, resolveNagyobbKisebb, computeTÉ, computeVÉ, coalesceVéHistory, véVesztésSzorzó } from './shared';
import type { Karakter } from '../../engine/types';

describe('buildPajzsFegyverNév', () => {
  it('builds name from méret', () => {
    const k = { pajzs: { méret: 'közepes' } } as unknown as Karakter;
    expect(buildPajzsFegyverNév(k)).toBe('Közepes Pajzs');
  });
  it('returns null if no méret', () => {
    const k = { pajzs: { méret: '' } } as unknown as Karakter;
    expect(buildPajzsFegyverNév(k)).toBeNull();
  });
});

describe('resolveNagyobbKisebb', () => {
  it('picks larger by fegyverhossz', () => {
    const jobb = { fegyverhossz: 0.8 };
    const bal = { fegyverhossz: 0.4 };
    const result = resolveNagyobbKisebb(jobb, bal, { alap: 'J' }, { alap: 'B' });
    expect(result.nagyobb).toBe(jobb);
    expect(result.kisebb).toBe(bal);
    expect(result.jobbFh).toBe(0.8);
    expect(result.balFh).toBe(0.4);
  });
  it('jobb wins on tie', () => {
    const jobb = { fegyverhossz: 0.5 };
    const bal = { fegyverhossz: 0.5 };
    const result = resolveNagyobbKisebb(jobb, bal, { alap: 'J' }, { alap: 'B' });
    expect(result.nagyobb).toBe(jobb);
  });
});

describe('computeTÉ', () => {
  it('calculates TÉ without többtám', () => {
    expect(computeTÉ(50, -5, 10, 2, 1, -15)).toBe(57);
  });
  it('applies többtám penalty with multiple attacks', () => {
    expect(computeTÉ(50, 0, 0, 0, 2, -15)).toBe(35);
  });
});

describe('computeVÉ', () => {
  it('calculates VÉ normally', () => {
    expect(computeVÉ(100, 10, -20, 30)).toBe(60);
  });
  it('floors at 0', () => {
    expect(computeVÉ(10, 0, -5, 50)).toBe(0);
  });
});

describe('coalesceVéHistory', () => {
  const W = 5000;
  it('appends first entry (no prior)', () => {
    expect(coalesceVéHistory([], -3, Infinity, W)).toEqual([-3]);
  });
  it('merges consecutive same-direction changes within window (-3,-1,-1 → -5)', () => {
    let h = coalesceVéHistory([], -3, Infinity, W);
    h = coalesceVéHistory(h, -1, 1000, W);
    h = coalesceVéHistory(h, -1, 1000, W);
    expect(h).toEqual([-5]);
  });
  it('starts a new entry when the window has elapsed', () => {
    const h = coalesceVéHistory([-3], -1, 6000, W);
    expect(h).toEqual([-3, -1]);
  });
  it('does not merge opposite directions (csökkenés then visszanyerés)', () => {
    const h = coalesceVéHistory([-3], 1, 1000, W);
    expect(h).toEqual([-3, 1]);
  });
  it('merges visszanyerés entries too', () => {
    const h = coalesceVéHistory([2], 1, 1000, W);
    expect(h).toEqual([3]);
  });
});

describe('véVesztésSzorzó (helyzet + státusz effektek)', () => {
  const e = (cél: string, mód: string, érték: number, név: string, típus: 'helyzet' | 'státusz' = 'helyzet') =>
    ({ cél, mód, érték, forrás: { típus, név } });
  it('nincs vé_veszteség szorzó → 1x, forrás nélkül', () => {
    expect(véVesztésSzorzó([e('té_dobás', 'hátrány', -1, 'Csúszós talaj')])).toEqual({ szorzó: 1, forrás: '' });
  });
  it('helyzet ×2 → 2x a forrás nevével', () => {
    expect(véVesztésSzorzó([e('vé_veszteség', 'szorzó', 2, 'Földön fekve')])).toEqual({ szorzó: 2, forrás: 'Földön fekve' });
  });
  it('helyzet + státusz nem halmozódik - a legnagyobb dominál (×2, nem ×4, §42.3)', () => {
    expect(véVesztésSzorzó([e('vé_veszteség', 'szorzó', 2, 'Földön fekve'), e('vé_veszteség', 'szorzó', 2, 'Fizikai (2)', 'státusz')]))
      .toEqual({ szorzó: 2, forrás: 'Földön fekve' });
  });
});
