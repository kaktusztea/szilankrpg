import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH, próbaÉrzékek } from './statusz-proba';

/** Alcél "képzettség:<id>" (§42.4, 2026-10-17 óta id): a státusz-hatás csak a megnevezett képzettség próbájára hat. */
describe('statusz-proba - alcél prefix-alak', () => {
  const data = loadGameDataSync();
  const eszmélet = data.statuszok.find(s => s.név === 'Eszmélet')!;
  const fok = eszmélet.fokok.find(f => f.hatások.some(h => h.alcél === 'képzettség:fájdalomtűrés'))!.fok;
  const eh = (képzettség: string) => calcStátuszPróbaEH([`Eszmélet (${fok})`], data.statuszok, képzettség, '').források;

  it('a Fájdalomtűrés próbára hat, másra (pl. Lexikum) nem az alcélos sor', () => {
    expect(eh('fájdalomtűrés').length).toBeGreaterThan(eh('lexikum').length);
  });

  // A szociális / érzék próba-célok képzettség-ID szerint illesztenek (2026-10-17: a paraméter kulcs, nem név).
  it('Félelem (1) a szociális (Befolyásolás) próbára hat, Lexikumra nem; Érzékvesztés (1) az Észlelésre', () => {
    const forr = (st: string, kulcs: string) => calcStátuszPróbaEH([st], data.statuszok, kulcs, '').források.length;
    expect(forr('Félelem (1)', 'befolyásolás')).toBeGreaterThan(forr('Félelem (1)', 'lexikum'));
    expect(forr('Érzékvesztés (1)', 'észlelés')).toBeGreaterThan(forr('Érzékvesztés (1)', 'lexikum'));
  });

  // Alkategóriás státusz (picker formátum "Név: Alkategória (fok)"): csak az illő érzékkel végzett próbára hat (2026-10-18).
  it('Érzékvesztés: Látás csak a látással végzett Észlelés próbára hat', () => {
    const r = (st: string, kulcs: string, érzék?: string) => calcStátuszPróbaEH([st], data.statuszok, kulcs, 'világi', érzék);
    expect(r('Érzékvesztés: Látás (2)', 'észlelés', 'Látás').szint).toBe(-2);
    expect(r('Érzékvesztés: Látás (2)', 'észlelés', 'Hallás').szint).toBe(0);
    expect(r('Érzékvesztés: Látás (2)', 'észlelés').szint).toBe(0);
    expect(r('Érzékvesztés: Látás (2)', 'etikett', 'Látás').szint).toBe(0);
    expect(r('Érzékvesztés: Látás (3)', 'észlelés', 'Látás').tiltott).toBe(true);
    expect(r('Érzékvesztés: Látás (1)', 'észlelés', 'Látás').források).toEqual(['Érzékvesztés: Látás (Zavart): -1']);
  });

  it('próbaÉrzékek: az érintett érzék + a státusz összes alkategóriája; nem érintett próbán üres', () => {
    const p = próbaÉrzékek(['Érzékvesztés: Hallás (1)', 'Félelem (1)'], data.statuszok, 'észlelés', 'világi');
    expect(p.érintett).toEqual(['Hallás']);
    expect(p.opciók).toContain('Látás');
    expect(próbaÉrzékek(['Érzékvesztés: Hallás (1)'], data.statuszok, 'etikett', 'világi').érintett).toEqual([]);
  });
});
