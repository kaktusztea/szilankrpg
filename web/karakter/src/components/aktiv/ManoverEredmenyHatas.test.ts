import { describe, it, expect } from 'vitest';
import { eredményHatás } from './manover-dobas-calc';

describe('eredményHatás (C2 - sikeres-box szűrés)', () => {
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

/**
 * A popup a mód szerinti hatás-nézőpontot jeleníti: `mód === 'passzív' ? hatás.passzív : hatás.aktív`,
 * majd a sikeres-box szűrés (`eredményHatás`). Regresszió: passzív módban NE az aktív ("Ellenfél
 * fegyvere kiesik") szöveg jelenjen meg, hanem a passzív ("A fegyvered kiesik a kezedből").
 */
describe('mód szerinti hatás-nézőpont', () => {
  const hatás = {
    aktív: ['Ellenfél fegyvere kiesik a kezéből.'],
    passzív: ['A fegyvered kiesik a kezedből.'],
  };
  const megjelenített = (mód: 'aktív' | 'passzív') =>
    eredményHatás(mód === 'passzív' ? hatás.passzív : hatás.aktív);

  it('aktív mód → az alkalmazó szemszöge', () => {
    expect(megjelenített('aktív')).toEqual(['Ellenfél fegyvere kiesik a kezéből.']);
  });
  it('passzív mód → az elszenvedő szemszöge (nem az aktív szöveg)', () => {
    expect(megjelenített('passzív')).toEqual(['A fegyvered kiesik a kezedből.']);
  });
});
