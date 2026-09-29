import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from './ElonyPicker';
import { ManualDicePicker } from './ManualDicePicker';
import { rollElőnyHátrányK20, type ProbaDobás, clampEHSzint } from '../../engine/dice';
import type { DobásHatás, SpBónusz } from './combat-roll-info';
import { netElőnySzint, sebzésPáncélDelta, célPáncélSpDelta, célPáncélKategória } from './combat-roll-info';
import type { Páncélosztály, SebzésjellegPáncélMátrix, FegyverExtraDef } from '../../engine/data-types';
import { HatasokInfo } from './HatasokInfo';
import { ExtrakInfo } from './ExtrakInfo';
import type { ExtraKontextus } from './extrak-info-calc';

/** Páncélosztály választó opciók (a mátrix 5 oszlopa) + megjelenítendő címke. */
const PÁNCÉLOSZTÁLYOK: { id: Páncélosztály; label: string }[] = [
  { id: 'csupasz', label: 'csupasz' },
  { id: 'puha', label: 'puha' },
  { id: 'bor', label: 'bőr' },
  { id: 'lanc', label: 'lánc' },
  { id: 'merev', label: 'pikkely/lemez' },
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
  hideAutoBónusz?: boolean;
  /** Fegyver Átütés értéke (informatív kijelzés, ha > 0) */
  átütés?: number;
  onClose: (spEredmény?: number) => void;
}

interface SebzésEredmény {
  dobás: ProbaDobás;
  sp: number;
  bónusz: number;
  végső: number;
}

/** Sebzés overlay: Előny/Hátrány picker + SP bónusz grid + ellenfél páncél + k20 roll + info. */
export function SebzesPopup({ sp, defaultElőny, téK20, sebzéstípus, jelleg, páncélMátrix, fegyverExtrák, extraDefs, extraKontextus, sebzésHatások, spBónuszok, megjegyzések, hideAutoBónusz, átütés, onClose }: Props) {
  // Raw (unclamped) combined value - includes TÉ k20 bonus + active effects.
  // A másodlagos sebzéstípus −1 E/H-ját a hívó (TamadoDobasPopup) már beépítette a defaultElőny-be.
  const baseRaw = defaultElőny + netElőnySzint(sebzésHatások);
  const [rawSzint, setRawSzint] = useState(baseRaw);
  const [bónusz, setBónusz] = useState(0);
  // Ellenfél páncélosztálya (a mátrix SP-delta lookup kulcsa). null = még nincs választva.
  const [páncél, setPáncél] = useState<Páncélosztály | null>(null);
  const [eredmény, setEredmény] = useState<SebzésEredmény | null>(null);

  const aktuális = clampEHSzint(rawSzint);
  // Ellenfél-páncéltól függő SP-delta: (1) sebzésjelleg×páncél mátrix + (2) cél_páncél extrák (pl. „Páncéltalant jobban sebez").
  const mátrixDelta = páncél && páncélMátrix ? sebzésPáncélDelta(páncélMátrix, jelleg, páncél) : 0;
  const extraDelta = páncél && extraDefs ? célPáncélSpDelta(fegyverExtrák, extraDefs, páncél) : 0;
  const páncélDelta = mátrixDelta + extraDelta;
  const effektívSp = sp + páncélDelta;
  // A páncélválasztó kötelező (STUDY 3g): amíg jelen van a mátrix, de nincs választva
  // páncélosztály, a dobás blokkolva (rossz SP-eredményt adna a mátrix-lookup nélkül).
  const páncélKell = !!páncélMátrix && páncél === null;

  // Az „Extrák" gomb kontextusa a választott ellenfél-páncél kategóriájával kiegészítve (a
  // cél_páncél feltételes extrák - pl. panceltalant/sfe_duplazodik - így auto-státuszt kapnak).
  const extraKontextusPáncéllal: ExtraKontextus | undefined = extraKontextus && {
    ...extraKontextus,
    célPáncélKategória: páncél ? célPáncélKategória(páncél) : undefined,
  };

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
    <PopupOverlay onClose={() => onClose(eredmény?.végső)}>
      <div className="tamado-dobas-popup">
        {eredmény && <button className="sebzes-reset-btn" onClick={() => setEredmény(null)}>⟲</button>}
        <div className="ke-dobas-header">Sebzés</div>

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

            <ElonyPicker szint={aktuális} onChange={handleSzintChange} />

            {(sebzésHatások.length > 0 || defaultElőny > 0) && (
              <HatasokInfo hatások={sebzésHatások}>
                {defaultElőny > 0 && (
                  <div className="dobas-info-item">
                    <span className="dobas-info-badge előny">Előny+{defaultElőny}</span>
                    <span className="dobas-info-source">Támadó dobás ({téK20})</span>
                  </div>
                )}
              </HatasokInfo>
            )}

            {sebzéstípus === 'másodlagos' && (
              <div className="sebzes-masodlagos-info">
                Sebzéstípus: másodlagos (Hátrány−1)
              </div>
            )}

            <StatikusBonuszBtn
              bónusz={bónusz}
              spBónuszok={spBónuszok}
              hideAuto={hideAutoBónusz}
              onBónuszClick={handleBónuszClick}
            />

            {páncélMátrix && (
              <PáncélVálasztóBtn páncél={páncél} delta={páncélDelta} onSelect={p => { setPáncél(p); setEredmény(null); }} />
            )}
            {extraKontextusPáncéllal && (
              <ExtrakInfo fegyverExtrák={fegyverExtrák} extraDefs={extraDefs} kontextus={extraKontextusPáncéllal} />
            )}
            <div className="sebzes-summary">
              SP: {(() => {
                const fortélySum = spBónuszok.reduce((s, b) => s + b.érték, 0);
                const totalBónusz = fortélySum + bónusz + páncélDelta;
                const base = sp - fortélySum;
                if (totalBónusz !== 0) return <>{base}<span className={totalBónusz > 0 ? 'sp-bonus-pos' : 'sp-bonus-neg'}>{totalBónusz > 0 ? '+' : ''}{totalBónusz}</span></>;
                return effektívSp;
              })()} + k20
              {(átütés ?? 0) > 0 && <span className="sebzes-atutes"> | Átütés: {átütés}</span>}
            </div>

            <div className="dobas-btn-row">
              <button className="tamado-sebzes-btn" onClick={handleDobás} disabled={páncélKell}>Dobás</button>
              <ManualDicePicker szint={aktuális} onSelect={handleManualK20} alapÉrték={effektívSp + bónusz} alapLabel="SP" disabled={páncélKell} />
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{eredmény.végső}</div>
            <div className="ke-dobas-detail">
              k20{eredmény.dobás.rolls.length > 1
                ? ` [${eredmény.dobás.rolls.join(', ')}] → ${eredmény.dobás.eredmény}`
                : ` (${eredmény.dobás.eredmény})`}
              {' + '}SP ({eredmény.sp})
              {eredmény.bónusz !== 0 ? ` ${eredmény.bónusz > 0 ? '+' : ''}${eredmény.bónusz}` : ''}
            </div>
            {(átütés ?? 0) > 0 && <div className="sebzes-atutes-result">Átütés: {átütés}</div>}
          </>
        )}
      </div>
    </PopupOverlay>
  );
}

