import { describe, it, expect } from 'vitest';
import { nextDuplicateName, nextDuplicateNamePair, generateIdLeíró } from './file-ops';

describe('nextDuplicateName', () => {
  it('first duplicate of a base name → 2', () => {
    expect(nextDuplicateName('Példa', ['Példa'])).toBe('Példa 2');
  });

  it('picks max existing N + 1 when duplicating the base again', () => {
    // "Példa" and "Példa 2" already exist → duplicating "Példa" must yield 3, not 2
    expect(nextDuplicateName('Példa', ['Példa', 'Példa 2'])).toBe('Példa 3');
  });

  it('duplicating an already-suffixed name uses the same base', () => {
    expect(nextDuplicateName('Példa 2', ['Példa', 'Példa 2'])).toBe('Példa 3');
  });

  it('handles gaps / highest wins', () => {
    expect(nextDuplicateName('Példa', ['Példa', 'Példa 5'])).toBe('Példa 6');
  });

  it('base need not exist; only suffixed variants present', () => {
    expect(nextDuplicateName('Példa 3', ['Példa 3'])).toBe('Példa 4');
  });

  it('does not match a different base', () => {
    expect(nextDuplicateName('Példa', ['Példabeszéd 9'])).toBe('Példa 2');
  });

  it('truncates the base so " N" fits within maxLen', () => {
    // 12-char limit (becenév): base "Hosszúbecen" (11) + " 2" (2) = 13 > 12 → trim base to 10
    expect(nextDuplicateName('Hosszúbecen', ['Hosszúbecen'], 12)).toBe('Hosszúbece 2');
    expect('Hosszúbece 2'.length).toBe(12);
  });

  it('trims trailing whitespace left after truncation', () => {
    // Cutting "Abcdefghi Jk" (maxLen 12, " 2" = 2) to 10 chars → "Abcdefghi " → trimEnd → "Abcdefghi"
    expect(nextDuplicateName('Abcdefghi Jk', [], 12)).toBe('Abcdefghi 2');
  });

  it('no truncation when the name already fits', () => {
    expect(nextDuplicateName('Rövid', ['Rövid'], 12)).toBe('Rövid 2');
  });

  it('higher N takes more room, truncating the base further', () => {
    // suffix " 10" is 3 chars → base "Hosszúbecen" trimmed to 9
    expect(nextDuplicateName('Hosszúbecen', ['Hosszúbecen 9'], 12)).toBe('Hosszúbec 10');
  });
});

describe('nextDuplicateNamePair — név/becenév szinkron verziózás', () => {
  it('egyik sincs verziózva → mindkettő 2', () => {
    expect(nextDuplicateNamePair('Aldo', 'Ali', [], [])).toEqual({ név: 'Aldo 2', becenév: 'Ali 2' });
  });

  it('csak a név verziózott → a becenév is ugyanazt a léptetett számot kapja', () => {
    expect(nextDuplicateNamePair('Aldo 3', 'Ali', [], [])).toEqual({ név: 'Aldo 4', becenév: 'Ali 4' });
  });

  it('csak a becenév verziózott → a név is ugyanazt a léptetett számot kapja', () => {
    expect(nextDuplicateNamePair('Aldo', 'Ali 5', [], [])).toEqual({ név: 'Aldo 6', becenév: 'Ali 6' });
  });

  it('mindkettő verziózott, de eltérnek → a nagyobbat léptetjük, mindkettőbe az kerül', () => {
    expect(nextDuplicateNamePair('Aldo 2', 'Ali 7', [], [])).toEqual({ név: 'Aldo 8', becenév: 'Ali 8' });
  });

  it('meglévő slot-verziók is emelik a közös számot (nem ütközhet)', () => {
    expect(nextDuplicateNamePair('Aldo', 'Ali', ['Aldo 4'], [])).toEqual({ név: 'Aldo 5', becenév: 'Ali 5' });
    expect(nextDuplicateNamePair('Aldo', 'Ali', [], ['Ali 9'])).toEqual({ név: 'Aldo 10', becenév: 'Ali 10' });
  });

  it('üres becenév üresen marad, csak a név verziózódik', () => {
    expect(nextDuplicateNamePair('Aldo', '', [], [])).toEqual({ név: 'Aldo 2', becenév: '' });
  });

  it('szinkron verzió a limitekre külön-külön vágva fér be', () => {
    // közös 2; név 40-be belefér, becenév (12) levágva
    const r = nextDuplicateNamePair('Aldo', 'Hosszúbecen', [], []);
    expect(r.név).toBe('Aldo 2');
    expect(r.becenév).toBe('Hosszúbece 2');
    expect(r.becenév.length).toBe(12);
  });
});

describe('generateIdLeíró', () => {
  it('slugifies the name (lowercase, spaces → dashes) and appends the tsz', () => {
    expect(generateIdLeíró('Von Agabor', 10)).toBe('von-agabor-10tsz');
  });

  it('collapses runs of whitespace into a single dash', () => {
    expect(generateIdLeíró('A  B\tC', 2)).toBe('a-b-c-2tsz');
  });

  it('falls back to "új-karakter" for an empty name', () => {
    expect(generateIdLeíró('', 3)).toBe('új-karakter-3tsz');
  });
});
