/**
 * Regressziós háló a státusz → képzettségpróba Előny/Hátrány kalkulációra (calcStátuszPróbaEH):
 * minden státusz minden foka (alkategóriásnál alkategóriánként, a picker formátumában) × minden képzettség.
 * A snapshot a közös effekt-gyűjtőre váltás ELŐTT készült (2026-10-18); a váltás után csak a szándékolt
 * eltérés (alkategóriás Érzékvesztés az illő érzékre) változhat.
 */
import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH } from './statusz-proba';

const data = loadGameDataSync();

// A StatuszPickerOverlay formátuma: "Név (fok)" vagy "Név: Alkategória (fok)".
const bejegyzések = data.statuszok.flatMap(s => s.fokok.flatMap(f =>
  s.alkategóriák?.length ? s.alkategóriák.map(a => `${s.név}: ${a} (${f.fok})`) : [`${s.név} (${f.fok})`]));

describe('statusz-proba regressziós snapshot', () => {
  it('státusz × képzettség', () => {
    const ki: Record<string, unknown> = {};
    for (const st of bejegyzések) {
      for (const kd of data.kepzettsegDefs) {
        const r = calcStátuszPróbaEH([st], data.statuszok, kd.id, kd.csoport);
        if (r.szint || r.tiltott) ki[`${st} | ${kd.id}`] = r;
      }
    }
    expect(ki).toMatchSnapshot();
  });
});
