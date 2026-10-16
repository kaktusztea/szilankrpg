import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { calcStátuszPróbaEH } from './statusz-proba';

/** Alcél "képzettség:<név>" (§42.4): a státusz-hatás csak a megnevezett képzettség próbájára hat. */
describe('statusz-proba - alcél prefix-alak', () => {
  const data = loadGameDataSync();
  const eszmélet = data.statuszok.find(s => s.név === 'Eszmélet')!;
  const fok = eszmélet.fokok.find(f => f.hatások.some(h => h.alcél === 'képzettség:Fájdalomtűrés'))!.fok;
  const eh = (képzettség: string) => calcStátuszPróbaEH([`Eszmélet (${fok})`], data.statuszok, képzettség, '').források;

  it('a Fájdalomtűrés próbára hat, másra (pl. Lexikum) nem az alcélos sor', () => {
    expect(eh('Fájdalomtűrés').length).toBeGreaterThan(eh('Lexikum').length);
  });
});
