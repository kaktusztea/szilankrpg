import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH, próbaÉrzékek } from './statusz-proba';
import { státuszDef } from './lookup';

/** Alcél "képzettség:<id>" (§42.4, 2026-10-17 óta id): a státusz-hatás csak a megnevezett képzettség próbájára hat. */
describe('statusz-proba - alcél prefix-alak', () => {
  const data = loadGameDataSync();
  const eszmélet = státuszDef(data, 'Eszmélet')!;
  const fok = eszmélet.fokok.find(f => f.hatások.some(h => h.alcél === 'képzettség:fájdalomtűrés'))!.fok;
  const eh = (képzettség: string) => calcStátuszPróbaEH([`Eszmélet (${fok})`], data.statuszok, data.esemenyek, képzettség, '').források;

  it('a Fájdalomtűrés próbára hat, másra (pl. Lexikum) nem az alcélos sor', () => {
    expect(eh('fájdalomtűrés').length).toBeGreaterThan(eh('lexikum').length);
  });

  // A szociális próba-cél képzettség-ID szerint illeszt (2026-10-17: a paraméter kulcs, nem név); az érzék próba a dobás
  // Tulajdonsága szerint (md/010_11: Érzékenységgel dobott próba).
  it('Félelem (1) a szociális (Befolyásolás) próbára hat, Lexikumra nem; Érzékvesztés (1) az Érzékenységgel dobott próbára', () => {
    const forr = (st: string, kulcs: string, tul?: string) => calcStátuszPróbaEH([st], data.statuszok, data.esemenyek, kulcs, '', undefined, tul).források.length;
    expect(forr('Félelem (1)', 'befolyásolás')).toBeGreaterThan(forr('Félelem (1)', 'lexikum'));
    expect(forr('Érzékvesztés (1)', 'észlelés', 'érzékenység')).toBeGreaterThan(forr('Érzékvesztés (1)', 'észlelés', 'intelligencia'));
  });

  // Alkategóriás státusz (picker formátum "Név: Alkategória (fok)"): csak az illő érzékkel végzett próbára hat (2026-10-18).
  it('Érzékvesztés: Látás csak a látással, Érzékenységgel végzett próbára hat', () => {
    const r = (st: string, kulcs: string, érzék?: string, tul = 'érzékenység') => calcStátuszPróbaEH([st], data.statuszok, data.esemenyek, kulcs, 'világi', érzék, tul);
    expect(r('Érzékvesztés: Látás (2)', 'észlelés', 'Látás').szint).toBe(-2);
    expect(r('Érzékvesztés: Látás (2)', 'észlelés', 'Hallás').szint).toBe(0);
    expect(r('Érzékvesztés: Látás (2)', 'észlelés').szint).toBe(0);
    expect(r('Érzékvesztés: Látás (2)', 'észlelés', 'Látás', 'intelligencia').szint).toBe(0);
    expect(r('Érzékvesztés: Látás (2)', 'etikett', 'Látás').szint).toBe(-2); // md/082: minden Érzékenységgel dobott Képzettségpróba
    expect(r('Érzékvesztés: Látás (2)', 'etikett', 'Látás', 'intelligencia').szint).toBe(0);
    expect(r('Érzékvesztés: Látás (3)', 'észlelés', 'Látás').tiltott).toBe(true);
    expect(r('Érzékvesztés: Látás (1)', 'észlelés', 'Látás').források).toEqual(['Érzékvesztés: Látás (Zavart): -1']);
  });

  it('próbaÉrzékek: az érintett érzék + a státusz összes alkategóriája; nem érintett próbán üres', () => {
    const p = próbaÉrzékek(['Érzékvesztés: Hallás (1)', 'Félelem (1)'], data.statuszok, data.esemenyek, 'észlelés', 'világi', 'érzékenység');
    expect(p.érintett).toEqual(['Hallás']);
    expect(p.opciók).toContain('Látás');
    expect(próbaÉrzékek(['Érzékvesztés: Hallás (1)'], data.statuszok, data.esemenyek, 'észlelés', 'világi', 'intelligencia').érintett).toEqual([]);
    expect(próbaÉrzékek(['Érzékvesztés: Hallás (1)'], data.statuszok, data.esemenyek, null, '', 'érzékenység').érintett).toEqual(['Hallás']);
  });
});
