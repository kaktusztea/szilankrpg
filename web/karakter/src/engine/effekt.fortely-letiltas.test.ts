import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcHarcComputed } from './harc/harc-computed';
import { státuszLetiltottFortélyok } from './effekt';
import type { Karakter, Session } from './types';

/** md/081 „Fortély hatás letiltása: X": a státusz a fortély minden hatását letiltja (fizikai (3) → Harci akrobatika). */
describe('Fortély hatás letiltása (státusz → fortély)', () => {
  const data = loadGameDataSync();
  const k: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  const fortélyTÉVÉ = (státuszok: string[]) => {
    const s = { ...k.session, harci_akrobatika: true, aktív_taktikák: [], aktív_helyzetek: [], aktív_státuszok: státuszok } as Session;
    const kar = { ...k, session: s, fortélyok: [...k.fortélyok.filter(f => f.id !== 'harci_akrobatika'), { id: 'harci_akrobatika', fok: 2, elem: '' }] } as Karakter;
    const r = calcHarcComputed(data, kar, s).fegyverResults[0].fortély;
    return [r.TÉ, r.VÉ];
  };

  it('Fizikai (3) letiltja a Harci akrobatikát; a státusz levétele után a bónusz visszajön', () => {
    const [téBe, véBe] = fortélyTÉVÉ([]);
    const [téKi, véKi] = fortélyTÉVÉ(['fizikai (3)']);
    expect([téBe - téKi, véBe - véKi]).toEqual([2, 2]);   // Harci akrobatika 2. fok: TÉ:+2, VÉ:+2
    expect(fortélyTÉVÉ(['fizikai (2)'])).toEqual([téBe, véBe]);
  });

  it('státuszLetiltottFortélyok: fortély-id → letiltó státusz', () => {
    expect([...státuszLetiltottFortélyok({ aktív_státuszok: ['fizikai (3)'] }, data)]).toEqual([['harci_akrobatika', 'Fizikai (3) Elcsigázottság']]);
    expect(státuszLetiltottFortélyok({ aktív_státuszok: ['fizikai (2)', 'sérült (1)'] }, data).size).toBe(0);
  });
});
