import { describe, it, expect } from 'vitest';
import { isTaktikaAllowed } from './taktika-megkotes';
import { harcFejlécÉrtékek } from '../harc/harc-fejlec-calc';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

/** „1 támadás" taktika: `támadások min 2` - a Harc fül aktív fegyverének támadásszáma dönt (rules.json fegyver_támadások). */
describe('taktika megkötés: támadások min', () => {
  const data = loadGameDataSync();
  const k = data.testKarakter;
  const támadások = (gy: number) => {
    const kk = { ...k, tulajdonságok: { ...k.tulajdonságok, gyorsaság: gy } };
    return { kk, n: harcFejlécÉrtékek(data, kk, kk.session).ctx!.result.támadások };
  };
  it('a Gyorsaság (harckeret) is számít, nem csak a harcmodor szint', () => {
    const lassú = támadások(-5), gyors = támadások(20);
    expect(gyors.n).toBeGreaterThan(lassú.n);
  });
  it('engedélyezett ⇔ a Harc fül támadásszáma ≥ 2', () => {
    for (const gy of [-5, 7, 20]) {
      const { kk, n } = támadások(gy);
      expect(isTaktikaAllowed('1 támadás', kk.session, kk, data)).toBe(n >= 2);
    }
  });
});
