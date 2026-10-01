import { describe, it, expect } from 'vitest';
import { szitFeltételTeljesül, szitModKezdőÁllapot } from './manover-dobas-calc';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { ModositoTabla } from '../../engine/data-types';

// Minimál fixtures: egy Tőrkard-szerű fegyver (pontos extrával) + taktika-feltétel forrás.
function makeData(): GameData {
  return {
    fegyverek: [
      { név: 'Tőrkard', kategória: 'kardvívó', fegyverhossz: 3, akadály: 0, övön_hordható: true, ár: null,
        extrák: [{ id: 'pontos', név: 'Pontos' }], módok: [{ aktor: 'pengehegy-kard', jelleg: 'szúró', sebzéstípus: 'elsődleges', TÉ: 0, VÉ: 0, SP: 0, Átütés: 0, Sebesség: 6, Forgatás: 'egykezes', Erőlimit: 99, FP: false }] },
    ],
    taktikak: [{ név: 'Roham', feltétel_kulcs: 'taktika:roham', fokozatos: false, módosítók: {}, hatások: [], kombó_mód: 'whitelist', kombó_lista: [] }],
    harciHelyzetek: [],
  } as unknown as GameData;
}

const karakter = { fegyverek: [{ alap: 'Tőrkard' }] } as unknown as Karakter;

function session(over: Partial<Session> = {}): Session {
  return {
    aktív_fegyver_index: 0, aktív_taktikák: [], aktív_helyzetek: [], fegyverfogás: 'egyfegyveres',
    ...over,
  } as unknown as Session;
}

describe('szitFeltételTeljesül', () => {
  it('fegyver_extra: az aktív fegyver hordozza-e az extrát', () => {
    expect(szitFeltételTeljesül('fegyver_extra:pontos', karakter, session(), makeData())).toBe(true);
    expect(szitFeltételTeljesül('fegyver_extra:nincs_ilyen', karakter, session(), makeData())).toBe(false);
  });

  it('fegyver_kategória: az aktív fegyver kategóriája', () => {
    expect(szitFeltételTeljesül('fegyver_kategória:kardvívó', karakter, session(), makeData())).toBe(true);
    expect(szitFeltételTeljesül('fegyver_kategória:romboló', karakter, session(), makeData())).toBe(false);
  });

  it('taktika: az aktív taktikák feltétel-kulcsa', () => {
    expect(szitFeltételTeljesül('taktika:roham', karakter, session({ aktív_taktikák: [{ név: 'Roham' }] as never }), makeData())).toBe(true);
    expect(szitFeltételTeljesül('taktika:roham', karakter, session(), makeData())).toBe(false);
  });

  it('nincs feltétel / ismeretlen alak → false', () => {
    expect(szitFeltételTeljesül(undefined, karakter, session(), makeData())).toBe(false);
    expect(szitFeltételTeljesül('nincs_kettospont', karakter, session(), makeData())).toBe(false);
  });
});

describe('szitModKezdőÁllapot - auto-match kezdőérték', () => {
  const táblák: ModositoTabla[] = [
    { kategória: 'Fegyver', mód: 'single', sorok: [
      { érték: -2, leírás: 'Precíziós szúróhegy (Pontos)', feltétel: 'fegyver_extra:pontos' },
      { érték: 0, leírás: 'Egykezes kardvívó' },
      { érték: 2, leírás: 'Zúzófegyver' },
    ] },
    { kategória: 'Taktika', mód: 'single', sorok: [
      { érték: 2, leírás: 'Roham taktika', feltétel: 'taktika:roham' },
    ] },
  ];

  it('single: a teljesülő feltételes sor indexe lesz a kezdőérték', () => {
    const st = szitModKezdőÁllapot(táblák, karakter, session(), makeData());
    expect(st.single['Fegyver']).toBe(0);   // pontos extra teljesül → 0. sor auto-be
    expect(st.single['Taktika']).toBe(-1);   // Roham nem aktív → nincs match
  });

  it('single: aktív Roham taktikánál a taktika-sor is bekapcsol', () => {
    const st = szitModKezdőÁllapot(táblák, karakter, session({ aktív_taktikák: [{ név: 'Roham' }] as never }), makeData());
    expect(st.single['Taktika']).toBe(0);
  });
});
