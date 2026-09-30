import { describe, it, expect } from 'vitest';
import { ideaDelta } from './shared';

// A valós konstansok.yaml idea tábla releváns sorai (fegyver_idea_tabla.json).
const tabla = {
  '0': { TÉ: 0, VÉ: 0, SP: 0, sebesség: 0, súly: 0 },
  '2': { TÉ: 1, VÉ: 1, SP: 2, sebesség: 0, súly: 0 },
  '3': { TÉ: 1, VÉ: 1, SP: 3, sebesség: -1, súly: 0 },
  '4': { TÉ: 2, VÉ: 2, SP: 4, sebesség: -1, súly: -1 },
};

describe('ideaDelta - Modell 2 (példány vs idea_default)', () => {
  it('default példány (idea = idea_default) → 0 delta (a v2 érték már tartalmazza)', () => {
    expect(ideaDelta(3, 3, tabla)).toEqual({ TÉ: 0, VÉ: 0, SP: 0 });
  });

  it('sérült Slan (idea 2, default 3) → negatív delta a tábla különbségéből', () => {
    // IDEA[2]={TÉ1,VÉ1,SP2}, IDEA[3]={TÉ1,VÉ1,SP3} → delta {0,0,-1}
    expect(ideaDelta(2, 3, tabla)).toEqual({ TÉ: 0, VÉ: 0, SP: -1 });
  });

  it('áldott Slan (idea 4, default 3) → pozitív delta', () => {
    // IDEA[4]={TÉ2,VÉ2,SP4}, IDEA[3]={TÉ1,VÉ1,SP3} → delta {1,1,1}
    expect(ideaDelta(4, 3, tabla)).toEqual({ TÉ: 1, VÉ: 1, SP: 1 });
  });

  it('mundán fegyver (default 0), hangolva idea 2 → a teljes idea 2 hatás', () => {
    expect(ideaDelta(2, 0, tabla)).toEqual({ TÉ: 1, VÉ: 1, SP: 2 });
  });

  it('ismeretlen szint → 0-hatásként kezelt (nincs tábla-sor)', () => {
    expect(ideaDelta(9, 0, tabla)).toEqual({ TÉ: 0, VÉ: 0, SP: 0 });
  });
});
