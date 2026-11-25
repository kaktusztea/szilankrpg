import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH, calcStátuszTulajdonságPróbaEH } from './statusz-proba';

/** Próba-kategóriák (md/010_11): a fizikai / szellemi / érzék próba a dobás Tulajdonságán múlik, Tulajdonságpróbán is. */
describe('statusz-proba - Tulajdonság-alapú próba-kategóriák', () => {
  const data = loadGameDataSync();
  const kp = (st: string[], id: string, tul?: string, érzék?: string) => {
    const d = data.kepzettsegDefs.find(x => x.id === id)!;
    return calcStátuszPróbaEH(st, data.statuszok, data.esemenyek, id, d.csoport, érzék, tul);
  };
  const tp = (st: string[], tul: string, érzék?: string) => calcStátuszTulajdonságPróbaEH(st, data.statuszok, data.esemenyek, tul, érzék);

  it('Rosszullét (1) fizikai_próba: Ügyességgel dobott Lexikumra is hat, Intelligenciával dobott Akrobatikára nem', () => {
    expect(kp(['Rosszullét (1)'], 'lexikum', 'ügyesség').szint).toBe(-1);
    expect(kp(['Rosszullét (1)'], 'akrobatika', 'intelligencia').szint).toBe(0);
    expect(kp(['Rosszullét (1)'], 'akrobatika').szint).toBe(0); // még nincs Tulajdonság választva
  });

  it('Fizikai (1) szellemi_próba: Intelligenciával dobott Képzettségpróbára és Tulajdonságpróbára, Erőre nem', () => {
    expect(kp(['Fizikai (1)'], 'akrobatika', 'intelligencia').szint).toBe(-1);
    expect(tp(['Fizikai (1)'], 'emlékezet').szint).toBe(-1);
    expect(tp(['Fizikai (1)'], 'erő').szint).toBe(0);
  });

  it('Tulajdonságpróba: a képzettségpróba-célú hatás nem, a tulajdonságpróba-célú igen', () => {
    expect(tp(['Sérült (2)'], 'erő').szint).toBe(-2);
    expect(tp(['Sérült (3)'], 'erő').tiltott).toBe(true);
    expect(tp(['Félelem (1)'], 'önuralom').szint).toBe(0); // szociális képzettségpróba - Tulajdonságpróbán nem
    expect(tp(['Fizikai (3)'], 'gyorsaság').szint).toBe(0); // nem_harci_próba - Tulajdonságpróbán nem
  });

  it('alcél tulajdonság:<kulcs>: Trauma / Zavar / Késztetés csak a megnevezett Tulajdonságra', () => {
    expect(tp(['Trauma (1)'], 'önuralom').szint).toBe(-1);
    expect(tp(['Trauma (1)'], 'erő').szint).toBe(0);
    expect(tp(['Zavar (1)'], 'gyorsaság').szint).toBe(-1);
    expect(tp(['Zavar (1)'], 'ügyesség').szint).toBe(-1);
    expect(tp(['Zavar (1)'], 'erő').szint).toBe(0);
    expect(tp(['Késztetés (3)'], 'önuralom').szint).toBe(-2);
    expect(tp(['Késztetés (3)'], 'intelligencia').szint).toBe(0);
    // A tulajdonság-alcél Képzettségpróbán nem hat (az Önuralommal dobott képzettség nem Önuralom Tulajdonságpróba)
    expect(kp(['Trauma (1)'], 'lexikum', 'önuralom').szint).toBe(0);
  });

  it('Érzékvesztés: az Érzékenység Tulajdonságpróbán a választott érzékre hat', () => {
    expect(tp(['Érzékvesztés: Látás (2)'], 'érzékenység', 'Látás').szint).toBe(-2);
    expect(tp(['Érzékvesztés: Látás (2)'], 'érzékenység', 'Hallás').szint).toBe(0);
    expect(tp(['Érzékvesztés: Látás (2)'], 'intelligencia', 'Látás').szint).toBe(0);
    expect(tp(['Érzékvesztés: Látás (3)'], 'érzékenység', 'Látás').tiltott).toBe(true);
  });

  it('Szellemi (1) Kialvatlanság: csak az Észlelés képzettségpróbára (alcél képzettség:észlelés)', () => {
    expect(kp(['Szellemi (1)'], 'észlelés', 'érzékenység').szint).toBe(-1);
    expect(kp(['Szellemi (1)'], 'emberismeret', 'érzékenység').szint).toBe(0);
    expect(tp(['Szellemi (1)'], 'érzékenység').szint).toBe(0);
  });

  it('Áldott / Átkozott Tulajdonság: szöveges, amíg a Tulajdonság nem választható', () => {
    expect(tp(['Áldott Tulajdonság (2)'], 'erő').szint).toBe(0);
    expect(tp(['Átkozott Tulajdonság (2)'], 'erő').szint).toBe(0);
  });
});
