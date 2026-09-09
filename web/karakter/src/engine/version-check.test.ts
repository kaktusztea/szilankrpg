import { describe, it, expect } from 'vitest';
import { shouldReload, buildReloadUrl } from './version-check';

describe('shouldReload', () => {
  it('egyező verzió → nincs újratöltés', () => {
    expect(shouldReload('26.252.43', '26.252.43', null)).toBe(false);
  });

  it('eltérő verzió → újratöltés', () => {
    expect(shouldReload('26.252.44', '26.252.43', null)).toBe(true);
  });

  it('ismeretlen szerver verzió (hiányzó/rossz metadata) → nincs újratöltés', () => {
    expect(shouldReload(undefined, '26.252.43', null)).toBe(false);
    expect(shouldReload('', '26.252.43', null)).toBe(false);
  });

  it('ugyanarra a verzióra nem töltünk újra kétszer (loop védelem)', () => {
    expect(shouldReload('26.252.44', '26.252.43', '26.252.44')).toBe(false);
  });

  it('újabb verzió akkor is elindítja, ha korábban másikra próbáltunk', () => {
    expect(shouldReload('26.252.45', '26.252.43', '26.252.44')).toBe(true);
  });
});

describe('buildReloadUrl', () => {
  const loc = { origin: 'https://kaktusztea.github.io', pathname: '/szilankrpg/', hash: '#AbC123' };

  it('megőrzi a hash-t (a megosztott karakter) és cache-buster query-t tesz rá', () => {
    expect(buildReloadUrl(loc, '26.252.44'))
      .toBe('https://kaktusztea.github.io/szilankrpg/?v=26.252.44#AbC123');
  });

  it('hash nélkül is működik', () => {
    expect(buildReloadUrl({ ...loc, hash: '' }, '26.252.44'))
      .toBe('https://kaktusztea.github.io/szilankrpg/?v=26.252.44');
  });
});
