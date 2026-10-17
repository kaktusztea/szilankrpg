/**
 * Regressziós háló a fortély- és taktika-módosítókra (§42 3. fázis): a calcFortelyMods / calcTaktikaMods
 * eredménye karakter × session-variánsonként, snapshotként rögzítve. A snapshot a régi (kézi) implementációval
 * készült, a közös effekt-gyűjtőre váltás után is egyeznie kell (2026-10-16).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { useHarcComputed } from '../components/harc/useHarcComputed';
import type { Karakter, Session } from './types';

const data = loadGameDataSync();
const karakterJson = (f: string): Karakter =>
  JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter', f), 'utf-8'));

function mindenFortély(alap: Karakter, fokIndex: number): Karakter {
  const fortélyok = data.fortelySummaries.flatMap(fd => {
    const fokok = fd.fokok.map(f => f.fok).filter(f => f >= 1);
    const fok = fokok[Math.min(fokIndex, fokok.length - 1)];
    return fok ? [{ id: fd.id, fok, elem: '' }] : [];
  });
  return { ...alap, fortélyok } as Karakter;
}

function sessionVariánsok(base: Session): [string, Session][] {
  const ki: [string, Session][] = [['alap', base], ['üres', { ...base, aktív_taktikák: [], aktív_helyzetek: [] }]];
  for (const t of data.taktikak) {
    for (const fok of t.fokozatos ? [1, 2, 3, 5] : [undefined]) {
      ki.push([`taktika ${t.név}${fok ? ` ${fok}` : ''}`, { ...base, aktív_taktikák: [{ név: t.név, ...(fok ? { fok } : {}) }] } as Session]);
    }
  }
  for (const h of data.harciHelyzetek) ki.push([`helyzet ${h.név}`, { ...base, aktív_taktikák: [], aktív_helyzetek: [h.név] }]);
  ki.push(['±10 plafon', { ...base, aktív_taktikák: [{ név: 'Teljes Védekezés' }, { név: 'Védő', fok: 3 }] } as Session]);
  return ki;
}

// A fogyasztók által ténylegesen olvasott kulcsok (a régi calcFortelyMods minden flat célt - pl. képzettségpróba,
// manőver:*, MGT_TÉ_büntetés - is beleírt, de azokat semmi nem olvasta).
const OLVASOTT = new Set(['KÉ', 'TÉ', 'VÉ', 'SP', 'CÉ', 'harckeret', 'SFÉ', 'fegyverhossz', 'SP_erőbónusz_arány']);
const nemNulla = (r: Record<string, number>) => Object.fromEntries(Object.entries(r).filter(([k, v]) => v !== 0 && OLVASOTT.has(k)));

describe('fortély- és taktika-módosítók regressziós snapshot', () => {
  const alapok = ['test_karakter2.json', 'test_karakter3.json'].map(karakterJson);
  const karakterek: [string, Karakter][] = [
    ['teszt2', alapok[0]], ['teszt3', alapok[1]],
    ...[0, 1, 2].map(i => [`minden fortély ${i}`, mindenFortély(alapok[0], i)] as [string, Karakter]),
  ];
  for (const [címke, k] of karakterek) {
    it(címke, () => {
      const ki: Record<string, unknown> = {};
      for (const [sc, session] of sessionVariánsok(k.session)) {
        const hc = useHarcComputed(data, { ...k, session }, session);
        const f = nemNulla(hc.fortelyMods), t = nemNulla(hc.taktikaMods);
        if (Object.keys(f).length || Object.keys(t).length) ki[sc] = { f, t };
      }
      expect(ki).toMatchSnapshot();
    });
  }
});
