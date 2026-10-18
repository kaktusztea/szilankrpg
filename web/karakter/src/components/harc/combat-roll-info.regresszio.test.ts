/**
 * Regressziós háló a harci dobás-hatásokra (collectDobásInfo / collectCéDobásInfo): karakter × session-variáns
 * (minden taktika fokonként, minden helyzet, minden státusz-fok picker-formátumban). A snapshot a közös
 * effekt-gyűjtőre váltás ELŐTT készült (2026-10-18), a régi kézi gyűjtéssel.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { collectDobásInfo, collectCéDobásInfo } from './combat-roll-info';
import type { Karakter, Session } from '../../engine/types';

const data = loadGameDataSync();
const karakterJson = (f: string): Karakter =>
  JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter', f), 'utf-8'));

function mindenFortély(alap: Karakter, fokIndex: number): Karakter {
  const fortélyok = data.fortelySummaries.flatMap(fd => {
    const fokok = fd.fokok.map(f => f.fok).filter(f => f >= 1);
    const fok = fokok[Math.min(fokIndex, fokok.length - 1)];
    return fok ? [{ id: fd.id, fok, elem: '' }] : [];
  });
  return { ...alap, fortélyok } as Karakter;
}

function sessionVariánsok(base: Session): [string, Session][] {
  const üres = { ...base, aktív_taktikák: [], aktív_helyzetek: [], aktív_státuszok: [] };
  const ki: [string, Session][] = [['alap', base], ['üres', üres]];
  for (const t of data.taktikak) {
    for (const fok of t.fokozatos ? [1, 2, 3, 5] : [undefined]) {
      ki.push([`taktika ${t.név}${fok ? ` ${fok}` : ''}`, { ...üres, aktív_taktikák: [{ név: t.név, ...(fok ? { fok } : {}) }] } as Session]);
    }
  }
  for (const h of data.harciHelyzetek) ki.push([`helyzet ${h.név}`, { ...üres, aktív_helyzetek: [h.név] }]);
  for (const s of data.statuszok) for (const f of s.fokok) {
    const nevek = s.alkategóriák?.length ? s.alkategóriák.map(a => `${s.név}: ${a} (${f.fok})`) : [`${s.név} (${f.fok})`];
    for (const n of nevek) ki.push([`státusz ${n}`, { ...üres, aktív_státuszok: [n] }]);
  }
  ki.push(['kombó', { ...üres, aktív_taktikák: [{ név: 'Roham' }, { név: 'Visszafogott' }], aktív_helyzetek: ['Orvtámadás'], aktív_státuszok: ['Félelem (1)'] } as Session]);
  return ki;
}

describe('harci dobás-hatások regressziós snapshot', () => {
  const alapok = ['test_karakter2.json', 'test_karakter3.json'].map(karakterJson);
  const karakterek: [string, Karakter][] = [
    ['teszt2', alapok[0]], ['teszt3', alapok[1]],
    ...[0, 1, 2].map(i => [`minden fortély ${i}`, mindenFortély(alapok[0], i)] as [string, Karakter]),
  ];
  for (const [címke, k] of karakterek) {
    it(címke, () => {
      const ki: Record<string, unknown> = {};
      for (const [sc, session] of sessionVariánsok(k.session)) {
        const kk = { ...k, session };
        const d = collectDobásInfo(session, kk, data);
        const c = collectCéDobásInfo(session, kk, data);
        const nemÜres = Object.values(d).some(v => v.length) || c.céHatások.length || c.céMegjegyzések.length;
        if (nemÜres) ki[sc] = { d, c };
      }
      expect(ki).toMatchSnapshot();
    });
  }
});
