import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { hatásFeliratok } from '../formatters';
import { státuszDef, eseményDef } from '../../engine/lookup';
import { parseStátusz, hatásKitöltve } from '../../engine/statusz';

/** Aktív fül hatás-pool: a státusz-hatások a 081-es Hatás nevével (hatás_név), alkategóriával kitöltve. */
describe('hatás-pool feliratok (fmtHatás + hatás_név)', () => {
  const data = loadGameDataSync();
  const pool = (st: string) => {
    const p = parseStátusz(st)!;
    const def = státuszDef(data, p.id)!;
    return hatásFeliratok(def.fokok.find(f => f.fok === p.fok)!.hatások.map(h => hatásKitöltve(h, def, p.alkategória)),
      id => eseményDef(data, id)?.név ?? id, id => data.kepzettsegDefs.find(k => k.id === id)?.név);
  };

  it('nevesített Hatások a mód/cél felirat helyett', () => {
    expect(pool('blokkolt (1)')).toEqual(['Hátrány-1: TÉ dobás', 'Mozgás - feleződik']);
    expect(pool('fizikai (3)')).toContain('Fortély hatás letiltása: Harci akrobatika');
    expect(pool('fizikai (3)')).toContain('VÉ veszteség duplázódik');
  });

  it('összevont mechanika mellett mindkét Hatás látszik (Mozgás - képtelen + Harcképtelenség)', () => {
    expect(pool('félelem (3)')).toEqual(['Mozgás - képtelen', 'Harcképtelenség', 'Varázslás képesség elvesztése', 'Pszí használat elvesztése']);
  });

  it('a nem szöveges sor megjegyzése és alcélja is látszik', () => {
    expect(pool('hangulat (2)')).toEqual(['Előny+1: Képzettségpróba - kreatív tevékenységekre', 'Hátrány-1: Képzettségpróba - koncentrációt igénylő feladatokra']);
    expect(pool('eszmélet (1)')).toContain('Előny+1: Képzettségpróba (Fájdalomtűrés) - áfiumok, kábítószerek, fejbekólintás hatására');
    expect(pool('trauma (1)')).toEqual(['Hátrány-1: Tulajdonságpróba (Önuralom)', 'Hátrány-1: Tulajdonságpróba (Érzékenység)', 'Hátrány-1: Szociális képzettségpróba (Önuralom)', 'Hátrány-1: Szociális képzettségpróba (Érzékenység)']);
  });

  it('alkategóriás státusz: a címke a helyőrző helyén', () => {
    expect(pool('érzékvesztés: Látás (2)')[0]).toMatch(/^Érzék - Hátrány-2 \(Látás\) - /);
    expect(pool('átkozott_képzettség: lexikum (1)')).toEqual(['Hátrány-1: Képzettségpróba (Lexikum)']);
    expect(pool('áldott_tulajdonság: erő (1)')).toEqual(['Előny+1: Tulajdonságpróba (Erő) - feltétel esetén']);
  });
});
