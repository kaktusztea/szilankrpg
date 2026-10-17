import { describe, it, expect } from 'vitest';
import { követelményTeljesül, gépiKövetelményStátusz } from './manover-dobas-calc';
import type { ManoverKövetelmény } from '../../engine/data-types';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

const data = {
  konstansok: { fegyver_kategória_harcmodor: { kard: 'kardvívás', ököl: 'közelharc' } },
} as unknown as GameData;

const karakter = {
  képzettségek: [
    { id: 'harcmodor', elem: 'kardvívás', szint: 6 },
    { id: 'harcmodor', elem: 'közelharc', szint: 3 },
    { id: 'harcmodor', elem: 'lándzsavívás', szint: 2 },
  ],
  fortélyok: [{ id: 'mesterfegyver', fok: 1, elem: ''}],
} as unknown as Karakter;

describe('követelményTeljesül', () => {
  it('"Harcmodor" = bármely harcmodor-képzettség max szintje (Kardvívás 6 ≥ 5)', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'képzettség', név: 'harcmodor', érték: 5 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(true);
  });
  it('konkrét képzettség szint alatt → false', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'képzettség', név: 'harcmodor/lándzsavívás', érték: 6 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(false);
  });
  it('fortély fok teljesül', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'fortély', név: 'mesterfegyver', érték: 1 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(true);
  });
  it('hiányzó fortély → false', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'fortély', név: 'pajzshasználat', érték: 2 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(false);
  });
  it('informatív (egyéb) → null (nem gépi)', () => {
    const köv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Fegyverelőny' };
    expect(követelményTeljesül(köv, karakter, data)).toBeNull();
  });

  describe('fegyver_sebzéstípus (jelleg kezdőbetű → S/V/Z)', () => {
    const kövV: ManoverKövetelmény = { erősség: 'erős', típus: 'fegyver_sebzéstípus', érték: 'V' };
    it('vágó-egyenes jelleg teljesíti a V követelményt (bug: korábban false volt)', () => {
      const af = { kategória: 'kardvívó', sebzésMódja: 'vágó-egyenes' };
      expect(követelményTeljesül(kövV, karakter, data, undefined, af)).toBe(true);
    });
    it('vágó-íves jelleg is V', () => {
      const af = { kategória: 'kardvívó', sebzésMódja: 'vágó-íves' };
      expect(követelményTeljesül(kövV, karakter, data, undefined, af)).toBe(true);
    });
    it('szúró jelleg NEM V', () => {
      const af = { kategória: 'kardvívó', sebzésMódja: 'szúró' };
      expect(követelményTeljesül(kövV, karakter, data, undefined, af)).toBe(false);
    });
    it('szúró jelleg teljesíti az S követelményt', () => {
      const kövS: ManoverKövetelmény = { erősség: 'erős', típus: 'fegyver_sebzéstípus', érték: 'S' };
      const af = { kategória: 'tőrvívó', sebzésMódja: 'szúró' };
      expect(követelményTeljesül(kövS, karakter, data, undefined, af)).toBe(true);
    });
    it('zúzó jelleg teljesíti a Z követelményt', () => {
      const kövZ: ManoverKövetelmény = { erősség: 'erős', típus: 'fegyver_sebzéstípus', érték: 'Z' };
      const af = { kategória: 'romboló', sebzésMódja: 'zúzó' };
      expect(követelményTeljesül(kövZ, karakter, data, undefined, af)).toBe(true);
    });
    it('nincs aktív fegyver → null (manuális)', () => {
      expect(követelményTeljesül(kövV, karakter, data, undefined, null)).toBeNull();
    });
  });
});

describe('gépiKövetelményStátusz', () => {
  it('minden gépi teljesül → nincs hiány', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'normál', típus: 'képzettség', név: 'harcmodor/kardvívás', érték: 6 }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: false, normálHiány: false });
  });
  it('gépi Normál hiány', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'normál', típus: 'képzettség', név: 'harcmodor/lándzsavívás', érték: 6 }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: false, normálHiány: true });
  });
  it('gépi Erős hiány', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'erős', típus: 'fortély', név: 'pajzshasználat', érték: 2 }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: true, normálHiány: false });
  });
  it('informatív követelmény nem befolyásol (null)', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'erős', típus: 'egyéb', leírás: 'Fegyverelőny' }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: false, normálHiány: false });
  });
});
