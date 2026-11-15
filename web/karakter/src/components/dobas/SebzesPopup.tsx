import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyLepteto } from './ElonyLepteto';
import { ForrasLista } from './ForrasLista';
import { ManualDicePicker } from './ManualDicePicker';
import { rollElőnyHátrányK20, type ProbaDobás, clampEHSzint } from '../../engine/dice';
import type { DobásHatás, SpBónusz } from '../../engine/harc/combat-roll-info';
import { netElőnySzint, sebzésPáncélDelta, célPáncélKategória, sebzésElőnyK20ból } from '../../engine/harc/combat-roll-info';
import type { Páncélosztály, SebzésjellegPáncélMátrix, FegyverExtraDef } from '../../engine/data-types';
import { ExtrakInfo } from './ExtrakInfo';
import type { ExtraKontextus } from '../../engine/extrak-info-calc';
import { aktívHatásokCélra, alkalmazEffektek } from '../../engine/extrak-effekt';
import { SP_NINCS } from '../../engine/data-types';
import './dobas.css';

/** Páncélosztály választó opciók (a mátrix 5 oszlopa) + megjelenítendő címke. */
const PÁNCÉLOSZTÁLYOK: { id: Páncélosztály; label: string; rövid: string }[] = [
  { id: 'csupasz', label: 'csupasz', rövid: 'csupasz' },
  { id: 'puha', label: 'puha', rövid: 'puha' },
  { id: 'bor', label: 'bőr', rövid: 'bőr' },
  { id: 'lanc', label: 'lánc', rövid: 'lánc' },
  { id: 'merev', label: 'pikkely/lemez', rövid: 'lemez' },
];

interface Props {
  /** Weapon SP from reactive engine */
  sp: number;
  /** Default Előny level (from TÉ/CÉ k20 roll: 16-19→1, 20→2, else 0) */
  defaultElőny: number;
  /** The actual TÉ/CÉ k20 roll value (for display) */
  téK20: number;
  /** Az aktív fegyvermód sebzéstípusa. `másodlagos` → passzív info-label + a hívó már −1 E/H-t adott. */
  sebzéstípus?: 'elsődleges' | 'másodlagos';
  /** Az aktív fegyvermód sebzésjellege (a páncélmátrix lookup kulcsa). */
  jelleg?: string;
  /** Sebzésjelleg × páncélosztály mátrix. Jelenléte kapcsolja be az „Ellenfél páncél" választót. */
  páncélMátrix?: SebzésjellegPáncélMátrix;
  /** Az aktív fegyver extráinak listája (`cél_páncél` SP-hatás kiértékeléséhez). */
  fegyverExtrák?: { id: string }[];
  /** Az összes fegyver-extra definíció (id → def). */
  extraDefs?: Record<string, FegyverExtraDef>;
  /** Harci kontextus az „Extrák" gomb auto-státuszához (a választott páncélosztály itt egészül ki). */
  extraKontextus?: ExtraKontextus;
  /** Active Előny/Hátrány effects on Sebzésdobás (informational) */
  sebzésHatások: DobásHatás[];
  /** Active static SP bonuses from taktikák (informational) */
  spBónuszok: SpBónusz[];
  /** Taktika notes relevant to sebzés (e.g. "Sebzés: 0") */
  megjegyzések: { forrás: string; szöveg: string }[];
  /** Hide the automatic SP bonuses list inside StatikusBonuszBtn (e.g. távharc) */
  /**
   * Kapcsolható SP-bónusz (pl. íj Erőbónusza, md/068_08): alapból BE (`felirat: +érték`, az SP-be és a bontásba kerül),
   * kattintásra KI (`kiFelirat`). `limitált`: a bónuszt egy limit vágta → vízszintes vonal az érték fölött.
   */
  kapcsolhatóSpBónusz?: { felirat: string; érték: number; kiFelirat: string; limitált?: boolean };
  /** Fegyver Átütés értéke (informatív kijelzés, ha > 0) */
  átütés?: number;
  /** Melee only (md/064_02_07): the target's VÉ drop on hit, shown next to the result. Omitted for ranged. */
  véCsökkenésTalálatnál?: number;
  /** `találat`: true only if the damage step was actually resolved (rolled, or a non-damaging weapon) - closing before the roll is not a recorded hit. */
  onClose: (spEredmény?: number, találat?: boolean) => void;
  /** ESC sebzésdobás ELŐTT: csak ez a popup zárul (vissza a hívó dobáshoz). Eredmény után (és nélküle) az ESC = onClose. */
  onEscape?: () => void;
}

