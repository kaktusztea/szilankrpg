import { describe, it, expect } from 'vitest';
import { nextDuplicateNamePair, generateIdLeíró } from './file-ops';

describe('nextDuplicateNamePair - név/becenév szinkron verziózás', () => {
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
