import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH, calcStátuszTulajdonságPróbaEH, próbaÉrzékek } from './statusz-proba';

/** Próba-kategóriák (md/010_11): a fizikai / szellemi / érzék próba a dobás Tulajdonságán múlik, Tulajdonságpróbán is. */
describe('statusz-proba - Tulajdonság-alapú próba-kategóriák', () => {
  const data = loadGameDataSync();
  const kp = (st: string[], id: string, tul?: string, érzék?: string) => {
    const d = data.kepzettsegDefs.find(x => x.id === id)!;
    return calcStátuszPróbaEH(st, data.statuszok, data.esemenyek, id, d.csoport, érzék, tul);
  };
  const tp = (st: string[], tul: string, érzék?: string) => calcStátuszTulajdonságPróbaEH(st, data.statuszok, data.esemenyek, tul, érzék);

  it('Rosszullét (1) fizikai_próba: Ügyességgel dobott Lexikumra is hat, Intelligenciával dobott Akrobatikára nem', () => {
    expect(kp(['rosszullét (1)'], 'lexikum', 'ügyesség').szint).toBe(-1);
    expect(kp(['rosszullét (1)'], 'akrobatika', 'intelligencia').szint).toBe(0);
    expect(kp(['rosszullét (1)'], 'akrobatika').szint).toBe(0); // még nincs Tulajdonság választva
  });

  it('Fizikai (1) szellemi_próba: Intelligenciával dobott Képzettségpróbára és Tulajdonságpróbára, Erőre nem', () => {
    expect(kp(['fizikai (1)'], 'akrobatika', 'intelligencia').szint).toBe(-1);
    expect(tp(['fizikai (1)'], 'emlékezet').szint).toBe(-1);
    expect(tp(['fizikai (1)'], 'erő').szint).toBe(0);
  });

  it('Tulajdonságpróba: a képzettségpróba-célú hatás nem, a tulajdonságpróba-célú igen', () => {
    expect(tp(['sérült (2)'], 'erő').szint).toBe(-2);
    expect(tp(['sérült (3)'], 'erő').tiltott).toBe(true);
    expect(tp(['félelem (1)'], 'önuralom').szint).toBe(0); // szociális képzettségpróba - Tulajdonságpróbán nem
    expect(tp(['fizikai (3)'], 'gyorsaság').szint).toBe(0); // nem_harci_próba - Tulajdonságpróbán nem
  });

  it('alcél tulajdonság:<kulcs>: Trauma / Zavar / Késztetés csak a megnevezett Tulajdonságra', () => {
    expect(tp(['trauma (1)'], 'önuralom').szint).toBe(-1);
    expect(tp(['trauma (1)'], 'erő').szint).toBe(0);
    expect(tp(['zavar (1)'], 'gyorsaság').szint).toBe(-1);
    expect(tp(['zavar (1)'], 'ügyesség').szint).toBe(-1);
    expect(tp(['zavar (1)'], 'erő').szint).toBe(0);
    expect(tp(['késztetés (3)'], 'önuralom').szint).toBe(-2);
    expect(tp(['késztetés (3)'], 'intelligencia').szint).toBe(0);
    // A tulajdonság-alcél Képzettségpróbán nem hat (az Önuralommal dobott képzettség nem Önuralom Tulajdonságpróba)
    expect(kp(['trauma (1)'], 'lexikum', 'önuralom').szint).toBe(0);
  });

  it('Érzékvesztés: az Érzékenység Tulajdonságpróbán a választott érzékre hat', () => {
    expect(tp(['érzékvesztés: Látás (2)'], 'érzékenység', 'Látás').szint).toBe(-2);
    expect(tp(['érzékvesztés: Látás (2)'], 'érzékenység', 'Hallás').szint).toBe(0);
    expect(tp(['érzékvesztés: Látás (2)'], 'intelligencia', 'Látás').szint).toBe(0);
    expect(tp(['érzékvesztés: Látás (3)'], 'érzékenység', 'Látás').tiltott).toBe(true);
  });

  it('Szellemi (1) Kialvatlanság: csak az Észlelés képzettségpróbára (alcél képzettség:észlelés)', () => {
    expect(kp(['szellemi (1)'], 'észlelés', 'érzékenység').szint).toBe(-1);
    expect(kp(['szellemi (1)'], 'emberismeret', 'érzékenység').szint).toBe(0);
    expect(tp(['szellemi (1)'], 'érzékenység').szint).toBe(0);
  });

  it('Áldott / Átkozott Tulajdonság: szöveges, amíg a Tulajdonság nem választható', () => {
    expect(tp(['áldott_tulajdonság (2)'], 'erő').szint).toBe(0);
    expect(tp(['átkozott_tulajdonság (2)'], 'erő').szint).toBe(0);
  });
});

/** Az érzék_hátrány / érzék_kioltott `érzék` paramétere: alcél "érzék:<X>" - a választott érzékre szűkít, mint az alkategória. */
describe('statusz-proba - alcél érzék:<X>', () => {
  const data = loadGameDataSync();
  const defs = [...data.statuszok, {
    id: 'teszt_vakítás', név: 'Teszt vakítás', kategória: 'fizikai', többszörös: false, alkategóriák: [],
    fokok: [{ fok: 1, alcím: 'Vakított', hatások: [{ mód: 'hátrány', érték: -1, cél: 'érzék_próba', alcél: 'érzék:Látás' }] }],
  }] as typeof data.statuszok;
  const tp = (érzék?: string) => calcStátuszTulajdonságPróbaEH(['teszt_vakítás (1)'], defs, data.esemenyek, 'érzékenység', érzék);

  it('csak a megnevezett érzékkel végzett Érzékenység-próbára hat', () => {
    expect(tp('Látás').szint).toBe(-1);
    expect(tp('Hallás').szint).toBe(0);
    expect(tp().szint).toBe(0);
    expect(calcStátuszTulajdonságPróbaEH(['teszt_vakítás (1)'], defs, data.esemenyek, 'intelligencia', 'Látás').szint).toBe(0);
  });

  it('próbaÉrzékek: az alcél érzéke érintett és választható', () => {
    const p = próbaÉrzékek(['teszt_vakítás (1)'], defs, data.esemenyek, null, '', 'érzékenység');
    expect(p.érintett).toEqual(['Látás']);
    expect(p.opciók).toContain('Látás');
  });
});
