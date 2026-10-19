import { describe, it, expect } from 'vitest';
import { fejlécChip } from './manover-dobas-calc';

describe('fejlécChip (fázis-tudatos VÉ/TÉ a manőver-popup fejlécében)', () => {
  it('passzív mód: mindig VÉ', () => {
    expect(fejlécChip('passzív', 'V', ['V', 'E'])).toBe('VÉ');
    expect(fejlécChip('passzív', 'M', ['M', 'V', 'E'])).toBe('VÉ');
    expect(fejlécChip('passzív', null, ['V', 'E'])).toBe('VÉ');
  });

  it('aktív mód, V/E fázis: TÉ', () => {
    expect(fejlécChip('aktív', 'V', ['V', 'E'])).toBe('TÉ');
    expect(fejlécChip('aktív', 'E', ['V', 'E'])).toBe('TÉ');
  });

  it('aktív mód, Megakasztás (M) fázis: VÉ (az ellenfél támad a VÉ-d ellen)', () => {
    expect(fejlécChip('aktív', 'M', ['M', 'V', 'E'])).toBe('VÉ');
  });

  it('aktív mód, nincs aktív fázis: a manőver M-tartalma dönt', () => {
    expect(fejlécChip('aktív', null, ['M', 'V', 'E'])).toBe('VÉ');
    expect(fejlécChip('aktív', null, ['V', 'E'])).toBe('TÉ');
    expect(fejlécChip('aktív', null, ['E'])).toBe('TÉ');
  });
});
