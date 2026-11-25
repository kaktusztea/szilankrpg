import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import { ManualDicePicker } from '../dobas/ManualDicePicker';
import { KeziBonuszBtn } from '../dobas/KeziBonuszBtn';
import { ExtrakInfo } from '../dobas/ExtrakInfo';
import { SebzesPopup } from '../dobas/SebzesPopup';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import { sebzésElőnyK20ból } from '../../engine/harc/combat-roll-info';
import type { DobásHatás, DobásMegjegyzés, SpBónusz } from '../../engine/harc/combat-roll-info';
import type { SebzésjellegPáncélMátrix, FegyverExtraDef } from '../../engine/data-types';
import type { ExtraKontextus } from '../../engine/extrak-info-calc';
import { TaktikaHelyzetPicker } from '../picker/TaktikaHelyzetPicker';
import { MegjegyzesLista, DobasKeplet, k20Eredmény, kéziDobás, k20BontásSzöveg, useEHSzint, type K20Eredmény } from '../dobas/K20Reszek';
import { aktívTerületen } from '../../engine/taktika/taktika-helpers';
import { TaktikaHelyzetChipek } from '../dobas/TaktikaHelyzetChipek';
import type { SessionProps } from '../session-props';

/**
 * Derive Sebzés Előny from the CÉ k20 roll value (same rule as TÉ):
 *  16-19 → Előny+1, 20 → Előny+2, otherwise 0
 */

interface Props extends SessionProps {
  /** Active weapon CÉ value */
  cé: number;
  /** Target VÉ (from szorzó × cella) */
  vé: number;
  /** Weapon SP value (a biztos tagokkal: alap + Erőbónusz + Mesterfegyver, l. calcTávSP) */
  sp: number;
  /** Az SP bontása a Sebzés popup „Statikus bónuszok" listájához. */
  spBónuszok: SpBónusz[];
  /** Íj: kapcsolható Erőbónusz (md/068_08; alapból BE), l. SebzesPopup. */
  /** Fegyver Átütés értéke (informatív, ha > 0) */
  átütés?: number;
  /** Collected active effects on CÉ rolls */
  céHatások: DobásHatás[];
  /** Megjegyzések (taktika notes relevant to CÉ) */
  céMegjegyzések: DobásMegjegyzés[];
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
  onClose: () => void;
}

/**
 * Célzó dobás popup - three phases:
 *  Phase 1: Előny/Hátrány picker + active effects info + Dobás button
 *  Phase 2: Result display (CÉ + k20 vs VÉ) + Találat → Sebzés button
 *  Phase 3: SebzesPopup (reused from harc/, hideMásodlagos=true)
 */
export function CélzóDobasPopup({ cé, vé, sp, spBónuszok, átütés, céHatások, céMegjegyzések, sebzésHatások, defaultSzint, páncélMátrix, jelleg, fegyverExtrák, extraDefs, extraKontextus, data, karakter, session, setSession, pushUndo, onClose }: Props) {
  // Egyszerre legfeljebb egy al-popup (a popup korai return-nel vált rájuk).
  const [alPopup, setAlPopup] = useState<'sebzés' | 'taktika' | 'helyzet' | null>(null);
  const [result, setResult] = useState<K20Eredmény | null>(null);
  const [kéziBónusz, setKéziBónusz] = useState(0);

  const [szint, setSzint] = useEHSzint(defaultSzint, !!result);
  const aktívDb = aktívTerületen(session, data, 'távharc');

  const rögzít = (dobás: ProbaDobás) => setResult(k20Eredmény(cé, kéziBónusz, dobás));

  const k20Érték = result?.dobás.eredmény ?? 0;
  const siker = result ? result.eredmény >= vé : false;
  const sebzésElőny = sebzésElőnyK20ból(k20Érték);

  if (alPopup === 'taktika' || alPopup === 'helyzet') {
    return (
      <TaktikaHelyzetPicker fajta={alPopup} terület="távharc" data={data} karakter={karakter} session={session}
        setSession={setSession} pushUndo={pushUndo} onClose={() => setAlPopup(null)} />
    );
  }

  if (alPopup === 'sebzés') {
    return (
      <SebzesPopup
        sp={sp}
        defaultElőny={sebzésElőny}
        téK20={k20Érték}
        sebzésHatások={sebzésHatások}
        spBónuszok={spBónuszok}
        megjegyzések={[]}
        átütés={átütés}
        véCsökkenésTalálatnál={data.konstansok.vé_csökkenés_találatnál}
        jelleg={jelleg}
        páncélMátrix={páncélMátrix}
        fegyverExtrák={fegyverExtrák}
        extraDefs={extraDefs}
        extraKontextus={extraKontextus}
        onClose={onClose}
        onEscape={() => setAlPopup(null)}
      />
    );
  }

  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup">
        {result && <button className="sebzes-reset-btn" onClick={() => setResult(null)}><Ikon név="reset" /></button>}
        {/* Header: title + (before the roll) the Fegyver extrák icon on the right */}
        <div className="dobas-fejlec">
          <div className="ke-dobas-header">Célzó dobás</div>
          {!result && extraKontextus && (
            <ExtrakInfo fegyverExtrák={fegyverExtrák} extraDefs={extraDefs} kontextus={extraKontextus} ikon />
          )}
        </div>

        {!result ? (
          <>
            {/* Formula: CÉ (+ hand bonus) + k20 vs VÉ */}
            <DobasKeplet alap={cé} kézi={kéziBónusz}>
              <span className="dobas-keplet-op"> vs </span><span className="dobas-keplet-ve">{vé}</span>
            </DobasKeplet>
            <MegjegyzesLista lista={céMegjegyzések} />
            {/* Same layout as the Sebzés popup: frameless, labelled, full-width E/H block, then the modifier pills */}
            <div className="elony-blokk-nyitott">
              <div className="pancel-sav-cim"><span>Előny / Hátrány</span></div>
              <ElonyLepteto szint={szint} onChange={setSzint} />
              <ForrasLista hatások={céHatások} szint={szint} alapSzint={defaultSzint} onVissza={() => setSzint(defaultSzint)} />
            </div>
            <TaktikaHelyzetChipek kapszula taktikaDb={aktívDb.taktika} helyzetDb={aktívDb.helyzet}
              onTaktika={() => setAlPopup('taktika')} onHelyzet={() => setAlPopup('helyzet')}>
              <KeziBonuszBtn kapszula bónusz={kéziBónusz} onChange={setKéziBónusz} />
            </TaktikaHelyzetChipek>
            <div className="dobas-btn-row">
              <button className="tamado-dobas-btn dobas-btn-ikon" onClick={() => rögzít(rollElőnyHátrányK20(szint))}><Ikon név="kocka" méret={22} />Dobás</button>
              <ManualDicePicker szint={szint} onSelect={v => rögzít(kéziDobás(v))} alapÉrték={cé} alapLabel="CÉ" />
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result-vs-row">
              <span className="ke-dobas-result">{result.eredmény}</span>
              <span className="ke-dobas-result-vs">vs</span>
              <span className="ke-dobas-result-cel">{vé}</span>
            </div>
            <div className="ke-dobas-detail">{k20BontásSzöveg('CÉ', result)}</div>
            <div className={siker ? 'ke-dobas-siker' : 'ke-dobas-sikertelen'}>
              {siker ? 'Találat' : 'Nem talált'}
            </div>
            {siker && (
              <button className="tamado-sebzes-btn" onClick={() => setAlPopup('sebzés')}>
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
