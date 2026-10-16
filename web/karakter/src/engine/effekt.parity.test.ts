/**
 * Paritás-háló (engine_spec §42.5, 3. fázis előfeltétele): az új effekt-gyűjtő + kiértékelő célonként
 * UGYANAZT adja-e, mint a régi `calcFortelyMods` / `calcTaktikaMods`. Valós adaton fut (data/tables),
 * a teszt-karaktereken + egy "minden fortély minden fokon" szintetikus karakteren, sok session-variánssal.
 * A régi függvények törlésekor (3. fázis vége) ez a fájl is törölhető.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { useHarcComputed } from '../components/harc/useHarcComputed';
import { gyűjtFortélyEffektek, gyűjtTaktikaEffektek, értékCélra, arányÖsszeg } from './effekt';
import type { Karakter, Session } from './types';

const data = loadGameDataSync();
const OLVASOTT_FORTÉLY_KULCSOK = ['KÉ', 'TÉ', 'VÉ', 'SP', 'CÉ', 'harckeret', 'SFÉ', 'fegyverhossz', 'SP_erőbónusz_arány'];
const karakterJson = (f: string): Karakter =>
  JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter', f), 'utf-8'));

function mindenFortély(alap: Karakter, fokIndex: number): Karakter {
  const fortélyok = data.fortelySummaries.flatMap(fd => {
    const fokok = fd.fokok.map(f => f.fok).filter(f => f >= 1);
    const fok = fokok[Math.min(fokIndex, fokok.length - 1)];
    return fok ? [{ név: fd.név, fok, spec_típus: '', spec_elem: '' }] : [];
  });
  return { ...alap, fortélyok } as Karakter;
}

function sessionVariánsok(base: Session): Session[] {
  const ki: Session[] = [base, { ...base, aktív_taktikák: [], aktív_helyzetek: [] }];
  for (const t of data.taktikak) {
    const fokok = t.fokozatos ? [1, 2, 3, 5] : [undefined];
    for (const fok of fokok) ki.push({ ...base, aktív_taktikák: [{ név: t.név, ...(fok ? { fok } : {}) }] } as Session);
  }
  for (const h of data.harciHelyzetek) ki.push({ ...base, aktív_taktikák: [], aktív_helyzetek: [h.név] });
  // ±10 VÉ plafon: két VÉ-növelő taktika együtt
  ki.push({ ...base, aktív_taktikák: [{ név: 'Teljes Védekezés' }, { név: 'Védő', fok: 3 }] } as Session);
  return ki;
}

describe('effekt-gyűjtő ↔ calcFortelyMods / calcTaktikaMods paritás', () => {
  const alapok = ['test_karakter2.json', 'test_karakter3.json'].map(karakterJson);
  const karakterek: [string, Karakter][] = [
    ...alapok.map((k, i) => [`teszt${i + 2}`, k] as [string, Karakter]),
    ...[0, 1, 2].map(i => [`minden fortély (fok-index ${i})`, mindenFortély(alapok[0], i)] as [string, Karakter]),
  ];

  for (const [címke, k] of karakterek) {
    it(`${címke}: minden session-variánsban azonos`, () => {
      let esetek = 0; let nemNullaF = 0; let nemNullaT = 0; let plafon = false;
      for (const session of sessionVariánsok(k.session)) {
        const sk = { ...k, session };
        const hc = useHarcComputed(data, sk, session);
        const aktívF = hc.extraKontextus.aktívFeltételek;

        const fEff = gyűjtFortélyEffektek(sk, session, data, aktívF, hc.feltételTeljesül);
        // A calcFortelyMods induló kulcsai = amit a fogyasztók olvasnak. (A régi fn minden más flat célt is
        // összead - alcéltól függetlenül, pl. "tulajdonságpróba" - de azokat semmi nem olvassa.)
        for (const cél of OLVASOTT_FORTÉLY_KULCSOK) {
          const régi = hc.fortelyMods[cél] ?? 0;
          if (régi) nemNullaF++;
          const új = cél === 'SP_erőbónusz_arány' ? arányÖsszeg(fEff, 'SP', 'erőbónusz') : értékCélra(fEff, cél);
          expect({ címke, taktikák: session.aktív_taktikák, helyzetek: session.aktív_helyzetek, cél, új })
            .toEqual({ címke, taktikák: session.aktív_taktikák, helyzetek: session.aktív_helyzetek, cél, új: régi });
        }

        const tEff = gyűjtTaktikaEffektek(session, data, sk, hc.feltételTeljesül);
        for (const [cél, régi] of Object.entries(hc.taktikaMods)) {
          if (régi) nemNullaT++;
          if (cél === 'VÉ' && Math.abs(régi) === data.konstansok.taktika_vé_eltolás_limit) plafon = true;
          expect({ címke, taktikák: session.aktív_taktikák, cél, új: értékCélra(tEff, cél) })
            .toEqual({ címke, taktikák: session.aktív_taktikák, cél, új: régi });
        }
        esetek++;
      }
      expect(esetek).toBeGreaterThan(50);
      // A háló ne üresen teljesüljön: legyen valódi (nem-nulla) összevetés, és érje el a ±10 VÉ plafont.
      expect(nemNullaF).toBeGreaterThan(0);
      expect(nemNullaT).toBeGreaterThan(20);
      expect(plafon).toBe(true);
    });
  }
});