interface SebzésEredmény {
  dobás: ProbaDobás;
  sp: number;
  bónusz: number;
  végső: number;
}

/** Sebzés overlay: Előny/Hátrány picker + SP bónusz grid + ellenfél páncél + k20 roll + info. */
export function SebzesPopup({ sp: spAlap, defaultElőny, téK20, sebzéstípus, jelleg, páncélMátrix, fegyverExtrák, extraDefs, extraKontextus, sebzésHatások, spBónuszok: spBónuszokAlap, megjegyzések, kapcsolhatóSpBónusz, átütés, véCsökkenésTalálatnál, onClose, onEscape }: Props) {
  // Raw (unclamped) combined value - includes TÉ k20 bonus + active effects.
  // A másodlagos sebzéstípus −1 E/H-ját a hívó (TamadoDobasPopup) már beépítette a defaultElőny-be.
  const baseRaw = defaultElőny + netElőnySzint(sebzésHatások);
  const [rawSzint, setRawSzint] = useState(baseRaw);
  const [bónusz, setBónusz] = useState(0);
  // Ellenfél páncélosztálya (a mátrix SP-delta lookup kulcsa). null = még nincs választva.
  const [páncél, setPáncél] = useState<Páncélosztály | null>(null);
  const [eredmény, setEredmény] = useState<SebzésEredmény | null>(null);
  const [kapcsolt, setKapcsolt] = useState(true);
  const kb = kapcsolt && kapcsolhatóSpBónusz ? kapcsolhatóSpBónusz : null;
  const sp = spAlap === SP_NINCS ? spAlap : spAlap + (kb?.érték ?? 0);
  const spBónuszok = kb ? [...spBónuszokAlap, { forrás: kb.felirat, érték: kb.érték }] : spBónuszokAlap;

  // SP_NINCS (-99) sentinel: a fegyver nem sebez (pl. Bola, Dobóháló, Lasszó, Fúvócső).
  // Korai kilépés (a hook-ok UTÁN, Rules of Hooks): a -99 SOHA nem kerül a delta/roll számításba.
  if (sp === SP_NINCS) {
    return (
      <PopupOverlay onClose={() => onClose(undefined, true)} onEscape={onEscape}>
        <div className="tamado-dobas-popup">
          <div className="ke-dobas-header">Sebzés</div>
          <div className="sebzes-nincs">Ez a fegyver nem sebez</div>
          {véCsökkenésTalálatnál != null && <div className="sebzes-ve-talalat">VÉ −{véCsökkenésTalálatnál}</div>}
        </div>
      </PopupOverlay>
    );
  }

  const aktuális = clampEHSzint(rawSzint);

  // Az „Extrák" gomb + effekt-motor kontextusa a választott ellenfél-páncél kategóriájával
  // kiegészítve (a cél_páncél feltételes extrák - pl. panceltalant/kopjas_roham - így teljesülnek).
  const extraKontextusPáncéllal: ExtraKontextus | undefined = extraKontextus && {
    ...extraKontextus,
    célPáncélKategória: páncél ? célPáncélKategória(páncél) : undefined,
  };

  // Ellenfél-páncéltól függő SP-delta: (1) sebzésjelleg×páncél mátrix + (2) az aktív SP-célú extrák
  // (§42.3 additív rész) - a teljes korreláció (ellenfél páncél) ismeretében, l. extrak-effekt.ts.
  const mátrixDelta = páncél && páncélMátrix ? sebzésPáncélDelta(páncélMátrix, jelleg, páncél) : 0;
  const spHatások = extraKontextusPáncéllal
    ? aktívHatásokCélra(fegyverExtrák, extraDefs, extraKontextusPáncéllal, 'SP')
    : [];
  const extraDelta = alkalmazEffektek(0, spHatások);
  const páncélDelta = mátrixDelta + extraDelta;
  const effektívSp = sp + páncélDelta;
  // A páncélválasztó kötelező (STUDY 3g): amíg jelen van a mátrix, de nincs választva
  // páncélosztály, a dobás blokkolva (rossz SP-eredményt adna a mátrix-lookup nélkül).
  const páncélKell = !!páncélMátrix && páncél === null;

  // E/H sources for the list under the stepper: the attack roll's k20 bonus, the secondary damage type
  // (both already part of defaultElőny, set by the caller) and the active Sebzés effects.
  const k20Előny = sebzésElőnyK20ból(téK20);
  const eHForrások: DobásHatás[] = [
    ...(k20Előny > 0 ? [{ forrás: `Támadó dobás (${téK20})`, cél: 'sebzésdobás' as const, operátor: 'előny' as const, érték: k20Előny }] : []),
    ...(sebzéstípus === 'másodlagos' ? [{ forrás: 'Másodlagos sebzéstípus', cél: 'sebzésdobás' as const, operátor: 'hátrány' as const, érték: 1 }] : []),
    ...sebzésHatások,
  ];

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(aktuális);
    setEredmény({ dobás, sp: effektívSp, bónusz, végső: dobás.eredmény + effektívSp + bónusz });
  }

  function handleManualK20(value: number) {
    const dobás: ProbaDobás = { rolls: [value], eredmény: value };
    setEredmény({ dobás, sp: effektívSp, bónusz, végső: value + effektívSp + bónusz });
  }

  function handleBónuszClick(val: number) {
    setBónusz(prev => prev === val ? 0 : val);
    setEredmény(null);
  }

  function handleSzintChange(newSzint: number) {
    // Manual chip click: set raw to the clicked value
    setRawSzint(newSzint);
    setEredmény(null);
  }

  return (
    <PopupOverlay onClose={() => onClose(eredmény?.végső, eredmény != null)} onEscape={eredmény ? undefined : onEscape}>
      <div className="tamado-dobas-popup">
        {eredmény && <button className="sebzes-reset-btn" onClick={() => setEredmény(null)}><Ikon név="reset" /></button>}
        {/* Header: title + (before the roll) the Fegyver extrák icon on the right */}
        <div className="dobas-fejlec">
          <div className="ke-dobas-header">Sebzés</div>
          {!eredmény && extraKontextusPáncéllal && (
            <ExtrakInfo fegyverExtrák={fegyverExtrák} extraDefs={extraDefs} kontextus={extraKontextusPáncéllal} ikon />
          )}
        </div>

        {!eredmény ? (
          <>
            {megjegyzések.length > 0 && (
              <div className="dobas-info-list dobas-notes">
                {megjegyzések.map((m, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge note">⚠</span>
                    <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Ellenfél páncélja: mandatory, inline segmented bar (the roll is blocked until chosen) */}
            {páncélMátrix && (
              <div className={`pancel-sav${páncélKell ? ' pancel-sav-kell' : ''}`}>
                <div className="pancel-sav-cim">
                  <span>Ellenfél páncélja</span>
                  {páncél === null
                    ? <span className="pancel-sav-valassz">válassz</span>
                    : <span className={páncélDelta > 0 ? 'pancel-valaszto-delta-pos' : páncélDelta < 0 ? 'pancel-valaszto-delta-neg' : ''}>SP {páncélDelta > 0 ? '+' : ''}{páncélDelta}</span>}
                </div>
                <div className="pancel-sav-gombok">
                  {PÁNCÉLOSZTÁLYOK.map(p => (
                    <button key={p.id} type="button" title={p.label} aria-pressed={páncél === p.id}
                      className={páncél === p.id ? 'active' : ''}
                      onClick={() => { setPáncél(p.id); setEredmény(null); }}>{p.rövid}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Formula: SP (+ all static bonuses) + k20; weapon damage type and Átütés under it */}
            <div>
              <div className="dobas-keplet">
                {effektívSp + bónusz}<span className="dobas-keplet-op"> + </span>k20
              </div>
              {/* Damage type · Átütés + the Bónusz pill on one line */}
              <div className="dobas-keplet-al-sor">
                {(jelleg || (átütés ?? 0) > 0) && (
                  <span className="dobas-keplet-al">{[jelleg, (átütés ?? 0) > 0 ? `Átütés ${átütés}` : null].filter(Boolean).join(' · ')}</span>
                )}
                <StatikusBonuszBtn bónusz={bónusz} spBónuszok={spBónuszok} onBónuszClick={handleBónuszClick} />
              </div>
            </div>

            {/* Switchable SP bonus pill (if any) above the E/H box; both share one column (the wider one sets the width) */}
            <div className="dobas-oszlop">
              {kapcsolhatóSpBónusz && kapcsolhatóSpBónusz.érték > 0 && (
                <div className="dobas-kapszulak">
                  <button type="button" className={`dobas-kapszula${kapcsolt ? ' sebzes-stat-pos' : ' dobas-kapszula-halvany'}`} aria-pressed={kapcsolt}
                    title={kapcsolhatóSpBónusz.limitált ? 'A fegyver Erőbónusz-limitje vágja' : undefined}
                    onClick={() => { setKapcsolt(v => !v); setEredmény(null); }}>
                    {kapcsolt
                      ? <>{kapcsolhatóSpBónusz.felirat} <span className={kapcsolhatóSpBónusz.limitált ? 'sebzes-limit-plafon' : undefined}>+{kapcsolhatóSpBónusz.érték}</span></>
                      : kapcsolhatóSpBónusz.kiFelirat}
                  </button>
                </div>
              )}
              <div className="elony-blokk">
                <ElonyLepteto szint={aktuális} onChange={handleSzintChange} />
                <ForrasLista hatások={eHForrások} szint={aktuális} alapSzint={clampEHSzint(baseRaw)} onVissza={() => { setRawSzint(baseRaw); setEredmény(null); }} />
              </div>
            </div>

            <div className="dobas-btn-row">
              <button className="tamado-sebzes-btn dobas-btn-ikon sebzes-dobas-btn" onClick={handleDobás} disabled={páncélKell}><Ikon név="kocka" méret={22} />Dobás</button>
              <ManualDicePicker link szint={aktuális} onSelect={handleManualK20} alapÉrték={effektívSp + bónusz} alapLabel="SP" disabled={páncélKell} />
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{eredmény.végső}<span className="sebzes-eredmeny-egyseg"> SP</span></div>
            <div className="ke-dobas-detail">
              k20{eredmény.dobás.rolls.length > 1
                ? ` [${eredmény.dobás.rolls.join(', ')}] → ${eredmény.dobás.eredmény}`
                : ` (${eredmény.dobás.eredmény})`}
              {' + '}SP ({eredmény.sp})
              {eredmény.bónusz !== 0 ? ` ${eredmény.bónusz > 0 ? '+' : ''}${eredmény.bónusz}` : ''}
            </div>
            {(átütés ?? 0) > 0 && <div className="sebzes-atutes-result">Átütés: {átütés}</div>}
            {véCsökkenésTalálatnál != null && <div className="sebzes-ve-talalat">VÉ −{véCsökkenésTalálatnál}</div>}
          </>
        )}
      </div>
    </PopupOverlay>
  );
}

// ─── Statikus bónusz gomb + popup ──────────────────────────────────────────

function StatikusBonuszBtn({ bónusz, spBónuszok, onBónuszClick }: {
  bónusz: number;
  spBónuszok: SpBónusz[];
  onBónuszClick: (val: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const fortélySum = spBónuszok.reduce((s, b) => s + b.érték, 0);
  const total = fortélySum + bónusz;
  const colorClass = total > 0 ? 'sebzes-stat-pos' : total < 0 ? 'sebzes-stat-neg' : '';

  return (
    <>
      {/* Pill: "+ Bónusz" at 0, else "Bónusz +N" (automatic + hand bonuses together) */}
      <button type="button" className={`dobas-kapszula${total === 0 ? ' dobas-kapszula-halvany' : ` ${colorClass}`}`} onClick={() => setOpen(true)}>
        {total === 0 ? '+ Bónusz' : `Bónusz ${total > 0 ? '+' : ''}${total}`}
      </button>
      {open && (
        <PopupOverlay onClose={() => setOpen(false)}>
          <div className="sebzes-stat-popup">
            <label className="harc-popup-label">Statikus SP bónuszok</label>
            <div className="sebzes-stat-list">
              <span className="sebzes-stat-manual-label">Automatikus bónuszok:</span>
              {spBónuszok.length > 0 ? spBónuszok.map((b, i) => (
                <div key={i} className="sebzes-stat-item">
                  <span className={b.érték > 0 ? 'sebzes-stat-pos' : 'sebzes-stat-neg'}>
                    {b.érték > 0 ? '+' : ''}{b.érték}
                  </span>
                  <span className="sebzes-stat-source">{b.forrás}</span>
                </div>
              )) : <span className="sebzes-stat-source">–</span>}
            </div>
            <div className="sebzes-stat-manual">
              <span className="sebzes-stat-manual-label">Kézi bónusz:</span>
              <div className="sebzes-stat-grid">
                {[-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6].map(v => (
                  <button key={v}
                    className={`sebzes-stat-circle${bónusz === v ? ' active' : ''}${v > 0 ? ' sebzes-stat-pos' : v < 0 ? ' sebzes-stat-neg' : ''}`}
                    onClick={() => { onBónuszClick(v); setOpen(false); }}>
                    {v > 0 ? `+${v}` : v === 0 ? '0' : v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
