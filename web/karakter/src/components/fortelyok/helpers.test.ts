import { describe, it, expect } from 'vitest';
import { checkKövetelmények } from './helpers';
import type { FortelyFokSummary } from '../../engine/data-loader';

// Minimál fok-def gyártó a követelmények teszteléséhez.
function fok(követelmények: FortelyFokSummary['követelmények']): FortelyFokSummary {
  return { fok: 1, hatás: [], követelmény: [], követelmények, módosítók: [], próba_enyhítések: [] };
}

const harcmodorNevek = ['Közelharc', 'Kardvívás', 'Rombolás', 'Lándzsavívás', 'Ostorharc'];

describe('checkKövetelmények', () => {
  it('üres/undefined követelménynél nincs hiány', () => {
    expect(checkKövetelmények(undefined, [], [], harcmodorNevek)).toEqual([]);
    expect(checkKövetelmények(fok([]), [], [], harcmodorNevek)).toEqual([]);
  });

  it('képzettség-követelmény: teljesül ha a szint elég', () => {
    const def = fok([{ név: 'Akrobatika', érték: 6, típus: 'képzettség' }]);
    expect(checkKövetelmények(def, [{ név: 'Akrobatika', szint: 6 }], [], harcmodorNevek)).toEqual([]);
    expect(checkKövetelmények(def, [{ név: 'Akrobatika', szint: 5 }], [], harcmodorNevek)).toHaveLength(1);
  });

  it('fortély-követelmény: teljesül ha a fok elég', () => {
    const def = fok([{ név: 'Kultúrkör', érték: 1, típus: 'fortély' }]);
    expect(checkKövetelmények(def, [], [{ név: 'Kultúrkör', fok: 1 }], harcmodorNevek)).toEqual([]);
    expect(checkKövetelmények(def, [], [], harcmodorNevek)).toHaveLength(1);
  });

  it('tiltó_fortély: a tiltott fortély megléte KIZÁRÓ ok', () => {
    const def = fok([{ név: 'Analfabéta', érték: 1, típus: 'tiltó_fortély' }]);
    // nincs Analfabéta -> teljesül (nincs hiány)
    expect(checkKövetelmények(def, [], [], harcmodorNevek)).toEqual([]);
    // van Analfabéta -> sértés
    const sértés = checkKövetelmények(def, [], [{ név: 'Analfabéta', fok: 1 }], harcmodorNevek);
    expect(sértés).toHaveLength(1);
    expect(sértés[0]).toContain('Analfabéta');
  });
});
