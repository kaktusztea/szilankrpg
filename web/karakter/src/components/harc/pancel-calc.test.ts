import { describe, it, expect } from 'vitest';
import { calcFtEnyhites, calcFogas } from './pancel-calc';

const ftTable = [
  { szint: 1, enyhítés: 1 },
  { szint: 3, enyhítés: 2 },
  { szint: 5, enyhítés: 3 },
];

describe('calcFtEnyhites', () => {
  it('returns 0 when the character has no Fájdalomtűrés', () => {
    expect(calcFtEnyhites([], ftTable)).toBe(0);
  });

  it('returns 0 when below the first threshold', () => {
    // ftTable starts at szint 1; szint 0 → nothing applies
    expect(calcFtEnyhites([{ név: 'Fájdalomtűrés', szint: 0 }], ftTable)).toBe(0);
  });

  it('picks the highest row whose szint <= the character szint', () => {
    expect(calcFtEnyhites([{ név: 'Fájdalomtűrés', szint: 4 }], ftTable)).toBe(2);
  });

  it('applies the top row at or above the last threshold', () => {
    expect(calcFtEnyhites([{ név: 'Fájdalomtűrés', szint: 9 }], ftTable)).toBe(3);
  });

  it('ignores unrelated képzettségek', () => {
    expect(calcFtEnyhites([{ név: 'Úszás', szint: 9 }], ftTable)).toBe(0);
  });
});

describe('calcFogas — belharc pajzs degradáció', () => {
  const konstansok = {
    belharc_pajzs_max_méret: 'kis',
    pajzs_hatások: {
      kis: [{ fok: 0, VÉ: 3, TÉ: -3 }],
      közepes: [{ fok: 0, VÉ: 10, TÉ: -6 }],
      nagy: [{ fok: 0, VÉ: 16, TÉ: -9 }],
    },
  };
  const baseK = { fortélyok: [], pajzs: { méret: 'nagy' }, fegyverek: [] } as any;
  const baseSession = {
    aktív_pajzs: true, fegyverfogás: 'egy_kezes', aktív_fegyver_index: 0,
    aktív_fegyver_bal_index: -1, aktív_helyzetek: [] as string[],
  } as any;
  const data = { konstansok, fegyverek: [] } as any;

  it('nagy pajzs teljes VÉ-t ad belharcon kívül', () => {
    const { pajzsVÉ } = calcFogas(baseK, baseSession, data, {});
    expect(pajzsVÉ).toBe(16);
  });

  it('nagy pajzs belharcban kis pajzsra degradálódik', () => {
    const session = { ...baseSession, aktív_helyzetek: ['Belharci helyzet'] };
    const { pajzsVÉ } = calcFogas(baseK, session, data, {});
    expect(pajzsVÉ).toBe(3);
  });

  it('kis pajzs belharcban nem változik', () => {
    const k = { ...baseK, pajzs: { méret: 'kis' } };
    const session = { ...baseSession, aktív_helyzetek: ['Belharci helyzet'] };
    const { pajzsVÉ } = calcFogas(k, session, data, {});
    expect(pajzsVÉ).toBe(3);
  });
});
