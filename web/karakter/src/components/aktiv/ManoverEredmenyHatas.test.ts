import { describe, it, expect } from 'vitest';
import { eredményHatás } from './manover-dobas-calc';

describe('eredményHatás (C2 — sikeres-box szűrés)', () => {
  it('kiszűri a "Sikertelen:" kezdetű sort', () => {
    expect(eredményHatás(['Kilépés a harcból.', 'Sikertelen: ellenfelek Megakasztás támadást kapnak.']))
      .toEqual(['Kilépés a harcból.']);
  });
  it('a nem-kudarc sorokat megtartja', () => {
    expect(eredményHatás(['Ellenfél földre kerül.', 'Felállás: Felállás földről manőver.']))
      .toEqual(['Ellenfél földre kerül.', 'Felállás: Felállás földről manőver.']);
  });
  it('"Kudarc" prefix is kiszűrődik', () => {
    expect(eredményHatás(['Kudarc esetén elesel.'])).toEqual([]);
  });
  it('"Feltétel:" prefix kiszűrődik (meta/követelmény sor)', () => {
    expect(eredményHatás(['Sikernél a lovas földre kerül.', 'Feltétel: GYALOGOS végzi lovas ellen.']))
      .toEqual(['Sikernél a lovas földre kerül.']);
  });
});
