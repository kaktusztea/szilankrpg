import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { encodeKarakterUrl, decodeKarakterFromHash } from './url-share';
import { DEFAULT_SESSION, type Karakter } from './types';

const DATA_ROOT = resolve(__dirname, '../../../../data');
let karakter: Karakter;

beforeAll(() => {
  // encodeKarakterUrl reads window.location — stub it for the node test env.
  (globalThis as { window?: unknown }).window = {
    location: { origin: 'https://example.test', pathname: '/app/' },
  };
  karakter = JSON.parse(readFileSync(resolve(DATA_ROOT, 'karakter/test_karakter2.json'), 'utf-8'));
});

function roundtrip(k: Karakter): Karakter {
  const url = encodeKarakterUrl(k);
  const hash = url.split('#')[1];
  const result = decodeKarakterFromHash(hash);
  if ('error' in result) throw new Error(`unexpected decode error: ${result.error}`);
  return result.karakter;
}

describe('url-share encode/decode roundtrip', () => {
  it('preserves the core scalar fields', () => {
    const d = roundtrip(karakter);
    expect(d.név).toBe(karakter.név);
    expect(d.tsz).toBe(karakter.tsz);
    expect(d.kor).toBe(karakter.kor);
    expect(d.anyanyelv).toBe(karakter.anyanyelv);
    expect(d.HM_TÉ).toBe(karakter.HM_TÉ);
    expect(d.HM_VÉ).toBe(karakter.HM_VÉ);
    expect(d.CM).toBe(karakter.CM);
    expect(d.tulajdonságok).toEqual(karakter.tulajdonságok);
    expect(d.hátterek.faj).toBe(karakter.hátterek.faj);
    expect(d.páncél.alap).toBe(karakter.páncél.alap);
  });

  it('preserves list contents (képzettségek, fortélyok, fegyverek, távfegyverek)', () => {
    const d = roundtrip(karakter);
    expect(d.képzettségek).toEqual(karakter.képzettségek);
    expect(d.fortélyok.map(f => [f.név, f.fok])).toEqual(karakter.fortélyok.map(f => [f.név, f.fok]));
    expect(d.fegyverek.map(f => f.alap)).toEqual(karakter.fegyverek.map(f => f.alap));
    expect(d.távfegyverek.map(f => f.alap)).toEqual(karakter.távfegyverek.map(f => f.alap));
  });

  it('resets non-shared fields (uid, session) on decode', () => {
    const d = roundtrip(karakter);
    expect(d.uid).toBe('');
    expect(d.id_leíró).toBe('');
    expect(d.napló).toEqual([]);
    expect(d.session).toEqual(DEFAULT_SESSION);
  });

  it('returns an error object for a corrupt hash', () => {
    const result = decodeKarakterFromHash('!!!! not valid base64 !!!!');
    expect('error' in result).toBe(true);
  });
});
