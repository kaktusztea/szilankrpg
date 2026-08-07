import { describe, it, expect } from 'vitest';
import { createSnapshot, createCheckpoint, restoreFromCheckpoint, restoreTruncate, restoreAppend, deleteCheckpoint, autoCheckpointName } from './checkpoint-utils';
import type { Karakter, Checkpoint } from './types';
import { DEFAULT_SESSION } from './types';

/** Minimal valid karakter for testing. */
function makeKarakter(overrides: Partial<Karakter> = {}): Karakter {
  return {
    uid: 'uid-123',
    id_leíró: 'teszt-3tsz',
    schema_version: 2,
    név: 'Teszt',
    becenév: 'T',
    jk: true,
    játékos: '',
    mentés_dátum: '2026-01-01 12:00',
    tsz: 3,
    leírás: '',
    kor: 25,
    anyanyelv: 'Közös',
    vallás: '',
    tulajdonságok: { erő: 1, edzettség: 2, ügyesség: 0, gyorsaság: 0, intelligencia: 0, emlékezet: 0, önuralom: 0, érzékenység: 0 },
    HM_TÉ: 5,
    HM_VÉ: 10,
    CM: 0,
    képzettségek: [{ név: 'Kardvívás', szint: 3 }],
    fortélyok: [],
    fortélyok_speciális: { analfabéta: false, apró_méretű_lény: false, tartós_sérülés_fok: 0, vakság: false, süketség: false },
    hátterek: { faj: 'Ember', leíró: [], karma: [] },
    fegyverek: [],
    távfegyverek: [],
    páncél: { alap: '', név: '', fémalapanyag: '', idea: 0, kidolgozottság: 'átlagos', sisak: false, végtagvédettség: 0, méret_illeszkedés: 'passzol', rongálódás: 0 },
    pajzs: { méret: '' },
    felszerelés: { nagy_tárgyak: [] },
    előtörténet: { származás_helye: '', szociális_érzék: '', külső: '', előtörténet: '' },
    jegyzetek: '',
    napló: [],
    checkpoints: [],
    session: { ...DEFAULT_SESSION },
    ...overrides,
  };
}

function makeCp(id: string, név: string, snapshot: Partial<Karakter>, dátum = '2026-01-01T00:00:00.000Z'): Checkpoint {
  return { id, név, dátum, snapshot };
}

describe('createSnapshot', () => {
  it('excludes uid, id_leíró, session, checkpoints, mentés_dátum, schema_version', () => {
    const k = makeKarakter();
    const snap = createSnapshot(k);
    expect(snap).not.toHaveProperty('uid');
    expect(snap).not.toHaveProperty('id_leíró');
    expect(snap).not.toHaveProperty('session');
    expect(snap).not.toHaveProperty('checkpoints');
    expect(snap).not.toHaveProperty('mentés_dátum');
    expect(snap).not.toHaveProperty('schema_version');
  });

  it('includes karakter data fields', () => {
    const k = makeKarakter();
    const snap = createSnapshot(k);
    expect(snap.név).toBe('Teszt');
    expect(snap.tsz).toBe(3);
    expect(snap.tulajdonságok).toEqual(k.tulajdonságok);
    expect(snap.képzettségek).toEqual(k.képzettségek);
  });

  it('returns a deep clone (no shared references)', () => {
    const k = makeKarakter();
    const snap = createSnapshot(k);
    k.képzettségek[0].szint = 99;
    expect(snap.képzettségek![0].szint).toBe(3);
  });
});

describe('createCheckpoint', () => {
  it('creates a checkpoint with the given name', () => {
    const k = makeKarakter();
    const cps = createCheckpoint(k, 'v1');
    expect(cps).toHaveLength(1);
    expect(cps[0].név).toBe('v1');
    expect(cps[0].id).toHaveLength(8);
    expect(cps[0].snapshot.név).toBe('Teszt');
  });

  it('prepends to existing checkpoints (newest first)', () => {
    const existing = makeCp('old1', 'régi', { név: 'Régi' });
    const k = makeKarakter({ checkpoints: [existing] });
    const cps = createCheckpoint(k, 'új');
    expect(cps).toHaveLength(2);
    expect(cps[0].név).toBe('új');
    expect(cps[1].név).toBe('régi');
  });

  it('truncates name to 20 characters', () => {
    const k = makeKarakter();
    const cps = createCheckpoint(k, 'Ez egy nagyon hosszú checkpoint név ami túl hosszú');
    expect(cps[0].név).toHaveLength(20);
  });

  it('respects MAX_CHECKPOINTS limit', () => {
    const existing = Array.from({ length: 20 }, (_, i) => makeCp(`id${i}`, `cp${i}`, { név: `cp${i}` }));
    const k = makeKarakter({ checkpoints: existing });
    const cps = createCheckpoint(k, 'overflow');
    expect(cps).toHaveLength(20);
    expect(cps[0].név).toBe('overflow');
    // Last one got dropped
    expect(cps[19].név).toBe('cp18');
  });
});

