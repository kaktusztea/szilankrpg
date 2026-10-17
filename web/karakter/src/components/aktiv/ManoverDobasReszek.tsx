import type { Dispatch, SetStateAction } from 'react';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { ModositoTabla } from '../../engine/data-types';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { rollElőnyHátrányDie, type ProbaDobás } from '../../engine/dice';
import {
  type Mód, type ManőverDef, type AktívFegyverInfo,
  követelményTeljesül, követelményJelölés, követelményCimke, getFázisFelirat, fázisCselekvő, eredményHatás,
  szitFeltételTeljesül, aktívFegyverNév,
} from './manover-dobas-calc';

export type KövetelményDöntés = 'pending' | 'mind' | 'normál' | 'erős';
export type Végeredmény = 'folyamatban' | 'sikeres' | 'sikertelen';

/** Előjeles szám-felirat ("+2", "-1", "0"). */
const előjeles = (n: number) => `${n > 0 ? '+' : ''}${n}`;

/** Dobó-sor (Dobás gomb + kézi 🎲), vagy az eredmény „alap + kocka = összeg" alakban (katt = újradobás). */
export function ManoverDobasSor({ alap, alapLabel, kocka, szint, dobás, setDobás }: {
  alap: number; alapLabel: string; kocka: number; szint: number;
  dobás: ProbaDobás | null; setDobás: (d: ProbaDobás | null) => void;
}) {
  if (!dobás) {
    return (
      <div className="dobas-btn-row">
        <button type="button" className="tamado-dobas-btn" onClick={() => setDobás(rollElőnyHátrányDie(szint, kocka))}>Dobás</button>
        <ManualDicePicker sides={kocka} szint={szint} onSelect={v => setDobás({ rolls: [v], eredmény: v })} alapÉrték={alap} alapLabel={alapLabel} />
      </div>
    );
  }
  return (
    <button type="button" className="manover-dobas-eredmeny" onClick={() => setDobás(null)} aria-label="Dobás törlése, újradobás">
      <span className="ke-dobas-result">{alap + dobás.eredmény}</span>
      <span className="ke-dobas-detail">
        {alapLabel} ({alap}) + k{kocka}{dobás.rolls.length > 1 ? ` [${dobás.rolls.join(', ')}] → ${dobás.eredmény}` : ` (${dobás.eredmény})`} ↺
      </span>
    </button>
  );
}

/** 0. lépés: követelmények listája + KM döntés (Teljesül mind / Normál hiány / Erős hiány). */
export function ManoverKovetelmenyLepes({ követelmények, karakter, data, session, aktívFegyver, döntés, setDöntés, kész, erősHiány, normálHiány, vanNormál, vanErős }: {
  követelmények: NonNullable<ManőverDef['követelmények']>;
  karakter: Karakter; data: GameData; session: Session; aktívFegyver: AktívFegyverInfo | null;
  döntés: KövetelményDöntés; setDöntés: (d: KövetelményDöntés) => void; kész: boolean;
  /** Gépileg megállapított hiányok (Erős → auto-kudarc; Normál → a "Teljesül mind" tiltva). */
  erősHiány: boolean; normálHiány: boolean;
  vanNormál: boolean; vanErős: boolean;
}) {
  return (
    <div className={`manover-kov-lepes${kész ? ' manover-fazis-done' : ' manover-fazis-aktiv'}`}>
      <div className="manover-fazis-label">Követelmények</div>
      <div className="manover-kov-lista">
        {követelmények.map((köv, i) => {
          // Gépileg eldöntetlen (null) sor a KM döntése UTÁN tükrözze a döntést.
          const jelölés = követelményJelölés(követelményTeljesül(köv, karakter, data, session, aktívFegyver), köv.erősség, döntés);
          return (
            <div key={i} className="manover-kov-sor">
              <span className={`manover-kov-erosseg manover-kov-${köv.erősség}`}>{köv.erősség === 'erős' ? '🟥' : '🟨'}</span>
              <span className="manover-kov-cimke">{követelményCimke(köv)}</span>
              {jelölés === '✓' && <span className="manover-fazis-ok">✓</span>}
              {jelölés === '✗' && <span className="manover-fazis-fail">✗</span>}
              {jelölés === '?' && <span className="manover-kov-info">?</span>}
            </div>
          );
        })}
      </div>
      {erősHiány
        ? <div className="manover-kov-auto-fail">Erős követelmény hiányzik - a manőver nem kísérelhető meg.</div>
        : !kész && (
          <div className="manover-fazis-chips">
            <button type="button" className="manover-chip manover-chip-igen" disabled={normálHiány} onClick={() => setDöntés('mind')}>Teljesül mind</button>
            {vanNormál && <button type="button" className="manover-chip manover-chip-normal" onClick={() => setDöntés('normál')}>Normál hiány</button>}
            {vanErős && <button type="button" className="manover-chip manover-chip-nem" onClick={() => setDöntés('erős')}>Erős hiány</button>}
          </div>
        )}
    </div>
  );
}

