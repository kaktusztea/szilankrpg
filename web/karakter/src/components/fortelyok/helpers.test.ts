import { describe, it, expect } from 'vitest';
import { checkKövetelmények } from './helpers';
import type { FortelyFokSummary } from '../../engine/data-loader';

// Minimál fok-def gyártó a követelmények teszteléséhez.
function fok(követelmények: FortelyFokSummary['követelmények']): FortelyFokSummary {
  return { fok: 1, hatás: [], követelmény: [], követelmények, módosítók: [], próba_enyhítések: [] };
}

// A hiány-feliratok neveihez (a követelmények id-vel hivatkoznak).
const data = {
  kepzettsegDefs: [{ id: 'akrobatika', név: 'Akrobatika', többszörös: [] }],
  fortelySummaries: [{ id: 'kultúrkör', név: 'Kultúrkör' }, { id: 'analfabéta', név: 'Analfabéta' }],
} as never;

describe('checkKövetelmények', () => {
  it('üres/undefined követelménynél nincs hiány', () => {
    expect(checkKövetelmények(undefined, [], [], data)).toEqual([]);
    expect(checkKövetelmények(fok([]), [], [], data)).toEqual([]);
  });

  it('képzettség-követelmény: teljesül ha a szint elég', () => {
    const def = fok([{ név: 'akrobatika', érték: 6, típus: 'képzettség' }]);
    expect(checkKövetelmények(def, [{ id: 'akrobatika', elem: '', szint: 6 }], [], data)).toEqual([]);
    expect(checkKövetelmények(def, [{ id: 'akrobatika', elem: '', szint: 5 }], [], data)).toHaveLength(1);
  });

  it('fortély-követelmény: teljesül ha a fok elég', () => {
    const def = fok([{ név: 'kultúrkör', érték: 1, típus: 'fortély' }]);
    expect(checkKövetelmények(def, [], [{ id: 'kultúrkör', fok: 1, elem: ''}], data)).toEqual([]);
    expect(checkKövetelmények(def, [], [], data)).toHaveLength(1);
  });

  it('tiltó_fortély: a tiltott fortély megléte KIZÁRÓ ok', () => {
    const def = fok([{ név: 'analfabéta', érték: 1, típus: 'tiltó_fortély' }]);
    // nincs Analfabéta -> teljesül (nincs hiány)
    expect(checkKövetelmények(def, [], [], data)).toEqual([]);
    // van Analfabéta -> sértés
    const sértés = checkKövetelmények(def, [], [{ id: 'analfabéta', fok: 1, elem: ''}], data);
    expect(sértés).toHaveLength(1);
    expect(sértés[0]).toContain('Analfabéta');
  });
});
