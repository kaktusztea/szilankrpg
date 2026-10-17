import { describe, it, expect } from 'vitest';
import { isTaktikaAllowed, taktikaTiltásOka } from './taktika-megkotes';
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

/** Kitartott célzás `szűrő_harcmodorok: [íjászat, lövészet]` - csak íj/lőfegyverrel engedélyezett. */
describe('taktika megkötés: szűrő_harcmodorok (Kitartott célzás)', () => {
  const data = loadGameDataSync();
  const k = data.testKarakter;
  const íj = data.tavfegyverek.find(t => t.harcmodor === 'Íjászat');
  const hajító = data.tavfegyverek.find(t => t.harcmodor === 'Hajítás');

  const sessionFegyverrel = (tfNév: string) => ({
    ...k.session, aktív_taktikák: [], aktív_helyzetek: [], aktív_távfegyver_index: 0,
  });
  const karakterFegyverrel = (tfNév: string) => ({ ...k, távfegyverek: [{ alap: tfNév, idea: 0 }] });

  it('íjászat távfegyverrel engedélyezett', () => {
    expect(íj).toBeTruthy();
    const kk = karakterFegyverrel(íj!.név);
    expect(isTaktikaAllowed('Kitartott célzás', sessionFegyverrel(íj!.név) as typeof k.session, kk as typeof k, data)).toBe(true);
  });

  it('hajító távfegyverrel NEM engedélyezett (szűrő kiszűri)', () => {
    expect(hajító).toBeTruthy();
    const kk = karakterFegyverrel(hajító!.név);
    expect(isTaktikaAllowed('Kitartott célzás', sessionFegyverrel(hajító!.név) as typeof k.session, kk as typeof k, data)).toBe(false);
  });

  // Regresszió: a Kitartott célzás kombó_mód=whitelist, kombó_lista=[] (nem kombózható mással).
  // Ha MÁR aktív (useTaktikaInvalidation hívja rá az isTaktikaAllowed-ot), önmaga jelenléte NEM
  // buktathatja - különben betöltéskor kiesne és a CÉ-bónusz elveszne.
  it('már aktív, whitelist-üres taktika önmaga jelenlétében is engedélyezett (invalidáció no-op)', () => {
    const kk = karakterFegyverrel(íj!.név);
    const session = { ...k.session, aktív_taktikák: [{ név: 'Kitartott célzás' }], aktív_helyzetek: [], aktív_távfegyver_index: 0 };
    expect(isTaktikaAllowed('Kitartott célzás', session as typeof k.session, kk as typeof k, data)).toBe(true);
  });
});

/** taktikaTiltásOka: a toggle-picker letiltott soraihoz - ha tiltott, legyen ok; ha engedélyezett, null.
 * Konzisztens az isTaktikaAllowed-dal (ugyanazok az ágak). */
describe('taktikaTiltásOka', () => {
  const data = loadGameDataSync();
  const k = data.testKarakter;
  const üresSession = { ...k.session, aktív_taktikák: [], aktív_helyzetek: [] };

  it('helyzet-szükséges taktika ok-ot ad üres helyzetnél, de engedélyezve null', () => {
    const tiltott = !isTaktikaAllowed('(Lég)Lovas roham', üresSession as typeof k.session, k, data);
    const ok = taktikaTiltásOka('(Lég)Lovas roham', üresSession as typeof k.session, k, data);
    // Ha a testKarakter-nél tiltott (nincs lovas helyzet), legyen értelmes ok; különben null.
    expect(tiltott ? (ok && ok.includes('helyzet')) : ok === null).toBeTruthy();
  });

  it('engedélyezett taktikára null az ok', () => {
    // A "Támadó" alap taktika megkötés nélkül - üres session-ben engedélyezett.
    if (isTaktikaAllowed('Támadó', üresSession as typeof k.session, k, data)) {
      expect(taktikaTiltásOka('Támadó', üresSession as typeof k.session, k, data)).toBeNull();
    }
  });

  it('az ok megléte ⇔ a taktika tiltott (allow-fn-nel konzisztens)', () => {
    for (const név of ['(Lég)Lovas roham', '(Lég)Lovas támadás galoppból', '1 támadás', 'Támadó', 'Védő']) {
      if (!data.taktikak.some(t => t.név === név)) continue;
      const engedélyezett = isTaktikaAllowed(név, üresSession as typeof k.session, k, data);
      const ok = taktikaTiltásOka(név, üresSession as typeof k.session, k, data);
      expect(engedélyezett).toBe(ok === null);
    }
  });
});
