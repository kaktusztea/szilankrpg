import { describe, it, expect } from 'vitest';
import { mondatokraTörve } from './TaktikaTiltvaInfoPopup';

describe('mondatokraTörve', () => {
  it('a "Nem támad, hátrál. VÉ csökk ellenfélnek: 1+k20P." szöveg 2 mondatra törik', () => {
    expect(mondatokraTörve('Nem támad, hátrál. VÉ csökk ellenfélnek: 1+k20P.')).toEqual([
      'Nem támad, hátrál.',
      'VÉ csökk ellenfélnek: 1+k20P.',
    ]);
  });

  it('egymondatos szöveg → 1 elem', () => {
    expect(mondatokraTörve('Egyetlen mondat.')).toEqual(['Egyetlen mondat.']);
  });

  it('üres szöveg → üres lista', () => {
    expect(mondatokraTörve('')).toEqual([]);
  });

  it('záró pont nélküli utolsó mondat is pontot kap', () => {
    expect(mondatokraTörve('Első. Második')).toEqual(['Első.', 'Második.']);
  });
});
