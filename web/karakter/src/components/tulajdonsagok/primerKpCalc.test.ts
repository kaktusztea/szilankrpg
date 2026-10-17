import { describe, it, expect } from 'vitest';
import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { calcPrimerKp } from './primerKpCalc';

const data = {
  konstansok: {
    harcmodorok: { közelharci: ['kardvívás'], távolsági: ['íjászat'] },
    kp: { hm: 2, cm: 3 },
  },
  // cumulative cost: kpCost(1)=1, kpCost(2)=3, kpCost(3)=6
  kepzettsegKp: [{ szint: 1, kp: 1 }, { szint: 2, kp: 2 }, { szint: 3, kp: 3 }],
  kepzettsegDefs: [
    { id: 'harcmodor', név: 'Harcmodor', csoport: 'harci', primer: true, többszörös: ['Kardvívás'] },
    { id: 'alkímia', név: 'Alkímia', csoport: 'misztikus', primer: true, többszörös: [] },
    { id: 'úszás', név: 'Úszás', csoport: 'fizikai', primer: true, többszörös: [] },
    { id: 'kufárkodás', név: 'Kufárkodás', csoport: 'társadalmi', primer: false, többszörös: [] },
  ],
  primerFortelyok: ['támadó_fokozás', 'meditáció'],
  fortelySummaries: [
    { id: 'támadó_fokozás', név: 'Támadó fokozás', csoport: 'harci', kp_perfok: 2 },
    { id: 'meditáció', név: 'Meditáció', csoport: 'misztikus', kp_perfok: 1 },
  ],
} as unknown as GameData;

const karakter = {
  HM_TÉ: 1, HM_VÉ: 2, CM: 1,
  fortélyok: [
    { id: 'támadó_fokozás', fok: 3, elem: '' },
    { id: 'meditáció', fok: 2, elem: '' },
  ],
} as unknown as Karakter;

const képzettségek = [
  { id: 'harcmodor', elem: 'kardvívás', szint: 3 },   // harcmodor → 6
  { id: 'alkímia', elem: '', szint: 2 },     // misztikus → 3
  { id: 'úszás', elem: '', szint: 1 },       // világi (primer) → 1
  { id: 'kufárkodás', elem: '', szint: 2 },  // not primer → excluded
];

describe('calcPrimerKp', () => {
  const r = calcPrimerKp(data, karakter, képzettségek);

  it('computes HM/CM cost', () => {
    expect(r.kp_hm_cm).toBe((1 + 2) * 2 + 1 * 3); // 9
  });

  it('splits skill KP into harcmodor / misztikus / világi buckets', () => {
    expect(r.kp_harcmodor).toBe(6);
    expect(r.kp_misztikus).toBe(3);
    expect(r.kp_világi).toBe(1); // Kufárkodás excluded (not primer)
  });

  it('splits fortély KP into harci / misztikus buckets', () => {
    expect(r.kp_harci_fort).toBe(3 * 2);  // Támadó fokozás fok 3 × 2
    expect(r.kp_miszt_fort).toBe(2 * 1);  // Meditáció fok 2 × 1
  });

  it('sums the total', () => {
    expect(r.total).toBe(9 + 6 + 3 + 1 + 6 + 2); // 27
  });
});
