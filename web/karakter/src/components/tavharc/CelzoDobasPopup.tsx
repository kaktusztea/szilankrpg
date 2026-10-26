import { useState, useEffect } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from '../harc/ElonyPicker';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { KeziBonuszBtn } from '../harc/KeziBonuszBtn';
import { ExtrakInfo } from '../harc/ExtrakInfo';
import { SebzesPopup } from '../harc/SebzesPopup';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import type { DobásHatás, SpBónusz } from '../harc/combat-roll-info';
import type { SebzésjellegPáncélMátrix, FegyverExtraDef } from '../../engine/data-types';
import type { ExtraKontextus } from '../harc/extrak-info-calc';
import { HatasokInfo } from '../harc/HatasokInfo';
import { TaktikaPickerPopup } from '../aktiv/TaktikaPickerPopup';
import { HelyzetPickerPopup } from '../aktiv/HelyzetPickerPopup';
import { aktívTerületen } from '../aktiv/taktika-helpers';
import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';

/**
 * Derive Sebzés Előny from the CÉ k20 roll value (same rule as TÉ):
 *  16-19 → Előny+1, 20 → Előny+2, otherwise 0
 */
function sebzésElőnyFromK20(k20: number): number {
  if (k20 === 20) return 2;
  if (k20 >= 16) return 1;
  return 0;
}

interface Props {
  /** Active weapon CÉ value */
  cé: number;
  /** Target VÉ (from szorzó × cella) */
  vé: number;
  /** Weapon SP value (a biztos tagokkal: alap + Erőbónusz + Mesterfegyver, l. calcTávSP) */
  sp: number;
  /** Az SP bontása a Sebzés popup „Statikus bónuszok" listájához. */
  spBónuszok: SpBónusz[];
  /** Íj: kapcsolható Erőbónusz (md/068_08; alapból BE), l. SebzesPopup. */
  kapcsolhatóSpBónusz?: { felirat: string; érték: number; kiFelirat: string; limitált?: boolean };
  /** Fegyver Átütés értéke (informatív, ha > 0) */
  átütés?: number;
  /** Collected active effects on CÉ rolls */
  céHatások: DobásHatás[];
  /** Megjegyzések (taktika notes relevant to CÉ) */
  céMegjegyzések: { forrás: string; szöveg: string }[];
  /** Active Előny/Hátrány effects on Sebzésdobás */
  sebzésHatások: DobásHatás[];
  /** Default Előny/Hátrány szint (from active effects) */
  defaultSzint: number;
  /** Sebzésjelleg × páncél mátrix - az „Ellenfél páncél" választóhoz (SebzesPopup). */
  páncélMátrix?: SebzésjellegPáncélMátrix;
  /** Az aktív távfegyver sebzésjellege a mátrix teljes-szavas kulcsaként (pl. "szúró"). */
  jelleg?: string;
  /** Az aktív távfegyver extráinak listája (`cél_páncél` SP-hatás kiértékeléséhez). */
  fegyverExtrák?: { id: string }[];
  /** Az összes fegyver-extra definíció (id → def). */
  extraDefs?: Record<string, FegyverExtraDef>;
  /** Harci kontextus az „Extrák" gomb + effekt-motor cél_páncél feltételeihez. */
  extraKontextus?: ExtraKontextus;
  /** A Taktika / Harci helyzet kapcsoló chipekhez (ugyanaz a picker-ablak, mint az Aktív fülön, csak távharci tételek). */
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  onClose: () => void;
}

interface CéEredmény {
  alap: number;
  kézi: number;
  dobás: ProbaDobás;
  eredmény: number;
}

/**
 * Célzó dobás popup - three phases:
 *  Phase 1: Előny/Hátrány picker + active effects info + Dobás button
 *  Phase 2: Result display (CÉ + k20 vs VÉ) + Találat → Sebzés button
 *  Phase 3: SebzesPopup (reused from harc/, hideMásodlagos=true)
 */
