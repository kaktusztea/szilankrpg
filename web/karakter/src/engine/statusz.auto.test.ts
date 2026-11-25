import { describe, it, expect } from 'vitest';
import { autoStátuszLépés, autoStátuszSession } from './statusz';
import type { Session } from './types';

/** Automatikus státusz-forrás (Akadály → fizikai, ÉP → sérült): md/082 - egy fok aktív, a magasabb érvényes. */
describe('autoStátuszLépés', () => {
  it('kézi Fizikai (2) + Akadály (1): a kézi marad, az Akadály megszűnésekor is', () => {
    const be = autoStátuszLépés(['fizikai (2)', 'hangulat (1)'], 'fizikai', 1, undefined);
    expect(be.aktív).toEqual(['fizikai (2)', 'hangulat (1)']);
    expect(be.rekord).toEqual({ fok: 2, alatta: 2 });
    const ki = autoStátuszLépés(be.aktív, 'fizikai', 0, be.rekord);
    expect(ki.aktív).toEqual(['fizikai (2)', 'hangulat (1)']);
    expect(ki.rekord).toBeUndefined();
  });

  it('kézi Fizikai (1) + Akadály (2): 2, az Akadály megszűnésekor vissza 1-re', () => {
    const be = autoStátuszLépés(['fizikai (1)'], 'fizikai', 2, undefined);
    expect(be.aktív).toEqual(['fizikai (2)']);
    expect(autoStátuszLépés(be.aktív, 'fizikai', 0, be.rekord).aktív).toEqual(['fizikai (1)']);
  });

  it('nincs kézi: az Akadály adja, megszűnésekor lekerül', () => {
    const be = autoStátuszLépés([], 'fizikai', 1, undefined);
    expect(be.aktív).toEqual(['fizikai (1)']);
    const fel = autoStátuszLépés(be.aktív, 'fizikai', 2, be.rekord);
    expect(fel.aktív).toEqual(['fizikai (2)']);
    expect(autoStátuszLépés(fel.aktív, 'fizikai', 0, fel.rekord).aktív).toEqual([]);
  });

  it('kézi módosítás közben: az lesz az új alap (felemelés megmarad, levétel is)', () => {
    const be = autoStátuszLépés([], 'sérült', 1, undefined);
    // a KM kézzel Sérült (3)-ra emeli → a seb gyógyul (0): a 3 marad
    expect(autoStátuszLépés(['sérült (3)'], 'sérült', 0, be.rekord).aktív).toEqual(['sérült (3)']);
    // kézzel levéve → a forrás megszűnésekor sem jön vissza
    expect(autoStátuszLépés([], 'sérült', 0, be.rekord).aktív).toEqual([]);
  });

  it('változatlan állapot: ugyanaz a tömb; alkategóriás azonos id nem zavar', () => {
    const a = ['fizikai (1)'];
    expect(autoStátuszLépés(a, 'fizikai', 1, { fok: 1, alatta: 0 }).aktív).toBe(a);
  });
});

describe('autoStátuszSession', () => {
  const s = (aktív_státuszok: string[], auto_státuszok?: Session['auto_státuszok']) => ({ aktív_státuszok, auto_státuszok }) as Session;

  it('nincs változás → ugyanaz a session (nincs felesleges render)', () => {
    const prev = s(['fizikai (1)'], { fizikai: { fok: 1, alatta: 0 } });
    expect(autoStátuszSession(prev, 'fizikai', 1)).toBe(prev);
    const üres = s([]);
    expect(autoStátuszSession(üres, 'sérült', 0)).toBe(üres);
  });

  it('a nyilvántartás státuszonként külön, a forrás megszűnésekor törlődik', () => {
    let x = autoStátuszSession(s([]), 'fizikai', 1);
    x = autoStátuszSession(x, 'sérült', 2);
    expect(x.aktív_státuszok).toEqual(['fizikai (1)', 'sérült (2)']);
    expect(x.auto_státuszok).toEqual({ fizikai: { fok: 1, alatta: 0 }, sérült: { fok: 2, alatta: 0 } });
    x = autoStátuszSession(x, 'fizikai', 0);
    expect(x.aktív_státuszok).toEqual(['sérült (2)']);
    expect(x.auto_státuszok).toEqual({ sérült: { fok: 2, alatta: 0 } });
  });
});
