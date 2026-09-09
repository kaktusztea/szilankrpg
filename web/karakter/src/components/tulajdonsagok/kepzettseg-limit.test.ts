import { describe, it, expect } from 'vitest';
import { képzettségLimitek } from './kepzettseg-limit';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

// Valódi rules.json + konstansok.json — így a teszt a szabály LÉTÉT és a bekötést is védi.
const data = loadGameDataSync();
const plafon = data.konstansok.arányok.képzettség_max_szint;
const ráhagyás = data.konstansok.arányok.képzettség_nemprimer_max_szint_plusz;

describe('képzettségLimitek', () => {
  it('primer = TSz, szekunder = TSz + ráhagyás (plafon alatt)', () => {
    expect(képzettségLimitek(data, 8)).toEqual({ primer: 8, szekunder: 8 + ráhagyás });
  });

  it('a plafont sem primer, sem szekunder nem lépheti túl', () => {
    // Regresszió: a UI korábban `tsz + 3`-at számolt plafon nélkül → 14. TSz-en 17-et engedett
    expect(képzettségLimitek(data, plafon - 1).szekunder).toBe(plafon);
    expect(képzettségLimitek(data, data.konstansok.arányok.max_tsz)).toEqual({ primer: plafon, szekunder: plafon });
  });
});
