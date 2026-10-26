import { describe, it, expect } from 'vitest';
import { extrakInfoTételek, type ExtraKontextus } from './extrak-info-calc';
import type { FegyverExtraDef } from '../../engine/data-types';

// A valós extrak.yaml alakjait tükröző fixtures.
const defs: Record<string, FegyverExtraDef> = {
  panceltalant_jobban_sebez: {
    id: 'panceltalant_jobban_sebez', név: 'Páncéltalant jobban sebez', leírás: 'Vérttelen célon +.',
    feltétel: [{ típus: 'cél_páncél', érték: 'vérttelen' }],
    hatás: [{ cél: 'SP', mód: 'flat', érték: 3 }],
  },
  sfe_duplazodik: {
    id: 'sfe_duplazodik', név: 'SFÉ dupla ellene', leírás: '',
    feltétel: [{ típus: 'cél_páncél', érték: 'páncélos' }],
    hatás: [{ cél: 'SFÉ', mód: 'szorzó', érték: 2 }],
  },
  beakadas_kockazat: {
    id: 'beakadas_kockazat', név: 'Beakad (~50%)', leírás: 'KM dönti el.',
    hatás: [{ cél: 'beakadás', mód: 'szöveges' }],
  },
  pontos: {
    id: 'pontos', név: 'Pontos', leírás: '', állapot: 'aktív',
    feltétel: [
      { típus: 'aktor', érték: 'pengehegy' },
      { típus: 'forgatás', érték: 'egykezes' },
    ],
    hatás: [{ cél: 'manőver_ellenpróba', mód: 'flat', érték: 2, feltétel: 'manőver:precíz_támadás' }],
  },
  kopjas_roham: {
    id: 'kopjas_roham', név: 'Kopja lovas rohamban', leírás: '',
    feltétel: [{ típus: 'taktika', id: 'lovas_roham' }],
    hatás: [{ cél: 'SP', mód: 'flat', érték: 10 }],
  },
  pancelszuras_belharcban: {
    id: 'pancelszuras_belharcban', név: 'Belharcban rések közt beszúr', leírás: '',
    feltétel: [{ típus: 'harci_helyzet', id: 'belharci_helyzet' }],
    hatás: [{ cél: 'SFÉ', mód: 'override', érték: 0 }],
  },
};

function ctx(over: Partial<ExtraKontextus> = {}): ExtraKontextus {
  return {
    aktívFeltételek: new Set(),
    fortélyFokok: new Map(),
    aktívStátuszok: new Set(),
    ...over,
  };
}

