import { describe, it, expect } from 'vitest';
import { coalesceKey, isNoopAfterCoalesce, type UndoPatch } from './useUndo';

// A páncél toggle (session.aktív_páncél) undo-viselkedésének ellenőrzése:
// oda-vissza váltás NE töltse az undo stacket (coalesce + noop-drop).

const sessionOn = { aktív_páncél: true, aktív_pajzs: false } as const;
const sessionOff = { aktív_páncél: false, aktív_pajzs: false } as const;

const pancelPatch = (prev: unknown): UndoPatch[] =>
  [{ field: 'session', prev, ckey: 'aktív_páncél' }];

describe('undo coalesce — session toggle', () => {
  it('páncél toggle egymást követő váltásai összeolvadnak (azonos ckey)', () => {
    const first = coalesceKey(pancelPatch(sessionOn));
    const second = coalesceKey(pancelPatch(sessionOff));
    expect(first).toBe('session:aktív_páncél');
    expect(second).toBe(first);
  });

  it('Igen→Nem→Igen visszaállás noop: a merged prev egyezik az új értékkel', () => {
    // merged patch az eredeti (Igen) állapotot tartja; a 2. váltás után az új session újra Igen
    const merged = pancelPatch(sessionOn);
    expect(isNoopAfterCoalesce(merged, sessionOn)).toBe(true);
    // Ha az új állapot Nem lenne (csak egyszer váltottunk), nem noop
    expect(isNoopAfterCoalesce(merged, sessionOff)).toBe(false);
  });

  it('ckey nélküli session bejegyzés NEM coalesce-elhető (diszkrét esemény)', () => {
    expect(coalesceKey([{ field: 'session', prev: sessionOn }])).toBeNull();
  });

  it('eltérő ckey-jű session bejegyzések nem olvadnak össze', () => {
    const a = coalesceKey([{ field: 'session', prev: sessionOn, ckey: 'aktív_páncél' }]);
    const b = coalesceKey([{ field: 'session', prev: sessionOn, ckey: 'manőver_pont' }]);
    expect(a).not.toBe(b);
  });
});
