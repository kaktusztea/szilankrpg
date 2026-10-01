import { describe, it, expect } from 'vitest';
import { calcVéCsökkentés, calcTaktikaVéCsökkentésBázis, calcTaktikaVéCsökkentés } from './ve-csokkentes-calc';

const alapTáblázat = { fegyverhátrány: 0, fegyverazonosság: 1, fegyverelőny: 2 };

describe('calcVéCsökkentés', () => {
  it('fegyverhátrány + páratlan k20 → bázis 0 + k20P 0', () => {
    const r = calcVéCsökkentés('fegyverhátrány', 5, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverhátrány', bázis: 0, k20: 5, k20p: 0, végső: 0 });
  });

  it('fegyverazonosság + páros k20 → bázis 1 + k20P 1', () => {
    const r = calcVéCsökkentés('fegyverazonosság', 16, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverazonosság', bázis: 1, k20: 16, k20p: 1, végső: 2 });
  });

  it('fegyverelőny + k20=20 → bázis 2 + k20P 2 (maximum)', () => {
    const r = calcVéCsökkentés('fegyverelőny', 20, alapTáblázat);
    expect(r).toEqual({ fegyverviszony: 'fegyverelőny', bázis: 2, k20: 20, k20p: 2, végső: 4 });
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
      { hatás: 'override', érték: 3, cél: 'vé_csökkentés' },
      { hatás: 'flat', érték: 1, cél: 'vé_csökkentés', feltétel: 'harci_helyzet:fegyverelőny' },
    ];
    expect(calcTaktikaVéCsökkentésBázis(hatások, nincsFeltétel)).toBe(3);
  });

  it('Fárasztás: override 3 + flat 1 (feltétel teljesül) → 4', () => {
    const hatások = [
      { hatás: 'override', érték: 3, cél: 'vé_csökkentés' },
      { hatás: 'flat', érték: 1, cél: 'vé_csökkentés', feltétel: 'harci_helyzet:fegyverelőny' },
    ];
    expect(calcTaktikaVéCsökkentésBázis(hatások, mindigTeljesül)).toBe(4);
  });

  it('ha a flat ELŐBB jönne mint az override, az override törli (sorrend számít)', () => {
    const hatások = [
      { hatás: 'flat', érték: 1, cél: 'vé_csökkentés' },
      { hatás: 'override', érték: 3, cél: 'vé_csökkentés' },
    ];
    expect(calcTaktikaVéCsökkentésBázis(hatások, mindigTeljesül)).toBe(3);
  });

  it('más célú hatások (pl. té_dobás) nem számítanak bele', () => {
    const hatások = [
      { hatás: 'hátrány', érték: -2, cél: 'sebzésdobás' },
      { hatás: 'override', érték: 3, cél: 'vé_csökkentés' },
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
    { hatás: 'override', érték: 3, cél: 'vé_csökkentés', megjegyzés: 'VÉ csökkentés: 3 fixen' },
    { hatás: 'flat', érték: 1, cél: 'vé_csökkentés', feltétel: 'harci_helyzet:fegyverelőny' },
  ];
  const farasztásFortély = [
    { forrás: 'Fárasztás', módosítók: [{ cél: 'vé_csökkentés', érték: 1, mód: 'flat', feltétel: 'taktika:fárasztás' }] },
  ];

  it('csak taktika (nincs fortély, nincs Fegyverelőny) → 3', () => {
    const r = calcTaktikaVéCsökkentés(farasztásHatások, [], () => false);
    expect(r.taktikaBázis).toBe(3);
    expect(r.fortélyBővítések).toEqual([]);
    expect(r.végső).toBe(3);
  });

  it('taktika + fortély (taktika:fárasztás feltétel teljesül) → 4', () => {
    const r = calcTaktikaVéCsökkentés(
      farasztásHatások, farasztásFortély,
      (f) => f === 'taktika:fárasztás',
    );
    expect(r.taktikaBázis).toBe(3);
    expect(r.fortélyBővítések).toEqual([{ forrás: 'Fárasztás', érték: 1 }]);
    expect(r.végső).toBe(4);
  });

  it('taktika + fortély + Fegyverelőny (minden feltétel teljesül) → 5', () => {
    const r = calcTaktikaVéCsökkentés(farasztásHatások, farasztásFortély, () => true);
    expect(r.taktikaBázis).toBe(4);
    expect(r.végső).toBe(5);
  });

  it('fortély megvan, de a taktika:fárasztás feltétele nem teljesül → a bővítés nem él', () => {
    const r = calcTaktikaVéCsökkentés(farasztásHatások, farasztásFortély, () => false);
    expect(r.fortélyBővítések).toEqual([]);
    expect(r.végső).toBe(3);
  });
});