// ─── Ellenfél páncél választó gomb + popup ─────────────────────────────────

function PáncélVálasztóBtn({ páncél, delta, onSelect }: {
  páncél: Páncélosztály | null;
  delta: number;
  onSelect: (p: Páncélosztály) => void;
}) {
  const [open, setOpen] = useState(false);
  const aktLabel = páncél ? PÁNCÉLOSZTÁLYOK.find(p => p.id === páncél)?.label : 'nincs';
  const colorClass = delta > 0 ? 'sebzes-stat-pos' : delta < 0 ? 'sebzes-stat-neg' : '';
  // STUDY 3g: kötelező, kiemelt elem - amíg nincs választva, pulzáló figyelmeztető keret.
  const kellClass = páncél === null ? ' pancel-valaszto-kell' : '';

  return (
    <>
      <button className={`sebzes-stat-btn ${colorClass}${kellClass}`} onClick={() => setOpen(true)}>
        Ellenfél páncél: {aktLabel}{delta !== 0 ? ` (SP ${delta > 0 ? '+' : ''}${delta})` : ''}
      </button>
      {open && (
        <PopupOverlay onClose={() => setOpen(false)}>
          <div className="sebzes-stat-popup">
            <label className="harc-popup-label">Ellenfél páncélja</label>
            <div className="pancel-valaszto-list">
              {PÁNCÉLOSZTÁLYOK.map(p => (
                <button key={p.id}
                  className={`pancel-valaszto-item${páncél === p.id ? ' active' : ''}`}
                  onClick={() => { onSelect(p.id); setOpen(false); }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </PopupOverlay>
      )}
    </>
  );
}

// ─── Statikus bónusz gomb + popup ──────────────────────────────────────────

function StatikusBonuszBtn({ bónusz, spBónuszok, hideAuto, onBónuszClick }: {
  bónusz: number;
  spBónuszok: SpBónusz[];
  hideAuto?: boolean;
  onBónuszClick: (val: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const fortélySum = hideAuto ? 0 : spBónuszok.reduce((s, b) => s + b.érték, 0);
  const total = fortélySum + bónusz;
  const colorClass = total > 0 ? 'sebzes-stat-pos' : total < 0 ? 'sebzes-stat-neg' : '';

  return (
    <>
      <button className={`sebzes-stat-btn ${colorClass}`} onClick={() => setOpen(true)}>
        Statikus bónuszok: {total > 0 ? '+' : ''}{total}
      </button>
      {open && (
        <PopupOverlay onClose={() => setOpen(false)}>
          <div className="sebzes-stat-popup">
            <label className="harc-popup-label">Statikus SP bónuszok</label>
            {!hideAuto && (
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
            )}
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