export function CélzóDobasPopup({ cé, vé, sp, spBónuszok, kapcsolhatóSpBónusz, átütés, céHatások, céMegjegyzések, sebzésHatások, defaultSzint, páncélMátrix, jelleg, fegyverExtrák, extraDefs, extraKontextus, data, karakter, session, setSession, pushUndo, onClose }: Props) {
  const [szint, setSzint] = useState(defaultSzint);
  const [result, setResult] = useState<CéEredmény | null>(null);
  const [kéziBónusz, setKéziBónusz] = useState(0);
  const [showSebzés, setShowSebzés] = useState(false);
  const [showTaktikaPicker, setShowTaktikaPicker] = useState(false);
  const [showHelyzetPicker, setShowHelyzetPicker] = useState(false);

  // Dobás ELŐTT az E/H szint követi az aktív hatásokat (a chipekkel kapcsolt taktika / helyzet azonnal látszik),
  // dobás után a felhasználó választását nem írjuk felül - mint a Támadó dobás popupban.
  useEffect(() => {
    if (!result) setSzint(defaultSzint);
  }, [defaultSzint, result]);
  const aktívDb = aktívTerületen(session, data, 'távharc');

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(szint);
    setResult({ alap: cé, kézi: kéziBónusz, dobás, eredmény: cé + kéziBónusz + dobás.eredmény });
  }

  function handleManualK20(value: number) {
    const dobás: ProbaDobás = { rolls: [value], eredmény: value };
    setResult({ alap: cé, kézi: kéziBónusz, dobás, eredmény: cé + kéziBónusz + value });
  }

  const k20Érték = result?.dobás.eredmény ?? 0;
  const siker = result ? result.eredmény >= vé : false;
  const sebzésElőny = sebzésElőnyFromK20(k20Érték);

  if (showTaktikaPicker) {
    return (
      <TaktikaPickerPopup data={data} karakter={karakter} session={session} terület="távharc"
        setSession={setSession} pushUndo={pushUndo} onClose={() => setShowTaktikaPicker(false)} />
    );
  }
  if (showHelyzetPicker) {
    return (
      <HelyzetPickerPopup data={data} karakter={karakter} session={session} terület="távharc"
        setSession={setSession} pushUndo={pushUndo} onClose={() => setShowHelyzetPicker(false)} />
    );
  }

  if (showSebzés) {
    return (
      <SebzesPopup
        sp={sp}
        defaultElőny={sebzésElőny}
        téK20={k20Érték}
        sebzésHatások={sebzésHatások}
        spBónuszok={spBónuszok}
        kapcsolhatóSpBónusz={kapcsolhatóSpBónusz}
        megjegyzések={[]}
        átütés={átütés}
        jelleg={jelleg}
        páncélMátrix={páncélMátrix}
        fegyverExtrák={fegyverExtrák}
        extraDefs={extraDefs}
        extraKontextus={extraKontextus}
        onClose={onClose}
      />
    );
  }

  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup">
        {result && <button className="sebzes-reset-btn" onClick={() => setResult(null)}>⟲</button>}
        <div className="ke-dobas-header">Célzó dobás</div>

        {!result ? (
          <>
            <div className="ke-dobas-cel-ve-row">
              <span className="ke-dobas-cel-ve-ce">{cé}</span>
              <span className="ke-dobas-cel-ve-sep">vs</span>
              <span className="ke-dobas-cel-ve-ve">{vé}</span>
            </div>
            {céMegjegyzések.length > 0 && (
              <div className="dobas-info-list dobas-notes">
                {céMegjegyzések.map((m, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge note">⚠</span>
                    <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="tamado-aktiv-chips">
              <button className="tamado-aktiv-chip" onClick={() => setShowTaktikaPicker(true)}>
                Taktika{aktívDb.taktika > 0 ? ` (${aktívDb.taktika})` : ''}
              </button>
              <button className="tamado-aktiv-chip" onClick={() => setShowHelyzetPicker(true)}>
                Harci helyzet{aktívDb.helyzet > 0 ? ` (${aktívDb.helyzet})` : ''}
              </button>
            </div>
            <ElonyPicker szint={szint} onChange={setSzint} rövid kompakt />
            {céHatások.length > 0 && <HatasokInfo hatások={céHatások} />}
            {extraKontextus && (
              <ExtrakInfo fegyverExtrák={fegyverExtrák} extraDefs={extraDefs} kontextus={extraKontextus} />
            )}
            <KeziBonuszBtn bónusz={kéziBónusz} onChange={setKéziBónusz} />
            <div className="dobas-btn-row">
              <button className="tamado-dobas-btn" onClick={handleDobás}>Dobás (k20)</button>
              <ManualDicePicker szint={szint} onSelect={handleManualK20} alapÉrték={cé} alapLabel="CÉ" />
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result-vs-row">
              <span className="ke-dobas-result">{result.eredmény}</span>
              <span className="ke-dobas-result-vs">vs</span>
              <span className="ke-dobas-result-cel">{vé}</span>
            </div>
            <div className="ke-dobas-detail">
              CÉ ({result.alap})
              {result.kézi !== 0 ? ` ${result.kézi > 0 ? '+' : ''}${result.kézi}` : ''}
              {' + '}k20{result.dobás.rolls.length > 1
                ? ` [${result.dobás.rolls.join(', ')}] → ${result.dobás.eredmény}`
                : ` (${result.dobás.eredmény})`}
            </div>
            <div className={siker ? 'ke-dobas-siker' : 'ke-dobas-sikertelen'}>
              {siker ? 'Találat' : 'Nem talált'}
            </div>
            {siker && (
              <button className="tamado-sebzes-btn" onClick={() => setShowSebzés(true)}>
                Sebzés
                {sebzésElőny > 0 && <span className="tamado-sebzes-btn-hint">Előny+{sebzésElőny}</span>}
              </button>
            )}
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
