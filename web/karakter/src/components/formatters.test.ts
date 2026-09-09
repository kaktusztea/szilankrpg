import { describe, it, expect } from 'vitest';
import { fmtHatás } from './formatters';

// A hatás → szöveg formázás egyetlen helye (Aktív chipek, Státusz picker, Taktika lista).
const név = (id: string) => ({ té_dobás: 'TÉ dobás', kezdeményezés: 'Kezdeményezés' }[id] ?? id);

describe('fmtHatás', () => {
  it('előny / hátrány: előjeles érték + cél', () => {
    expect(fmtHatás({ operátor: 'előny', cél: 'té_dobás', érték: 2 }, név)).toBe('Előny+2: TÉ dobás');
    expect(fmtHatás({ operátor: 'hátrány', cél: 'té_dobás', érték: -1 }, név)).toBe('Hátrány-1: TÉ dobás');
  });

  it('letilt / max_limit / arányos / enyhít', () => {
    expect(fmtHatás({ operátor: 'letilt', cél: 'kezdeményezés' }, név)).toBe('❌ Letiltva: Kezdeményezés');
    expect(fmtHatás({ operátor: 'max_limit', cél: 'té_dobás', érték: 5 }, név)).toBe('max 5: TÉ dobás');
    expect(fmtHatás({ operátor: 'arányos', cél: 'té_dobás', érték: 2 }, név)).toBe('×2: TÉ dobás');
    expect(fmtHatás({ operátor: 'enyhít', cél: 'té_dobás', érték: 1 }, név)).toBe('Enyhítés+1: TÉ dobás');
  });

  it('szöveges: a megjegyzés, üresnél null (nem jelenik meg)', () => {
    expect(fmtHatás({ operátor: 'szöveges', cél: 'x', megjegyzés: 'KM dönt' }, név)).toBe('KM dönt');
    expect(fmtHatás({ operátor: 'szöveges', cél: 'x' }, név)).toBeNull();
  });

  it('ismeretlen operátor: nem dob, olvasható fallback', () => {
    expect(fmtHatás({ operátor: 'valami_új', cél: 'té_dobás', érték: 3 }, név)).toBe('valami_új 3: TÉ dobás');
  });
});
