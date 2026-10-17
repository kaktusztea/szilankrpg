import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH } from './statusz-proba';

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
});
