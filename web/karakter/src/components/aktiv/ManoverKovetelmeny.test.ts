import { describe, it, expect } from 'vitest';
import { követelményTeljesül, gépiKövetelményStátusz } from './ManoverDobasPopup';
import type { ManoverKövetelmény } from '../../engine/data-types';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

const data = {
  konstansok: { fegyver_kategória_harcmodor: { kard: 'Kardvívás', ököl: 'Közelharc' } },
} as unknown as GameData;

const karakter = {
  képzettségek: [
    { név: 'Kardvívás', szint: 6 },
    { név: 'Közelharc', szint: 3 },
    { név: 'Lándzsavívás', szint: 2 },
  ],
  fortélyok: [{ név: 'Mesterfegyver', fok: 1 }],
} as unknown as Karakter;

describe('követelményTeljesül', () => {
  it('"Harcmodor" = bármely harcmodor-képzettség max szintje (Kardvívás 6 ≥ 5)', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'képzettség', név: 'Harcmodor', érték: 5 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(true);
  });
  it('konkrét képzettség szint alatt → false', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'képzettség', név: 'Lándzsavívás', érték: 6 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(false);
  });
  it('fortély fok teljesül', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'fortély', név: 'Mesterfegyver', érték: 1 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(true);
  });
  it('hiányzó fortély → false', () => {
    const köv: ManoverKövetelmény = { erősség: 'normál', típus: 'fortély', név: 'Pajzshasználat', érték: 2 };
    expect(követelményTeljesül(köv, karakter, data)).toBe(false);
  });
  it('informatív (egyéb) → null (nem gépi)', () => {
    const köv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Pengeelőny' };
    expect(követelményTeljesül(köv, karakter, data)).toBeNull();
  });
});

describe('gépiKövetelményStátusz', () => {
  it('minden gépi teljesül → nincs hiány', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'normál', típus: 'képzettség', név: 'Kardvívás', érték: 6 }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: false, normálHiány: false });
  });
  it('gépi Normál hiány', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'normál', típus: 'képzettség', név: 'Lándzsavívás', érték: 6 }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: false, normálHiány: true });
  });
  it('gépi Erős hiány', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'erős', típus: 'fortély', név: 'Pajzshasználat', érték: 2 }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: true, normálHiány: false });
  });
  it('informatív követelmény nem befolyásol (null)', () => {
    const k: ManoverKövetelmény[] = [{ erősség: 'erős', típus: 'egyéb', leírás: 'Pengeelőny' }];
    expect(gépiKövetelményStátusz(k, karakter, data)).toEqual({ erősHiány: false, normálHiány: false });
  });
});
