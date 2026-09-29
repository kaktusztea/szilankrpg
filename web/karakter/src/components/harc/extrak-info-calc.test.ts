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
    id: 'pontos', név: 'Pontos', leírás: '',
    feltétel: [
      { típus: 'aktor', érték: 'pengehegy' },
      { típus: 'forgatás', érték: 'egykezes' },
      { típus: 'manőver_állapot', érték: 'aktív' },
    ],
    hatás: [{ cél: 'manőver_ellenpróba', mód: 'flat', érték: 2, feltétel: 'manőver:precíz_támadás' }],
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

  it('több feltétel: egy nem-auto (manőver_állapot) → KM, ha a többi teljesül', () => {
    // pengehegy aktor + egykezes forgatás teljesül, de a manőver_állapot nem auto → KM.
    const t = extrakInfoTételek([{ id: 'pontos' }], defs, ctx({
      aktorNév: 'pengehegy-tőr', forgatás: 'egykezes',
    }))[0];
    expect(t.státusz).toBe('km');
  });

  it('több feltétel: egy hamis ÉS-tag (rossz aktor) → inaktív', () => {
    const t = extrakInfoTételek([{ id: 'pontos' }], defs, ctx({
      aktorNév: 'vágóél-íves-rövid', forgatás: 'egykezes',
    }))[0];
    expect(t.státusz).toBe('inaktív');
  });

  it('hatás-összefoglaló szövegek', () => {
    const t = extrakInfoTételek([{ id: 'panceltalant_jobban_sebez' }, { id: 'sfe_duplazodik' }], defs, ctx());
    expect(t[0].hatásSzöveg).toBe('SP +3');
    expect(t[1].hatásSzöveg).toBe('SFÉ ×2');
  });

  it('nincs extra / nincs def → üres', () => {
    expect(extrakInfoTételek(undefined, defs, ctx())).toEqual([]);
    expect(extrakInfoTételek([{ id: 'x' }], undefined, ctx())).toEqual([]);
  });
});
