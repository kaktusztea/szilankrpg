import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { kétkezesKövetelményHiány } from './ketkezes';
import { checkKövetelmények } from '../components/fortelyok/helpers';
import type { Karakter } from './types';

/** Kétkezes harc fortély: nagyobb / kisebb fegyver harcmodor-követelménye (feltétel fegyverfogás:kétkezes), valós adaton. */
describe('Kétkezes harc követelmények', () => {
  const data = loadGameDataSync();
  // test_karakter2: Kard, lovag (hossz 3, Kardvívás 8) + Tőr (hossz 1, Közelharc 6), kétkezes fogás
  const k: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  const fokkal = (fok: number) => ({ ...k, fortélyok: [...k.fortélyok.filter(f => f.id !== 'kétkezes_harc'), { id: 'kétkezes_harc', elem: '', fok }] });
  const fokDef = (fok: number) => data.fortelySummaries.find(d => d.id === 'kétkezes_harc')!.fokok.find(f => f.fok === fok);

  it('Harc fül: 1. fok (6/3) teljesül; 2. fok (9/6): a Kard, lovag Kardvívás 8 kevés, a Tőr Közelharc 6 elég', () => {
    expect(kétkezesKövetelményHiány(fokkal(1), k.session, data)).toEqual([]);
    expect(kétkezesKövetelményHiány(fokkal(2), k.session, data)).toEqual(['Kard, lovag: Kardvívás 8 < 9']);
  });

  it('csak kétkezes fogásnál jelez', () => {
    expect(kétkezesKövetelményHiány(fokkal(3), { ...k.session, fegyverfogás: 'egyfegyveres' }, data)).toEqual([]);
  });

  it('Fortélyok fül (felvétel): bármely közelharci harcmodor legmagasabb szintje (a) - 8 → 1. fok OK, 2-3. fokon a 9 hiányzik', () => {
    const hiány = (fok: number) => checkKövetelmények(fokDef(fok), k.képzettségek, k.fortélyok, data, undefined, {}, 'kétkezes_harc');
    expect(hiány(1)).toEqual([]);
    expect(hiány(2)).toEqual(['Harcmodor (nagyobb fegyver) ≥ 9']);
    expect(hiány(3)).toEqual(['Harcmodor (nagyobb fegyver) ≥ 9', 'Harcmodor (kisebb fegyver) ≥ 9']);
  });
});
