import { describe, it, expect } from 'vitest';
import {
  előnyHátrányLabel, ELŐNY_HÁTRÁNY_SZINTEK, probaLehetetlen, probaBiztosSiker, probaSiker,
  eredményFelirat, összetettCélszámok, összetettEredmény, összetettKéziFelirat, képzetlenCélszám,
} from './proba-common';
import { EH_SZINT_MAX } from '../../engine/dice';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

describe('előnyHátrányLabel', () => {
  it('címkék', () => {
    expect(előnyHátrányLabel(1)).toBe('Előny+1');
    expect(előnyHátrányLabel(2)).toBe('Előny+2');
    expect(előnyHátrányLabel(-2)).toBe('Hátrány-2');
    expect(előnyHátrányLabel(0)).toBe('');
  });
});

describe('ELŐNY_HÁTRÁNY_SZINTEK', () => {
  it('-2..+2, a 0 semleges jellel', () => {
    expect(ELŐNY_HÁTRÁNY_SZINTEK.map(e => e.szint)).toEqual([-2, -1, 0, 1, 2]);
    expect(ELŐNY_HÁTRÁNY_SZINTEK.map(e => e.label)).toEqual(['Hátrány-2', 'Hátrány-1', '-', 'Előny+1', 'Előny+2']);
  });
});

describe('probaLehetetlen / probaBiztosSiker', () => {
  it('k10: a bázis + 10 sem éri el a célszámot → lehetetlen', () => {
    expect(probaLehetetlen(5, 10, 16)).toBe(true);
    expect(probaLehetetlen(5, 10, 15)).toBe(false);
  });
  it('k6: a bázis + 6 sem éri el a célszámot → lehetetlen', () => {
    expect(probaLehetetlen(3, 6, 10)).toBe(true);
    expect(probaLehetetlen(3, 6, 9)).toBe(false);
  });
  it('biztos siker, ha a bázis + 1 is elég', () => {
    expect(probaBiztosSiker(9, 10)).toBe(true);
    expect(probaBiztosSiker(9, 11)).toBe(false);
  });
});

describe('eredményFelirat (kiemelt különbség a konstansokból)', () => {
  const { tulajdonság: t, képzettség: k } = loadGameDataSync().konstansok.próba;
  it('Tulajdonságpróba: 3-as eltérés kiemelt', () => {
    expect(eredményFelirat(8, 5, t.kiemelt_különbség)).toBe('⚜️ Kiemelt siker');
    expect(eredményFelirat(7, 5, t.kiemelt_különbség)).toBe('Siker');
    expect(eredményFelirat(2, 5, t.kiemelt_különbség)).toBe('⚜️ Kiemelt kudarc');
    expect(eredményFelirat(4, 5, t.kiemelt_különbség)).toBe('Sikertelen');
  });
  it('Képzettségpróba: 6-os eltérés kiemelt', () => {
    expect(eredményFelirat(18, 12, k.kiemelt_különbség)).toBe('⚜️ Kiemelt siker');
    expect(eredményFelirat(17, 12, k.kiemelt_különbség)).toBe('Siker');
  });
  it('probaSiker: határeset', () => {
    expect(probaSiker(9, 3, 12)).toBe(true);
    expect(probaSiker(9, 2, 12)).toBe(false);
  });
});

describe('összetett próba', () => {
  const d = (v: number) => ({ rolls: [v], eredmény: v });
  it('minden sornak sikerülnie kell; a másodlagos célszám a levonással könnyebb', () => {
    const célok = összetettCélszámok(5, 2, 1);
    expect(célok.map(c => c.célszám)).toEqual([5, 4, 4]);
    expect(összetettEredmény(2, [d(3), d(2), d(2)], célok).összSiker).toBe(true);
    const e = összetettEredmény(2, [d(3), d(1), d(2)], célok);
    expect(e.összSiker).toBe(false);
    expect(e.sorok.map(s => s.siker)).toEqual([true, false, true]);
  });
  it('kézi dobás felirata lépésenként', () => {
    expect(összetettKéziFelirat(2, 0)).toBe('Elsődleges');
    expect(összetettKéziFelirat(2, 1)).toBe('Másodlagos 1/2');
    expect(összetettKéziFelirat(2, 3)).toBeNull();
    expect(összetettKéziFelirat(0, 0)).toBeNull();
  });
});

describe('E/H skála ↔ konstansok.yaml', () => {
  it('a dice EH_SZINT_MAX egyezik a próba.előny_hátrány_max-szal', () => {
    expect(EH_SZINT_MAX).toBe(loadGameDataSync().konstansok.próba.előny_hátrány_max);
  });
});

describe('képzetlenCélszám', () => {
  it('nem-fizikai képzettség képzetlenül → +büntetés', () => {
    expect(képzetlenCélszám(9, true, false, 3)).toBe(12);
    expect(képzetlenCélszám(15, true, false, 3)).toBe(18);
  });
  it('fizikai képzettség képzetlenül → nincs büntetés', () => {
    expect(képzetlenCélszám(9, true, true, 3)).toBe(9);
  });
  it('nem képzetlen (felvett) → változatlan célszám', () => {
    expect(képzetlenCélszám(9, false, false, 3)).toBe(9);
  });
  it('rejtett (-1) / ellenpróba (null) célszámot nem érinti', () => {
    expect(képzetlenCélszám(-1, true, false, 3)).toBe(-1);
    expect(képzetlenCélszám(null, true, false, 3)).toBeNull();
  });
});
