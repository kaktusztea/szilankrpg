import { describe, it, expect } from 'vitest';
import type { FegyverAlap, Karakter } from './types';
import { calcKétkezesHarc } from './ketkezes';

// Minimal weapon defs — only the fields calcKétkezesHarc reads.
// Fegyverhossz: v2 skála (egész kategóriák, 0-12) — kard=3 (pl. Kard, lovag), tőr=1.
const kard = {
  név: 'Kard', kategória: 'kardvívó', fegyverhossz: 3,
  módok: [{ aktor: 'kard', jelleg: 'vágás', sebzéstípus: 'elsődleges', TÉ: 3, VÉ: 2, SP: 2, Átütés: 0, Sebesség: 4, Forgatás: 'egykezes', Erőlimit: 99, FP: false }],
} as unknown as FegyverAlap;
const tőr = {
  név: 'Tőr', kategória: 'kardvívó', fegyverhossz: 1,
  módok: [{ aktor: 'tőr', jelleg: 'szúrás', sebzéstípus: 'elsődleges', TÉ: 1, VÉ: 1, SP: 1, Átütés: 0, Sebesség: 5, Forgatás: 'egykezes', Erőlimit: 99, FP: false }],
} as unknown as FegyverAlap;

const karakter = {
  tulajdonságok: { erő: 5, ügyesség: 4, gyorsaság: 3 },
  HM_TÉ: 1, HM_VÉ: 1,
  fortélyok: [],           // no Kétkezes harc → khFok 0 (Alapeset)
  képzettségek: [{ név: 'Kardvívás', szint: 4 }],
} as unknown as Karakter;

const konstansok = {
  kétkezes_harc_max_fegyverméret: 6,
  kétkezes_harc_max_egy_fegyver: 3,
  kétkezes_harc_fegyverlevonás_osztó: 2,
  kétkezes_harc_bónuszok: [{ fok: 0, harckeret: 0, TÉ: 0, VÉ: 0, mindkét_fegyver_értékei: false, mf: 'nincs' }],
  mesterfegyver_bónuszok: [{ fok: 0, TÉ: 0, VÉ: 0, SP: 0 }],
  fegyver_kategória_harcmodor: { kardvívó: 'Kardvívás' },
  harcérték_alap: { TÉ: 10, VÉ: 10 },
};

const baseInput = {
  jobbFp: { alap: 'Kard' },
  balFp: { alap: 'Tőr' },
  fegyverek: [kard, tőr],
  karakter,
  konstansok,
  harcmodorBonusz: [{ szint: 4, TÉ: 2, VÉ: 2 }],
  fortelyMods: { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 },
};

describe('calcKétkezesHarc', () => {
  it('computes combined values for a valid two-weapon setup (Alapeset, no MF)', () => {
    const r = calcKétkezesHarc(baseInput)!;
    expect(r).not.toBeNull();
    // TÉ = 10 + (5+4+3) + HM_TÉ 1 + hb 2 + alap_TÉ 3 = 28
    expect(r.TÉ).toBe(28);
    // VÉ = 10 + (3+4) + HM_VÉ 1 + hb 2 + alap_VÉ 2 = 22
    expect(r.VÉ).toBe(22);
    // SP = kard SP 2 + erőbónusz min(5,∞) 5 = 7
    expect(r.SP).toBe(7);
    // sumFh = 3+1 = 4; fegyverlevonás = floor(4/2) = 2
    // harckeret = max(0, szint 4 + gyo 3 - 2) = 5; sebesség 4 → 1 + floor(5/4) = 2
    expect(r.harckeret).toBe(5);
    expect(r.támadások).toBe(2);
    expect(r.fegyver_név).toBe('Kard + Tőr');
    expect(r.sumFegyverhossz).toBe(4);
    expect(r.fegyverhossz).toBe(3);
    expect(r.jelleg).toBe('vágás'); // jobb (kard) sebez
  });

  it('returns null when a weapon is not found', () => {
    expect(calcKétkezesHarc({ ...baseInput, jobbFp: { alap: 'nincsilyen' } })).toBeNull();
  });

  it('returns null when the summed weapon length exceeds the limit', () => {
    // kard 3 + tőr 1 = 4; per-fegyver oké (3≤3, 1≤3), de a sum-limit 3 alá esik → null
    expect(calcKétkezesHarc({ ...baseInput, konstansok: { ...konstansok, kétkezes_harc_max_fegyverméret: 3 } })).toBeNull();
  });

  it('returns null when a single weapon exceeds the per-weapon limit (even if the sum fits)', () => {
    // nagyKard fegyverhossz 4 > max_egy_fegyver 3; tőrrel a sum 5 ≤ max_fegyverméret 6 (beleférne)
    const nagyKard = { ...kard, név: 'Nagy kard', fegyverhossz: 4 } as unknown as FegyverAlap;
    const input = {
      ...baseInput,
      jobbFp: { alap: 'Nagy kard' }, balFp: { alap: 'Tőr' },
      fegyverek: [nagyKard, tőr],
    };
    expect(calcKétkezesHarc(input)).toBeNull(); // a 4-es fegyver a per-fegyver limit miatt tiltott
  });
});
