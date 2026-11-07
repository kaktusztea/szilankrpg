/**
 * Regression net for refactor phase 4.1 (VÉ-csökkentés fortély part onto the shared §42 collector): the full
 * taktikaVéCsökkentésÁllapot result for both test characters (± Fárasztás fortély 1) × every tactic alone
 * (+ Fárasztás with Roham) × combat situations, recorded with the OLD implementation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { calcHarcComputed } from './harc-computed';
import { taktikaVéCsökkentésÁllapot } from './ve-csokkentes-calc';
import type { Karakter, Session } from '../types';

const data = loadGameDataSync();
const kar = (f: string): Karakter => JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter', f), 'utf-8'));

describe('taktikaVéCsökkentésÁllapot regression', () => {
  const karakterek: [string, Karakter][] = [];
  for (const f of ['test_karakter2.json', 'test_karakter3.json']) {
    const k = kar(f);
    karakterek.push([f, k]);
    const fa = { ...k, fortélyok: [...k.fortélyok.filter(x => x.id !== 'fárasztás'), { id: 'fárasztás', fok: 1, elem: '' }] };
    karakterek.push([`${f}+fárasztás1`, fa]);
  }
  const taktikaSetek: string[][] = [...data.taktikak.map(t => [t.név]), ['Fárasztás', 'Roham']];
  const helyzetSetek: string[][] = [[], ['Fegyverelőny'], ['Meglepetés'], ['Fegyverelőny', 'Láthatatlan - teljesen']];

  it('snapshot', () => {
    const out: Record<string, unknown> = {};
    for (const [név, k] of karakterek) {
      for (const tk of taktikaSetek) {
        for (const hs of helyzetSetek) {
          const session: Session = { ...k.session, aktív_taktikák: tk.map(n => ({ név: n, fok: 1 })), aktív_helyzetek: hs };
          const kk = { ...k, session };
          const hc = calcHarcComputed(data, kk, session);
          const r = taktikaVéCsökkentésÁllapot(data, kk, session, hc.feltételTeljesül, hc.helyzetVéCsökkentés);
          out[`${név} | ${tk.join('+')} | ${hs.join('+') || '-'}`] = {
            fárasztás: r.fárasztásEredmény, szorzó: r.véCsökkentésSzorzó, forrás: r.véCsökkentésSzorzóForrás ?? null,
            tv: !!r.teljesVédekezésDef,
          };
        }
      }
    }
    expect(out).toMatchSnapshot();
  });
});