describe('extrakInfoTételek - fegyver-extrák állapota', () => {
  it('cél_páncél extra: választott páncélosztály nélkül KM, azzal aktív/inaktív', () => {
    const extrák = [{ id: 'panceltalant_jobban_sebez' }, { id: 'sfe_duplazodik' }];

    const nincsPáncél = extrakInfoTételek(extrák, defs, ctx());
    expect(nincsPáncél.map(t => t.státusz)).toEqual(['km', 'km']);

    const vérttelen = extrakInfoTételek(extrák, defs, ctx({ célPáncélKategória: 'vérttelen' }));
    expect(vérttelen.find(t => t.id === 'panceltalant_jobban_sebez')!.státusz).toBe('aktív');
    expect(vérttelen.find(t => t.id === 'sfe_duplazodik')!.státusz).toBe('inaktív');

    const páncélos = extrakInfoTételek(extrák, defs, ctx({ célPáncélKategória: 'páncélos' }));
    expect(páncélos.find(t => t.id === 'sfe_duplazodik')!.státusz).toBe('aktív');
  });

  it('tisztán szöveges hatású extra mindig KM-döntés', () => {
    const t = extrakInfoTételek([{ id: 'beakadas_kockazat' }], defs, ctx())[0];
    expect(t.státusz).toBe('km');
  });

  it('illő aktor/forgatás, nincs manőver-mód → aktív (az állapot nem szűr)', () => {
    // pengehegy aktor + egykezes forgatás teljesül; manőverÁllapot nincs → az állapot-oldaliság nem szűr.
    const t = extrakInfoTételek([{ id: 'pontos' }], defs, ctx({
      aktorNév: 'pengehegy-tőr', forgatás: 'egykezes',
    }))[0];
    expect(t.státusz).toBe('aktív');
  });

  it('több feltétel: egy hamis ÉS-tag (rossz aktor) → inaktív', () => {
    const t = extrakInfoTételek([{ id: 'pontos' }], defs, ctx({
      aktorNév: 'vágóél-íves-rövid', forgatás: 'egykezes',
    }))[0];
    expect(t.státusz).toBe('inaktív');
  });

  it('állapot-oldaliság: aktív extra + aktív manőver-mód → aktív', () => {
    // pontos állapota 'aktív'; a Manőver ablak aktív módjában rá/általa hat.
    const t = extrakInfoTételek([{ id: 'pontos' }], defs, ctx({
      aktorNév: 'pengehegy-tőr', forgatás: 'egykezes', manőverÁllapot: 'aktív',
    }))[0];
    expect(t.státusz).toBe('aktív');
  });

  it('állapot-oldaliság: aktív extra + passzív manőver-mód → inaktív', () => {
    // pontos állapota 'aktív', de a Manőver ablak passzív módjában (ellenem) nem releváns.
    const t = extrakInfoTételek([{ id: 'pontos' }], defs, ctx({
      aktorNév: 'pengehegy-tőr', forgatás: 'egykezes', manőverÁllapot: 'passzív',
    }))[0];
    expect(t.státusz).toBe('inaktív');
  });

  it('aktív harci taktika → a taktika-feltételes extra aktív', () => {
    const t = extrakInfoTételek([{ id: 'kopjas_roham' }], defs, ctx({
      aktívFeltételek: new Set(['taktika:lovas_roham']),
    }))[0];
    expect(t.státusz).toBe('aktív');
  });

  it('aktív harci helyzet → a helyzet-feltételes extra aktív', () => {
    const t = extrakInfoTételek([{ id: 'pancelszuras_belharcban' }], defs, ctx({
      aktívFeltételek: new Set(['harci_helyzet:belharci_helyzet']),
    }))[0];
    expect(t.státusz).toBe('aktív');
  });

  it('hatás-összefoglaló szövegek', () => {
    const t = extrakInfoTételek([{ id: 'panceltalant_jobban_sebez' }, { id: 'sfe_duplazodik' }], defs, ctx());
    expect(t[0].hatásSzöveg).toBe('SP +3');
    expect(t[1].hatásSzöveg).toBe('SFÉ ×2');
  });

  it('manőver-hatás: a felirat előtagja megnevezi a manővert', () => {
    // pontos: hatás-al-feltétel "manőver:precíz_támadás" → "Precíz támadás: manőver_ellenpróba +2"
    const t = extrakInfoTételek([{ id: 'pontos' }], defs, ctx());
    expect(t[0].hatásSzöveg).toBe('Precíz támadás: manőver_ellenpróba +2');
  });

  it('alcélos hatás: a felirat a komponenst nevezi meg (nem a teljes VÉ-t)', () => {
    const d: Record<string, FegyverExtraDef> = {
      pajzs_megkerules: { id: 'pajzs_megkerules', név: 'Pajzs megkerülése', leírás: '', feltétel: [{ típus: 'cél_felszereles', érték: 'pajzs' }],
        hatás: [{ cél: 'VÉ', alcél: 'felszerelés:pajzs', mód: 'szorzó', érték: 0 }] },
    } as unknown as Record<string, FegyverExtraDef>;
    expect(extrakInfoTételek([{ id: 'pajzs_megkerules' }], d, ctx())[0].hatásSzöveg).toBe('Pajzs-VÉ ×0');
  });

  it('tiltás-feloldás és ellenfél-al-feltétel felirata', () => {
    const d = { p: { id: 'p', név: 'P', leírás: '', feltétel: [], hatás: [
      { cél: 'tiltás:belharc_fegyverhossz', mód: 'letilt' },
      { cél: 'SFÉ', alcél: 'felszerelés:páncél', mód: 'override', érték: 0, feltétel: 'ellenfél_harci_helyzet:földön_fekve' },
    ] } } as unknown as Record<string, FegyverExtraDef>;
    expect(extrakInfoTételek([{ id: 'p' }], d, ctx())[0].hatásSzöveg)
      .toBe('Feloldva: belharc fegyverhossz, Páncél-SFÉ:0 (ha az ellenfél: földön fekve)');
  });

  it('nincs extra / nincs def → üres', () => {
    expect(extrakInfoTételek(undefined, defs, ctx())).toEqual([]);
    expect(extrakInfoTételek([{ id: 'x' }], undefined, ctx())).toEqual([]);
  });

  describe('csakManőver szűrő (Manőver ablak)', () => {
    const vegyes = [{ id: 'pontos' }, { id: 'kopjas_roham' }, { id: 'panceltalant_jobban_sebez' }];

    it('csak az aktív manőverre ható extra marad (a többi kiesik)', () => {
      const t = extrakInfoTételek(vegyes, defs, ctx({ aktívManőver: 'precíz_támadás' }), true);
      expect(t.map(x => x.id)).toEqual(['pontos']); // kopjas_roham / panceltalant: nincs manőver-hatás
    });

    it('más aktív manőver → egy manőver-hatású extra sem marad', () => {
      const t = extrakInfoTételek(vegyes, defs, ctx({ aktívManőver: 'lefegyverzés' }), true);
      expect(t).toEqual([]);
    });

    it('csakManőver=false (default): a teljes lista marad', () => {
      const t = extrakInfoTételek(vegyes, defs, ctx({ aktívManőver: 'precíz_támadás' }));
      expect(t.map(x => x.id)).toEqual(['pontos', 'kopjas_roham', 'panceltalant_jobban_sebez']);
    });
  });
});
