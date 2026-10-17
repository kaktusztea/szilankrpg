/**
 * Regressziós háló a fortély/képzettség id-átálláshoz (2026-10-17, F0): a két teszt karakter SZÁMÍTOTT értékei
 * (KP-bontás, primer KP, harcértékek, fegyversorok, követelmény-hiányok, próba-bónuszok) snapshotként, a név-alapú
 * implementációval rögzítve. Az id-re váltás (F1-F4) csak a hivatkozási réteget érinti → a snapshot nem változhat.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { useHarcComputed } from '../components/harc/useHarcComputed';
import { calcKpDetails } from '../components/kp-calc';
import { calcPrimerKp } from '../components/tulajdonsagok/primerKpCalc';
import { checkKövetelmények } from '../components/fortelyok/helpers';
import { fortélyPróbaBónuszok } from './effekt';
import type { Karakter } from './types';
import { fortélyNév, képzettségNév, képzKulcs } from './azonosito';

const data = loadGameDataSync();
const karakterJson = (f: string): Karakter =>
  JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter', f), 'utf-8'));

function számított(k: Karakter) {
  const hc = useHarcComputed(data, k, k.session);
  const fajF = data.fajFortélyok[k.hátterek.faj] ?? {};
  return {
    kp: calcKpDetails(data, k),
    primerKp: calcPrimerKp(data, k, k.képzettségek),
    harc: {
      ké: hc.ké, ép: hc.épValue, mp: hc.manöverPont, ma: hc.manőverAlap, sfé: [hc.sfé_fizikai, hc.sfé_energia],
      mgt: hc.páncélMGT, merevvért: hc.merevvértBüntetés, pajzsVÉ: hc.pajzsVÉ, maxVéCsökk: hc.maxVéCsökk,
      fortélyMods: hc.fortelyMods, fegyverek: hc.fegyverResults, kétkezes: hc.kétkezesResult, fogás: hc.fogásResult,
    },
    követelményHiány: Object.fromEntries(k.fortélyok.map(f => {
      const fokDef = data.fortelySummaries.find(d => d.id === f.id)?.fokok.find(x => x.fok === f.fok);
      return [`${fortélyNév(f, data)}${f.elem ? ` [${f.elem}]` : ''} (${f.fok})`,
        checkKövetelmények(fokDef, k.képzettségek, k.fortélyok, data, undefined, fajF, f.id)];
    }).filter(([, h]) => (h as string[]).length)),
    próbaBónusz: {
      képzettség: Object.fromEntries(k.képzettségek.map(kp =>
        [képzettségNév(kp, data), fortélyPróbaBónuszok(k, data, ['képzettségpróba'], a => a === `képzettség:${képzKulcs(kp)}`)]).filter(([, b]) => (b as unknown[]).length)),
      tulajdonság: Object.fromEntries(Object.keys(k.tulajdonságok).map(t =>
        [t, fortélyPróbaBónuszok(k, data, ['tulajdonságpróba'], a => a === `tulajdonság:${t}`)]).filter(([, b]) => (b as unknown[]).length)),
    },
  };
}

/** A teszt karakter minden fortéllyal (az adott fok-indexen): széles lefedés a követelményekre és próba-bónuszokra. */
function mindenFortély(alap: Karakter, fokIndex: number): Karakter {
  const fortélyok = data.fortelySummaries.flatMap(fd => {
    const fokok = fd.fokok.map(f => f.fok).filter(f => f >= 1);
    const fok = fokok[Math.min(fokIndex, fokok.length - 1)];
    return fok ? [{ id: fd.id, fok, elem: '' }] : [];
  });
  return { ...alap, fortélyok } as Karakter;
}

describe('karakter számított értékei - id-átállás regressziós snapshot', () => {
  for (const f of ['test_karakter2.json', 'test_karakter3.json']) {
    it(f, () => expect(számított(karakterJson(f))).toMatchSnapshot());
  }
  for (const i of [0, 9]) {
    it(`minden fortély, fok-index ${i}`, () => {
      const { kp, követelményHiány, próbaBónusz } = számított(mindenFortély(karakterJson('test_karakter2.json'), i));
      expect({ kp, követelményHiány, próbaBónusz }).toMatchSnapshot();
    });
  }
});