/**
 * Az aktív fázis siker / kudarc gombjai. Szín az ALKALMAZÓ szempontjából: aktívban a manőver-siker jó (zöld),
 * passzívban ÉN védekezem, így a manőver-siker nekem ROSSZ (piros).
 */
export function ManoverFazisChipek({ fázis, mód, manőver, biztosRontás, onSiker }: {
  fázis: 'M' | 'V' | 'E'; mód: Mód; manőver: ManőverDef;
  /** 99 sentinel (aktív E fázis): a siker gomb eltűnik, a Manőver ezekkel a körülményekkel nem sikerülhet. */
  biztosRontás: boolean;
  onSiker: (siker: boolean) => void;
}) {
  // ellenpróba_bünteti + E: a rontott dobás is sikeres manőver (csak büntetés) - saját feliratok.
  const felirat = manőver.ellenpróba_bünteti && fázis === 'E'
    ? (mód === 'passzív'
      ? { siker: 'Átjutott', kudarc: 'Megcsapkodod (1x)' }
      : { siker: 'Sikeres', kudarc: 'Rontott (megcsapkodnak)' })
    : getFázisFelirat(fázis, mód, fázisCselekvő(fázis, manőver.fázis_cselekvő));
  const sikerZöld = mód !== 'passzív';
  return (
    <div className="manover-fazis-chips">
      {!biztosRontás && <button type="button" className={`manover-chip ${sikerZöld ? 'manover-chip-igen' : 'manover-chip-nem'}`} onClick={() => onSiker(true)}>{felirat.siker}</button>}
      <button type="button" className={`manover-chip ${sikerZöld ? 'manover-chip-nem' : 'manover-chip-igen'}`} onClick={() => onSiker(false)}>{felirat.kudarc}</button>
    </div>
  );
}

