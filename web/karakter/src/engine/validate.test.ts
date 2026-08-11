import { describe, it, expect } from 'vitest';
import { validateKarakter, isValidKarakter } from './validate';

describe('validateKarakter', () => {
  const valid = {
    schema_version: 2,
    uid: 'test',
    id_leíró: 'test',
    név: 'Teszt',
    becenév: '',
    jk: true,
    játékos: '',
    mentés_dátum: '',
    tsz: 4,
    leírás: '',
    kor: 20,
    anyanyelv: '',
    vallás: '',
    tulajdonságok: { erő: 3 },
    HM_TÉ: 0,
    HM_VÉ: 0,
    CM: 0,
    képzettségek: [],
    fortélyok: [],
    fortélyok_speciális: {},
    hátterek: {},
    fegyverek: [],
    távfegyverek: [],
    páncél: {},
    pajzs: {},
    felszerelés: {},
    előtörténet: {},
    jegyzetek: '',
    napló: [],
    checkpoints: [],
    session: {
      szilánk: 1,
      vé_csökkenés: 0,
      vé_history: [],
      manőver_pont_használt: 0,
      sebzések: [],
      aktív_fegyver_index: 0,
      aktív_fegyver_bal_index: -1,
      kétkezes_harc: false,
      aktív_pajzs: false,
      aktív_páncél: true,
      aktív_taktikák: [],
      aktív_helyzetek: [],
      aktív_manőver: '',
      aktív_státuszok: [],
      narratív_módosítók: [],
      harci_akrobatika: false,
      fegyverfogás: 'egyfegyveres',
      aktív_távfegyver_index: -1,
      ké_dobások: [],
      té_dobások: [],
    },
  };

  it('accepts valid schema', () => {
    expect(validateKarakter(valid)).toEqual({ valid: true });
    expect(isValidKarakter(valid)).toBe(true);
  });
  it('rejects null', () => {
    const r = validateKarakter(null);
    expect(r.valid).toBe(false);
  });
  it('rejects wrong schema version', () => {
    const r = validateKarakter({ ...valid, schema_version: 1 });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.missing).toContain('schema_version (≠ 2)');
  });
  it('rejects missing top-level fields', () => {
    const { fortélyok, ...noFort } = valid;
    const r = validateKarakter(noFort);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.missing).toContain('fortélyok');
  });
  it('rejects missing session fields', () => {
    const { session, ...rest } = valid;
    const incomplete = { ...rest, session: { szilánk: 1 } };
    const r = validateKarakter(incomplete);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.missing).toContain('session.té_dobások');
  });
});
