import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH, calcStátuszTulajdonságPróbaEH } from './statusz-proba';

/** Helyzetfüggő (`szituációs`) státusz-sorok: nem számítanak automatikusan, kapcsolható listában jönnek (engine_spec §22.4). */
describe('statusz-proba - szituációs sorok', () => {
  const data = loadGameDataSync();
  const kp = (st: string[], id: string, tul?: string) => {
    const d = data.kepzettsegDefs.find(x => x.id === id)!;
    return calcStátuszPróbaEH(st, data.statuszok, data.esemenyek, id, d.csoport, undefined, tul);
  };
  const tp = (st: string[], tul: string) => calcStátuszTulajdonságPróbaEH(st, data.statuszok, data.esemenyek, tul);

  it('Hangulat (2)/(3): nincs automatikus kioltás, a két sor kapcsolható', () => {
    expect(kp(['hangulat (2)'], 'lexikum').szint).toBe(0);
    expect(kp(['hangulat (2)'], 'lexikum').szituációs.map(s => s.érték)).toEqual([1, -1]);
    expect(kp(['hangulat (3)'], 'lexikum').szint).toBe(0);
    expect(kp(['hangulat (3)'], 'lexikum').szituációs.map(s => [s.érték, s.megjegyzés])).toEqual([
      [1, 'kreatív tevékenységekre'], [-2, 'koncentrációt igénylő feladatokra']]);
  });

  it('Eszmélet (1): a Hátrány-1 automatikus, a Fájdalomtűrés-Előny szituációs', () => {
    const r = kp(['eszmélet (1)'], 'fájdalomtűrés');
    expect(r.szint).toBe(-1);
    expect(r.szituációs.map(s => s.érték)).toEqual([1]);
    expect(kp(['eszmélet (1)'], 'lexikum').szituációs).toEqual([]);
  });

  it('Átkozott viselkedés (1) / Áldott Tulajdonság (1): szituációs, nem automatikus', () => {
    expect(kp(['átkozott_viselkedés (1)'], 'lexikum').szint).toBe(0);
    expect(kp(['átkozott_viselkedés (1)'], 'lexikum').szituációs).toHaveLength(1);
    expect(tp(['áldott_tulajdonság: erő (1)'], 'erő').szint).toBe(0);
    expect(tp(['áldott_tulajdonság: erő (1)'], 'erő').szituációs.map(s => s.érték)).toEqual([1]);
  });

  it('a kulcs stabil és forrásonként egyedi (kapcsoló-állapot)', () => {
    const k = kp(['hangulat (2)'], 'lexikum').szituációs.map(s => s.kulcs);
    expect(new Set(k).size).toBe(k.length);
    expect(kp(['hangulat (2)'], 'lexikum').szituációs.map(s => s.kulcs)).toEqual(k);
  });
});

/** Trauma: a szociális próba Hátránya csak Önuralommal / Érzékenységgel dobva (alcél tulajdonság:<X> szociális célon). */
describe('statusz-proba - Trauma szociális próba Tulajdonság szerint', () => {
  const data = loadGameDataSync();
  const kp = (st: string[], id: string, tul?: string) => {
    const d = data.kepzettsegDefs.find(x => x.id === id)!;
    return calcStátuszPróbaEH(st, data.statuszok, data.esemenyek, id, d.csoport, undefined, tul);
  };

  it('Befolyásolás Önuralommal / Érzékenységgel: Hátrány, más Tulajdonsággal vagy Tulajdonság nélkül nem', () => {
    expect(kp(['trauma (1)'], 'befolyásolás', 'önuralom').szint).toBe(-1);
    expect(kp(['trauma (2)'], 'befolyásolás', 'érzékenység').szint).toBe(-2);
    expect(kp(['trauma (1)'], 'befolyásolás', 'intelligencia').szint).toBe(0);
    expect(kp(['trauma (1)'], 'befolyásolás').szint).toBe(0);
  });

  it('nem-szociális képzettség Önuralommal: nem hat (a Tulajdonságpróba-sor sem)', () => {
    expect(kp(['trauma (1)'], 'lexikum', 'önuralom').szint).toBe(0);
  });
});
