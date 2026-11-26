import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { parseStátusz, státuszKulcs, státuszCímke, választhatóAlkategóriák, státuszFelvehető, aktívStátuszIdk, alcímCsakFok } from './statusz';
import { gyűjtStátuszEffektek } from './effekt';
import { calcStátuszPróbaEH, calcStátuszTulajdonságPróbaEH } from './statusz-proba';
import { státuszDef } from './lookup';

/** Felvett státusz: `"<id> (fok)"` / `"<id>: <alkategória> (fok)"`; a `{alkategória}` helyőrzőt a gyűjtő tölti ki. */
describe('engine/statusz - id + alkategória', () => {
  const data = loadGameDataSync();
  const def = (id: string) => státuszDef(data, id)!;

  it('parse / kulcs oda-vissza; érvénytelen formátum → null', () => {
    expect(parseStátusz('érzékvesztés: Látás (2)')).toEqual({ id: 'érzékvesztés', alkategória: 'Látás', fok: 2 });
    expect(parseStátusz('fizikai (3)')).toEqual({ id: 'fizikai', fok: 3 });
    expect(parseStátusz('Fizikai')).toBeNull();
    expect(státuszKulcs({ id: 'átkozott_képzettség', alkategória: 'lexikum', fok: 1 })).toBe('átkozott_képzettség: lexikum (1)');
    expect([...aktívStátuszIdk(['fizikai (1)', 'érzékvesztés: Látás (2)', 'rossz'])]).toEqual(['fizikai', 'érzékvesztés']);
  });

  it('szabad szöveg (Szakrális bélyeg): alkategóriaként oda-vissza, csak a megjegyzésben jelenik meg; „N. fok" alcím nem ismétlődik', () => {
    const p = { id: 'áldott_szakrális_bélyeg', alkategória: 'Domvik: érintés (2)', fok: 1 };
    expect(parseStátusz(státuszKulcs(p))).toEqual(p);
    expect(def('áldott_szakrális_bélyeg').szabad_szöveg).toBe(30);
    expect(státuszCímke(def('áldott_szakrális_bélyeg'), p)).toBe('Áldott Szakrális bélyeg (1)');   // the text is shown in the megjegyzés only
    expect(státuszFelvehető(def('áldott_szakrális_bélyeg'), [státuszKulcs(p)])).toBe(false);
    const sorok = gyűjtStátuszEffektek({ aktív_státuszok: [státuszKulcs({ ...p, alkategória: 'Domvik érintése' })] }, data);
    expect(sorok.map(s => s.megjegyzés)).toContain('Aurádon egy szakrális bélyeg tündököl: Domvik érintése');
    expect(alcímCsakFok({ fok: 1, alcím: '1. fok' })).toBe(true);
    expect(alcímCsakFok({ fok: 1, alcím: 'Bódultság' })).toBe(false);
  });

  it('címke: a név + az alkategória megjelenítési neve', () => {
    expect(státuszCímke(def('átkozott_képzettség'), { id: 'átkozott_képzettség', alkategória: 'lexikum', fok: 1 })).toBe('Átkozott Képzettség: Lexikum (1)');
    expect(státuszCímke(def('áldott_tulajdonság'), { id: 'áldott_tulajdonság', alkategória: 'erő', fok: 2 })).toBe('Áldott Tulajdonság: Erő (2)');
    expect(státuszCímke(def('érzékvesztés'), { id: 'érzékvesztés', alkategória: 'Ízlelés', fok: 1 })).toBe('Érzékvesztés: Ízlelés (1)');
  });

  it('választó: a felvett alkategória nem kínálható újra; nem-alkategóriás nem többszörös csak egyszer', () => {
    const é = def('érzékvesztés');
    expect(választhatóAlkategóriák(é, ['érzékvesztés: Látás (1)'])).toEqual(['Hallás', 'Szaglás', 'Tapintás', 'Ízlelés']);
    expect(státuszFelvehető(é, é.alkategóriák!.map(a => `érzékvesztés: ${a} (1)`))).toBe(false);
    expect(státuszFelvehető(def('fizikai'), ['fizikai (1)'])).toBe(false);
    expect(státuszFelvehető(def('fizikai'), [])).toBe(true);
    expect(def('áldott_tulajdonság').alkategóriák).toEqual(data.konstansok.tulajdonság_sorrend);
  });

  it('gyűjtő: a {alkategória} helyőrző kitöltve, a forrás neve a címke', () => {
    const [e] = gyűjtStátuszEffektek({ aktív_státuszok: ['átkozott_képzettség: lexikum (2)'] }, data);
    expect([e.alcél, e.érték, e.forrás.név, e.forrás.id]).toEqual(['képzettség:lexikum', -2, 'Átkozott Képzettség: Lexikum (2)', 'átkozott_képzettség']);
  });

  it('Áldott / Átkozott Tulajdonság csak a választott Tulajdonságra; Átkozott Képzettség csak a választott képzettségre', () => {
    const tp = (st: string, t: string) => calcStátuszTulajdonságPróbaEH([st], data.statuszok, data.esemenyek, t).szint;
    // Áldott / Átkozott Tulajdonság: "feltétel esetén" (md/082) - szituációs (kapcsolható) sor, nem automatikus szint
    const szit = (st: string, t: string) => calcStátuszTulajdonságPróbaEH([st], data.statuszok, data.esemenyek, t).szituációs.map(x => x.érték);
    expect([szit('áldott_tulajdonság: erő (2)', 'erő'), szit('áldott_tulajdonság: erő (2)', 'ügyesség')]).toEqual([[2], []]);
    expect([szit('átkozott_tulajdonság: önuralom (1)', 'önuralom'), szit('átkozott_tulajdonság: önuralom (1)', 'erő')]).toEqual([[-1], []]);
    expect(tp('átkozott_tulajdonság: önuralom (1)', 'önuralom')).toBe(0);
    const kp = (st: string, k: string, cs = '') => calcStátuszPróbaEH([st], data.statuszok, data.esemenyek, k, cs).szint;
    expect([kp('átkozott_képzettség: lexikum (1)', 'lexikum'), kp('átkozott_képzettség: lexikum (1)', 'etikett')]).toEqual([-1, 0]);
    // képzettség-id a specializációra is hat
    expect(kp('áldott_képzettség: harcmodor (1)', 'harcmodor/kardvívás', 'harci')).toBe(1);
  });

  it('Érzékvesztés: Tapintás / Ízlelés is érvényes alkategória', () => {
    const r = calcStátuszTulajdonságPróbaEH(['érzékvesztés: Ízlelés (2)'], data.statuszok, data.esemenyek, 'érzékenység', 'Ízlelés');
    expect([r.szint, r.források]).toEqual([-2, ['Érzékvesztés: Ízlelés (Részleges): -2']]);
  });
});
