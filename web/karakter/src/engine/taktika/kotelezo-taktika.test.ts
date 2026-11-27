import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Karakter, Session } from '../types';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { kötelezőTaktikák, kötelezőTaktikaSzinkron } from './kotelezo-taktika';

const data = loadGameDataSync();
const k: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));
const s = (aktív_státuszok: string[], aktív_taktikák: Session['aktív_taktikák'] = []): Session =>
  ({ ...k.session, aktív_státuszok, aktív_taktikák });

describe('kötelezőTaktikák (statuszok.yaml taktika_kötelező)', () => {
  it('Félelem (1) → Védő (3); Félelem (2) → Teljes Védekezés (no fok); Félelem (3) → none', () => {
    expect(kötelezőTaktikák(['félelem (1)'], k, data)).toEqual([{ név: 'Védő', fok: 3 }]);
    expect(kötelezőTaktikák(['félelem (2)'], k, data)).toEqual([{ név: 'Teljes Védekezés' }]);
    expect(kötelezőTaktikák(['félelem (3)'], k, data)).toEqual([]);
  });
  it('Indulat (2): Támadó MAX only - the conditional (szituációs) Öngyilkos roham / Roham are not set', () => {
    const r = kötelezőTaktikák(['indulat (2)'], k, data);
    expect(r.map(t => t.név)).toEqual(['Támadó']);
    expect(r[0].fok).toBeGreaterThanOrEqual(1);
  });
});

describe('kötelezőTaktikaSzinkron', () => {
  it('adding the status sets the taktika, removing it removes the taktika', () => {
    const be = kötelezőTaktikaSzinkron(s([]), s(['félelem (1)']), k, data);
    expect(be.aktív_taktikák).toEqual([{ név: 'Védő', fok: 3 }]);
    const ki = kötelezőTaktikaSzinkron(be, { ...be, aktív_státuszok: [] }, k, data);
    expect(ki.aktív_taktikák).toEqual([]);
  });
  it('fok change of the status swaps the taktika (Védő (3) → Teljes Védekezés)', () => {
    const r = kötelezőTaktikaSzinkron(s(['félelem (1)'], [{ név: 'Védő', fok: 3 }]), s(['félelem (2)'], [{ név: 'Védő', fok: 3 }]), k, data);
    expect(r.aktív_taktikák).toEqual([{ név: 'Teljes Védekezés' }]);
  });
  it('a manual edit is kept while the status does not change (other status added)', () => {
    const prev = s(['félelem (1)'], [{ név: 'Védő', fok: 1 }]);
    const r = kötelezőTaktikaSzinkron(prev, { ...prev, aktív_státuszok: ['félelem (1)', 'eszmélet (1)'] }, k, data);
    expect(r.aktív_taktikák).toEqual([{ név: 'Védő', fok: 1 }]);
  });
  it('unrelated status change: same session object', () => {
    const prev = s([]);
    const next = { ...prev, aktív_státuszok: ['eszmélet (1)'] };
    expect(kötelezőTaktikaSzinkron(prev, next, k, data)).toBe(next);
  });
});