/** Végeredmény-sáv (sikeres / sikertelen / büntetve) + a hatás-mondatok. */
export function ManoverVegeredmeny({ végeredmény, mód, manőver, büntetve, immunisLeírás }: {
  végeredmény: Exclude<Végeredmény, 'folyamatban'>; mód: Mód; manőver: ManőverDef;
  /** Bünteti-manőver sikeres, de rontott ellenpróbával (SÁRGA átmeneti állapot). */
  büntetve: boolean;
  immunisLeírás: string | null;
}) {
  const passzív = mód === 'passzív';
  const sikeres = végeredmény === 'sikeres';
  const osztály = büntetve ? 'manover-veg-buntetve' : sikeres !== passzív ? 'manover-veg-sikeres' : 'manover-veg-sikertelen';
  const felirat = büntetve
    ? (passzív ? '⚠ Átjutott, de megcsaptad (1x)' : '⚠ Sikeres, de megcsaptak (1x)')
    : sikeres
      ? (passzív ? '✓ Manőver sikeres ellened' : '✓ Manőver sikeres')
      : (passzív ? '✗ Manőver sikertelen ellened' : '✗ Manőver sikertelen');
  return (
    <div className={`manover-dobas-veg ${osztály}`} role="status">
      {felirat}
      {immunisLeírás && (
        <div className="manover-dobas-hatas"><div className="manover-dobas-hatas-mondat">{immunisLeírás}</div></div>
      )}
      {sikeres && (
        <div className="manover-dobas-hatas">
          {eredményHatás(passzív ? manőver.hatás.passzív : manőver.hatás.aktív).map((mondat, i) => (
            <div key={i} className="manover-dobas-hatas-mondat">{mondat}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Helyzetfüggő módosítók picker (single: kategóriánként egy sor; multi: soronként kapcsoló). */
export function ManoverSzitPicker({ táblák, szitMods, setSzitMods, multiMods, setMultiMods, összeg, karakter, session, data, onClose }: {
  táblák: ModositoTabla[];
  szitMods: Record<string, number>; setSzitMods: Dispatch<SetStateAction<Record<string, number>>>;
  multiMods: Record<string, boolean[]>; setMultiMods: Dispatch<SetStateAction<Record<string, boolean[]>>>;
  összeg: number; karakter: Karakter; session: Session; data: GameData; onClose: () => void;
}) {
  const sentinel = data.konstansok.manőver.sentinel_nem_kísérelhető;
  return (
    <PopupOverlay className="kep-prompt kep-proba-szit-popup" onClose={onClose}>
      <label className="kep-prompt-label-bold-mb">Helyzetfüggő módosítók</label>
      <div className="kep-proba-szit-body">
        {táblák.map(t => (
          <div key={t.kategória} className="kep-proba-szit-cat">
            <span className="kep-proba-szit-label">{t.kategória}</span>
            <div className="kep-proba-szit-items">
              {t.sorok.map((s, i) => {
                const isMulti = t.mód === 'multi';
                const aktív = isMulti ? !!multiMods[t.kategória]?.[i] : szitMods[t.kategória] === i;
                const kattintás = isMulti
                  ? () => setMultiMods(m => ({ ...m, [t.kategória]: m[t.kategória].map((v, j) => j === i ? !v : v) }))
                  : () => setSzitMods(m => ({ ...m, [t.kategória]: m[t.kategória] === i ? -1 : i }));
                // Fegyver-extrából feloldott sor: a fegyvernév CSAK akkor jelenik meg zárójelben, ha az aktív
                // fegyver ténylegesen hordozza az extrát - "Fegyver extra: Pontos (Tőrkard)".
                const extraMatch = s.feltétel?.startsWith('fegyver_extra:') && szitFeltételTeljesül(s.feltétel, karakter, session, data);
                const fegyverNév = extraMatch ? aktívFegyverNév(karakter, session, data) : null;
                // A sentinel (99) NEM dobásmódosító, hanem „nem kísérelhető meg" jelző → tiltó (piros) ✖.
                const isSentinel = s.érték === sentinel;
                const színClass = isSentinel || s.érték < 0 ? ' kep-proba-szit-neg' : s.érték > 0 ? ' kep-proba-szit-pos' : '';
                return (
                  <button type="button" key={i} aria-pressed={aktív}
                    className={`kep-proba-szit-item${aktív ? ' kep-proba-szit-item-active' : ''}${színClass}`} onClick={kattintás}>
                    <span className="kep-proba-szit-val">{isSentinel ? '✖' : előjeles(s.érték)}</span>
                    <span className="kep-proba-szit-desc">{fegyverNév ? `${s.leírás} (${fegyverNév})` : s.leírás}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {összeg !== 0 && (
        <div className={`kep-proba-szit-sum-footer${összeg > 0 ? ' kep-proba-szit-pos' : ' kep-proba-szit-neg'}`}>Összesen: {előjeles(összeg)}</div>
      )}
    </PopupOverlay>
  );
}

/** MP-választó (0 … max), kiválasztás = bezárás. */
export function ManoverMpPicker({ költött, max, onSelect, onClose }: { költött: number; max: number; onSelect: (n: number) => void; onClose: () => void }) {
  return (
    <PopupOverlay onClose={onClose}>
      <label className="kep-prompt-label-bold-mb">MP használata</label>
      <div className="kep-prompt-flex-fok">
        {Array.from({ length: max + 1 }, (_, n) => (
          <button type="button" key={n} className={`fort-fok-btn${költött === n ? ' active' : ''}`} aria-pressed={költött === n}
            onClick={() => { onSelect(n); onClose(); }}>{n === 0 ? '0' : `+${n}`}</button>
        ))}
      </div>
    </PopupOverlay>
  );
}

/** Manőver TÉ módosító infó (Végrehajtás fázis). */
export function ManoverTePopup({ módosító, standard, aktívTÉ, onClose }: { módosító: number; standard: number; aktívTÉ: number | null; onClose: () => void }) {
  return (
    <PopupOverlay className="kep-prompt manover-te-popup" onClose={onClose}>
      <label className="kep-prompt-label-bold-mb">Manőver TÉ módosító</label>
      <div className="manover-te-body">
        {módosító > 0 ? (
          <div className="manover-te-row">
            <span className="manover-te-src">Végrehajtás fázis (standard)</span>
            <span className="manover-te-val manover-szit-pos">+{módosító}</span>
          </div>
        ) : (
          <div className="manover-te-none">
            Ennél a manővernél <strong>nincs</strong> a szokásos <strong>+{standard} TÉ</strong> a Végrehajtásra - sima támadást dobsz.
          </div>
        )}
      </div>
      <div className="manover-te-sum">TÉ összesen: <strong>{(aktívTÉ ?? 0) + módosító}</strong></div>
    </PopupOverlay>
  );
}