describe('restoreFromCheckpoint', () => {
  it('applies snapshot and resets session', () => {
    const snap = { név: 'Régi név', tsz: 5, HM_TÉ: 20 } as Partial<Karakter>;
    const cp = makeCp('cp1', 'v1', snap);
    const k = makeKarakter({ checkpoints: [cp], név: 'Új név', tsz: 10, HM_TÉ: 50 });
    const restored = restoreFromCheckpoint(k, 'cp1', [cp]);
    expect(restored.név).toBe('Régi név');
    expect(restored.tsz).toBe(5);
    expect(restored.HM_TÉ).toBe(20);
    expect(restored.session).toEqual(DEFAULT_SESSION);
  });

  it('preserves uid, id_leíró, schema_version, mentés_dátum', () => {
    const cp = makeCp('cp1', 'v1', { név: 'X' });
    const k = makeKarakter({ checkpoints: [cp] });
    const restored = restoreFromCheckpoint(k, 'cp1', [cp]);
    expect(restored.uid).toBe('uid-123');
    expect(restored.id_leíró).toBe('teszt-3tsz');
    expect(restored.schema_version).toBe(2);
    expect(restored.mentés_dátum).toBe('2026-01-01 12:00');
  });

  it('uses provided newCheckpoints array', () => {
    const cp = makeCp('cp1', 'v1', { név: 'X' });
    const k = makeKarakter({ checkpoints: [cp] });
    const restored = restoreFromCheckpoint(k, 'cp1', []);
    expect(restored.checkpoints).toEqual([]);
  });

  it('returns unchanged karakter if checkpoint not found', () => {
    const k = makeKarakter({ checkpoints: [] });
    const restored = restoreFromCheckpoint(k, 'nonexistent', []);
    expect(restored).toBe(k);
  });
});

describe('restoreTruncate', () => {
  it('removes all newer checkpoints (lower index = newer)', () => {
    const cp1 = makeCp('cp1', 'newest', { név: 'N' }, '2026-03-01T00:00:00Z');
    const cp2 = makeCp('cp2', 'middle', { név: 'M', tsz: 7 }, '2026-02-01T00:00:00Z');
    const cp3 = makeCp('cp3', 'oldest', { név: 'O' }, '2026-01-01T00:00:00Z');
    const k = makeKarakter({ checkpoints: [cp1, cp2, cp3], név: 'Current', tsz: 10 });

    const restored = restoreTruncate(k, 'cp2');
    // cp1 (newer) removed, cp2 + cp3 remain
    expect(restored.checkpoints).toHaveLength(2);
    expect(restored.checkpoints[0].id).toBe('cp2');
    expect(restored.checkpoints[1].id).toBe('cp3');
    // State from cp2 snapshot
    expect(restored.név).toBe('M');
    expect(restored.tsz).toBe(7);
  });

  it('returns unchanged if checkpoint not found', () => {
    const k = makeKarakter();
    expect(restoreTruncate(k, 'nope')).toBe(k);
  });
});

describe('restoreAppend', () => {
  it('adds a new checkpoint copy at the front and restores state', () => {
    const cp1 = makeCp('cp1', 'v1', { név: 'V1', tsz: 3 });
    const k = makeKarakter({ checkpoints: [cp1], név: 'Current', tsz: 10 });

    const restored = restoreAppend(k, 'cp1');
    // New checkpoint prepended + original remains
    expect(restored.checkpoints.length).toBeGreaterThanOrEqual(2);
    expect(restored.checkpoints[0].név).toBe('← v1');
    expect(restored.checkpoints[0].id).not.toBe('cp1'); // new id
    // State from cp1 snapshot applied
    expect(restored.név).toBe('V1');
    expect(restored.tsz).toBe(3);
  });

  it('new checkpoint name is truncated to 20 chars', () => {
    const cp = makeCp('cp1', '12345678901234567890', { név: 'X' }); // 20 char name
    const k = makeKarakter({ checkpoints: [cp] });
    const restored = restoreAppend(k, 'cp1');
    // "← " (2 chars) + 20 chars = 22, truncated to 20
    expect(restored.checkpoints[0].név.length).toBeLessThanOrEqual(20);
  });

  it('returns unchanged if checkpoint not found', () => {
    const k = makeKarakter();
    expect(restoreAppend(k, 'nope')).toBe(k);
  });
});

describe('deleteCheckpoint', () => {
  it('removes checkpoint by id', () => {
    const cps = [makeCp('a', 'A', {}), makeCp('b', 'B', {}), makeCp('c', 'C', {})];
    expect(deleteCheckpoint(cps, 'b')).toHaveLength(2);
    expect(deleteCheckpoint(cps, 'b').find(c => c.id === 'b')).toBeUndefined();
  });

  it('returns unchanged array if id not found', () => {
    const cps = [makeCp('a', 'A', {})];
    expect(deleteCheckpoint(cps, 'zzz')).toEqual(cps);
  });
});

describe('autoCheckpointName', () => {
  it('returns YYYY-MM-DD auto mentés format', () => {
    const name = autoCheckpointName();
    expect(name).toMatch(/^\d{4}-\d{2}-\d{2} auto mentés$/);
  });
});
