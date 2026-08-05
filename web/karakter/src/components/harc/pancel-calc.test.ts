import { describe, it, expect } from 'vitest';
import { calcFtEnyhites } from './pancel-calc';

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
