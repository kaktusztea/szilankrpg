import { describe, it, expect } from 'vitest';
import { calcVéCsökkentés, calcTaktikaVéCsökkentésBázis, calcTaktikaVéCsökkentés, calcVéCsökkentésSzorzó, támadódobástTiltóTaktika, fortélyVéCsökkentésBővítések } from './ve-csokkentes-calc';
import type { Session, Karakter } from '../types';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { validKarakter } from '../../__tests__/karakter-fixture';

const alapTáblázat = { fegyverhátrány: 0, fegyverazonosság: 1, fegyverelőny: 2 };

describe('calcVéCsökkentés', () => {
  it('fegyverhátrány + páratlan k20 → bázis 0 + k20P 0', () => {
    const r = calcVéCsökkentés('fegyverhátrány', 5, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverhátrány', bázis: 0, k20: 5, k20p: 0, szorzó: 1, flat: 0, végső: 0 });
  });

  it('fegyverazonosság + páros k20 → bázis 1 + k20P 1', () => {
    const r = calcVéCsökkentés('fegyverazonosság', 16, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverazonosság', bázis: 1, k20: 16, k20p: 1, szorzó: 1, flat: 0, végső: 2 });
  });

  it('fegyverelőny + k20=20 → bázis 2 + k20P 2 (maximum)', () => {
    const r = calcVéCsökkentés('fegyverelőny', 20, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverelőny', bázis: 2, k20: 20, k20p: 2, szorzó: 1, flat: 0, végső: 4 });
  });

  it('Roham/Öngyilkos roham: szorzó=2 duplázza a végső értéket', () => {
    const r = calcVéCsökkentés('fegyverazonosság', 16, alapTáblázat, 2);
    expect(r).toEqual({ fegyverviszony: 'fegyverazonosság', bázis: 1, k20: 16, k20p: 1, szorzó: 2, flat: 0, végső: 4 });
  });

  it('fegyverelőny + k20=10 → k20P is 2 (a speciális eset, nem csak a 20-as)', () => {
    const r = calcVéCsökkentés('fegyverelőny', 10, alapTáblázat);
    expect(r.k20p).toBe(2);
    expect(r.végső).toBe(4);
  });
});

describe('calcTaktikaVéCsökkentésBázis - sorrend-alapú akkumulálás (schemas/taktika.yaml konvenció)', () => {
  const nincsFeltétel = () => false;
  const mindigTeljesül = () => true;

  it('Fárasztás: override 3, Fegyverelőny feltétel nem teljesül → 3', () => {
    const hatások = [
      { mód: 'override', érték: 3, cél: 'vé_csökkentés' },
      { mód: 'flat', érték: 1, cél: 'vé_csökkentés', feltétel: 'harci_helyzet:fegyverelőny' },
    ];
    expect(calcTaktikaVéCsökkentésBázis(hatások, nincsFeltétel)).toBe(3);
  });

  it('Fárasztás: override 3 + flat 1 (feltétel teljesül) → 4', () => {
    const hatások = [
      { mód: 'override', érték: 3, cél: 'vé_csökkentés' },
      { mód: 'flat', érték: 1, cél: 'vé_csökkentés', feltétel: 'harci_helyzet:fegyverelőny' },
    ];
    expect(calcTaktikaVéCsökkentésBázis(hatások, mindigTeljesül)).toBe(4);
  });

  it('a lista-sorrend nem számít: flat előbb, override utána is 4 (§42.3 - override = bázis)', () => {
    const hatások = [
      { mód: 'flat', érték: 1, cél: 'vé_csökkentés' },
      { mód: 'override', érték: 3, cél: 'vé_csökkentés' },
    ];
    expect(calcTaktikaVéCsökkentésBázis(hatások, mindigTeljesül)).toBe(4);
  });

  it('más célú hatások (pl. té_dobás) nem számítanak bele', () => {
    const hatások = [
      { mód: 'hátrány', érték: -2, cél: 'sebzésdobás' },
      { mód: 'override', érték: 3, cél: 'vé_csökkentés' },
    ];
    expect(calcTaktikaVéCsökkentésBázis(hatások, mindigTeljesül)).toBe(3);
  });

  it('üres/undefined hatások lista → 0', () => {
    expect(calcTaktikaVéCsökkentésBázis(undefined, mindigTeljesül)).toBe(0);
    expect(calcTaktikaVéCsökkentésBázis([], mindigTeljesül)).toBe(0);
  });
});

describe('calcTaktikaVéCsökkentés - taktika + fortély bővítés', () => {
  const farasztásHatások = [
    { mód: 'override', érték: 3, cél: 'vé_csökkentés', megjegyzés: 'VÉ csökkentés: 3 fixen' },
    { mód: 'flat', érték: 1, cél: 'vé_csökkentés', feltétel: 'harci_helyzet:fegyverelőny' },
  ];
  const bővítés = [{ forrás: 'Fárasztás', érték: 1 }];

  it('csak taktika (nincs fortély, nincs Fegyverelőny) → 3', () => {
    const r = calcTaktikaVéCsökkentés(farasztásHatások, [], () => false);
    expect(r.taktikaBázis).toBe(3);
    expect(r.fortélyBővítések).toEqual([]);
    expect(r.végső).toBe(3);
  });

  it('taktika + fortély bővítés → 4', () => {
    const r = calcTaktikaVéCsökkentés(farasztásHatások, bővítés, () => false);
    expect([r.taktikaBázis, r.fortélyBővítések, r.végső]).toEqual([3, bővítés, 4]);
  });

  it('taktika + fortély + Fegyverelőny (minden feltétel teljesül) → 5', () => {
    const r = calcTaktikaVéCsökkentés(farasztásHatások, bővítés, () => true);
    expect([r.taktikaBázis, r.végső]).toEqual([4, 5]);
  });
});

describe('fortélyVéCsökkentésBővítések - a közös §42 gyűjtőből (valódi adat)', () => {
  const data = loadGameDataSync();
  const k: Karakter = validKarakter({ fortélyok: [{ id: 'fárasztás', fok: 1, elem: '' }] });
  it('taktika:fárasztás feltétel teljesül → Fárasztás +1', () => {
    expect(fortélyVéCsökkentésBővítések(k, k.session, data, f => f === 'taktika:fárasztás')).toEqual([{ forrás: 'Fárasztás', érték: 1 }]);
  });
  it('feltétel nem teljesül → nincs bővítés', () => {
    expect(fortélyVéCsökkentésBővítések(k, k.session, data, () => false)).toEqual([]);
  });
  it('fortély nélkül → nincs bővítés', () => {
    expect(fortélyVéCsökkentésBővítések({ ...k, fortélyok: [] }, k.session, data, () => true)).toEqual([]);
  });
});

describe('helyzet-eredetű flat bővítés (§42.3: additív a szorzó előtt)', () => {
  it('Meglepetés +2 Roham ×2 mellett: (1 + 1 + 2) × 2 = 8', () => {
    expect(calcVéCsökkentés('fegyverazonosság', 16, alapTáblázat, 2, 2).végső).toBe(8);
  });
  it('Fárasztás + Meglepetés: 3 + 2 = 5 (általános szabály, nincs külön eset)', () => {
    const r = calcTaktikaVéCsökkentés([{ mód: 'override', érték: 3, cél: 'vé_csökkentés' }], [], () => true, [{ forrás: 'Meglepetés', érték: 2 }]);
    expect([r.végső, r.helyzetBővítések]).toEqual([5, [{ forrás: 'Meglepetés', érték: 2 }]]);
  });
});

describe('calcVéCsökkentésSzorzó - Roham/Öngyilkos roham duplázás', () => {
  it('Roham hatás ([szorzó 2, cél vé_csökkentés]) → 2', () => {
    const hatások = [{ mód: 'szorzó', érték: 2, cél: 'vé_csökkentés' }];
    expect(calcVéCsökkentésSzorzó(hatások)).toBe(2);
  });

  it('nincs szorzó hatás → 1', () => {
    expect(calcVéCsökkentésSzorzó(undefined)).toBe(1);
    expect(calcVéCsökkentésSzorzó([])).toBe(1);
    expect(calcVéCsökkentésSzorzó([{ mód: 'override', érték: 3, cél: 'vé_csökkentés' }])).toBe(1);
  });

  it('más célú szorzó nem számít bele', () => {
    expect(calcVéCsökkentésSzorzó([{ mód: 'szorzó', érték: 2, cél: 'sebzésdobás' }])).toBe(1);
  });

  it('több szorzó: a legnagyobb számít (§42.3, nem kumulál)', () => {
    const hatások = [{ mód: 'szorzó', érték: 2, cél: 'vé_csökkentés' }, { mód: 'szorzó', érték: 2, cél: 'vé_csökkentés' }];
    expect(calcVéCsökkentésSzorzó(hatások)).toBe(2);
  });
});

describe('támadódobástTiltóTaktika - Fárasztás / Teljes Védekezés → a Támadó dobás popup nem enged dobni', () => {
  const sess = (taktikák: string[]) => ({ aktív_taktikák: taktikák.map(név => ({ név })) }) as unknown as Session;

  it('Fárasztás aktív → a taktika neve', () => {
    expect(támadódobástTiltóTaktika(sess(['Fárasztás']))).toBe('Fárasztás');
  });
  it('Teljes Védekezés aktív → a taktika neve', () => {
    expect(támadódobástTiltóTaktika(sess(['Teljes Védekezés']))).toBe('Teljes Védekezés');
  });
  it('nincs aktív taktika → null', () => {
    expect(támadódobástTiltóTaktika(sess([]))).toBeNull();
  });
  it('más taktika (pl. Roham) nem tiltja a támadódobást → null', () => {
    expect(támadódobástTiltóTaktika(sess(['Roham']))).toBeNull();
  });
});
