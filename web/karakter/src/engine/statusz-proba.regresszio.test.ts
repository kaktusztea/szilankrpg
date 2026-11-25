/**
 * Regressziós háló a státusz → képzettségpróba Előny/Hátrány kalkulációra (calcStátuszPróbaEH):
 * minden státusz minden foka (alkategóriásnál alkategóriánként, a picker formátumában) × minden képzettség.
 * A snapshot a közös effekt-gyűjtőre váltás ELŐTT készült (2026-10-18); a váltás után csak a szándékolt
 * eltérés (alkategóriás Érzékvesztés az illő érzékre) változhat.
 */
import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH, calcStátuszTulajdonságPróbaEH } from './statusz-proba';

const data = loadGameDataSync();

// A StatuszPickerOverlay formátuma: "Név (fok)" vagy "Név: Alkategória (fok)".
// [snapshot-kulcs (megjelenítési név), session-bejegyzés (id, engine/statusz.ts), alkategória]
const bejegyzések: [string, string, string | undefined][] = data.statuszok.flatMap(s => s.fokok.flatMap(f =>
  s.alkategóriák?.length
    ? s.alkategóriák.map(a => [`${s.név}: ${a} (${f.fok})`, `${s.id}: ${a} (${f.fok})`, a] as [string, string, string])
    : [[`${s.név} (${f.fok})`, `${s.id} (${f.fok})`, undefined] as [string, string, undefined]]));

const tulajdonságok = data.konstansok.tulajdonság_sorrend;
// A Tulajdonság-függő próba-kategóriákhoz (md/010_11) csoportonként egy-egy képzettség elég.
const mintaKépzettségek = ['akrobatika', 'harcmodor', 'befolyásolás', 'észlelés', 'lopás', 'lexikum', 'előadóművészet', 'arkánum_asztrálmágia'];

describe('statusz-proba regressziós snapshot', () => {
  it('státusz × képzettség (Tulajdonság nélkül)', () => {
    const ki: Record<string, unknown> = {};
    for (const [st, kulcs] of bejegyzések) {
      for (const kd of data.kepzettsegDefs) {
        const r = calcStátuszPróbaEH([kulcs], data.statuszok, data.esemenyek, kd.id, kd.csoport);
        if (r.szint || r.tiltott) ki[`${st} | ${kd.id}`] = r;
      }
    }
    expect(ki).toMatchSnapshot();
  });

  it('státusz × minta-képzettség × Tulajdonság', () => {
    const ki: Record<string, unknown> = {};
    for (const [st, kulcs, alk] of bejegyzések) {
      for (const id of mintaKépzettségek) {
        const kd = data.kepzettsegDefs.find(d => d.id === id)!;
        for (const t of tulajdonságok) {
          const r = calcStátuszPróbaEH([kulcs], data.statuszok, data.esemenyek, kd.id, kd.csoport, alk, t);
          if (r.szint || r.tiltott) ki[`${st} | ${kd.id} | ${t}`] = r;
        }
      }
    }
    expect(ki).toMatchSnapshot();
  });

  it('státusz × Tulajdonságpróba', () => {
    const ki: Record<string, unknown> = {};
    for (const [st, kulcs, alk] of bejegyzések) {
      for (const t of tulajdonságok) {
        const r = calcStátuszTulajdonságPróbaEH([kulcs], data.statuszok, data.esemenyek, t, alk);
        if (r.szint || r.tiltott) ki[`${st} | ${t}`] = r;
      }
    }
    expect(ki).toMatchSnapshot();
  });
});
