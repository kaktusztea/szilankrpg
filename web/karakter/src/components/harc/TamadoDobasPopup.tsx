import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from './ElonyPicker';
import { SebzesPopup } from './SebzesPopup';
import { VeCsokkentesPopup } from './VeCsokkentesPopup';
import { ManualDicePicker } from './ManualDicePicker';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import type { DobásInfo } from './combat-roll-info';
import type { FegyverResultMód } from './types';
import type { SebzésjellegPáncélMátrix, FegyverExtraDef } from '../../engine/data-types';
import type { Fegyverviszony } from './ve-csokkentes-calc';
import { netElőnySzint } from './combat-roll-info';
import { HatasokInfo as HatásokInfo } from './HatasokInfo';
import { ExtrakInfo } from './ExtrakInfo';
import type { ExtraKontextus } from './extrak-info-calc';

/**
 * Derive Sebzés Előny from the TÉ k20 roll value:
 *  16-19 → Előny+1, 20 → Előny+2, otherwise 0
 */
export function sebzésElőnyFromK20(k20: number): number {
  if (k20 === 20) return 2;
  if (k20 >= 16) return 1;
  return 0;
}

interface Props {
  /** Active weapon TÉ value (fallback: elsődleges mód, ha nincs módok lista) */
  té: number;
  /** Active weapon SP value (from reactive engine; fallback az elsődleges mód) */
  sp: number;
  /** Fegyver Átütés értéke (informatív, ha > 0) */
  átütés?: number;
  /** A fegyver összes kiszámított módja. >1 elem esetén mód-választó gomb jelenik meg.
   * Üres/1 elem → egymódú fegyver, a té/sp/átütés propok érvényesek. */
  módok?: FegyverResultMód[];
  /** Sebzésjelleg × páncél mátrix - továbbadva a Sebzés popupnak az „Ellenfél páncél" választóhoz. */
  páncélMátrix?: SebzésjellegPáncélMátrix;
  /** Az aktív fegyver extráinak listája (`cél_páncél` SP-hatás kiértékeléséhez). */
  fegyverExtrák?: { id: string }[];
  /** Az összes fegyver-extra definíció (id → def), a `cél_páncél` feltétel/hatás feloldásához. */
  extraDefs?: Record<string, FegyverExtraDef>;
  /** Harci kontextus az „Extrák" gomb auto-státuszához (aktív/inaktív/KM). */
  extraKontextus?: ExtraKontextus;
  /** Collected active effects on TÉ/Sebzés rolls */
  dobásInfo: DobásInfo;
  /** `konstansok.yaml` → `vé_csökkentés_alap` (Fegyverviszony bázisértékek). */
  véCsökkentésAlap: Record<Fegyverviszony, number>;
  onClose: (eredmény: { té: number; sp?: number; veCsökkentés?: number } | null) => void;
}

interface TéEredmény {
  alap: number;
  dobás: ProbaDobás;
  eredmény: number;
}

/**
 * Támadó dobás popup - two-phase:
 *  Phase 1: Előny/Hátrány picker + active effects info + Dobás button
 *  Phase 2: Result display + Sebzés button → opens SebzesPopup
 */
export function TamadoDobasPopup({ té, sp, átütés, módok, páncélMátrix, fegyverExtrák, extraDefs, extraKontextus, dobásInfo, véCsökkentésAlap, onClose }: Props) {
  const többMódú = (módok?.length ?? 0) > 1;
  const [módIndex, setMódIndex] = useState(0);
  const [szint, setSzint] = useState(() => netElőnySzint(dobásInfo.téHatások));
  const [téResult, setTéResult] = useState<TéEredmény | null>(null);
  const [showMódVálasztó, setShowMódVálasztó] = useState(false);
  const [showSebzés, setShowSebzés] = useState(false);
  const [showVéCsökkentés, setShowVéCsökkentés] = useState(false);

  // Aktív mód: a kiválasztott mód a listából (ha van), különben a prop-értékek.
  // A `té`/`sp` propok az ELSŐDLEGES mód már-korrigált (taktika mods, levonás) értékei;
  // más módra váltáskor a mód nyers-értékei közti DELTÁ-t adjuk hozzá, hogy a korrekciók
  // (taktika/levonás) megmaradjanak.
  const elsődleges = módok?.find(m => m.sebzéstípus === 'elsődleges') ?? módok?.[0];
  const aktívMód = módok?.[módIndex];
  const téDelta = aktívMód && elsődleges ? aktívMód.TÉ - elsődleges.TÉ : 0;
  const spDelta = aktívMód && elsődleges ? aktívMód.SP - elsődleges.SP : 0;
  const aktívTé = té + téDelta;
  const aktívSp = sp + spDelta;
  const aktívÁtütés = aktívMód?.Átütés ?? átütés;
  const aktívSebzéstípus = aktívMód?.sebzéstípus ?? 'elsődleges';

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(szint);
    setTéResult({ alap: aktívTé, dobás, eredmény: aktívTé + dobás.eredmény });
  }

  function handleManualK20(value: number) {
    const dobás: ProbaDobás = { rolls: [value], eredmény: value };
    setTéResult({ alap: aktívTé, dobás, eredmény: aktívTé + value });
  }

  const k20Érték = téResult?.dobás.eredmény ?? 0;
  // Másodlagos sebzéstípus → Hátrány−1 (a Sebzés popupba beépítve adjuk át).
  const sebzésElőny = sebzésElőnyFromK20(k20Érték) + (aktívSebzéstípus === 'másodlagos' ? -1 : 0);

  // Az aktuálisan választott mód aktorára igazított extra-kontextus (az `aktor`-feltételes extrák -
  // pl. `pontos` - mód-váltásra reagáljanak). A forgatás a base kontextusból (elsődleges mód) jön,
  // a cél_páncél-t a Sebzés popup adja.
  const aktívExtraKontextus: ExtraKontextus | undefined = extraKontextus && {
    ...extraKontextus,
    aktorNév: aktívMód?.aktor ?? extraKontextus.aktorNév,
  };

  if (showSebzés) {
    return (
      <SebzesPopup
        sp={aktívSp}
        sebzéstípus={aktívSebzéstípus}
        defaultElőny={sebzésElőny}
        téK20={k20Érték}
        sebzésHatások={dobásInfo.sebzésHatások}
        spBónuszok={dobásInfo.spBónuszok}
        megjegyzések={dobásInfo.sebzésMegjegyzések}
        átütés={aktívÁtütés}
        jelleg={aktívMód?.jelleg}
        páncélMátrix={páncélMátrix}
        fegyverExtrák={fegyverExtrák}
        extraDefs={extraDefs}
        extraKontextus={aktívExtraKontextus}
        onClose={(spEredmény) => onClose(téResult ? { té: téResult.eredmény, sp: spEredmény } : null)}
      />
    );
  }

  if (showVéCsökkentés) {
    return (
      <VeCsokkentesPopup
        k20={k20Érték}
        alapTáblázat={véCsökkentésAlap}
        fegyverExtrák={fegyverExtrák}
        extraDefs={extraDefs}
        extraKontextus={aktívExtraKontextus}
        onClose={(eredmény) => {
          if (eredmény) {
            onClose(téResult ? { té: téResult.eredmény, veCsökkentés: eredmény.végső } : null);
          } else {
            setShowVéCsökkentés(false);
          }
        }}
      />
    );
  }

  if (showMódVálasztó && módok) {
    return (
      <PopupOverlay onClose={() => setShowMódVálasztó(false)}>
        <div className="tamado-dobas-popup">
          <div className="ke-dobas-header">Fegyver mód</div>
          <div className="mod-valaszto-list">
            {módok.map((m, i) => (
              <button key={i}
                className={`mod-valaszto-item${i === módIndex ? ' active' : ''}`}
                onClick={() => { setMódIndex(i); setTéResult(null); setShowMódVálasztó(false); }}>
                <span className="mod-valaszto-jelleg">{m.jelleg}</span>
                <span className="mod-valaszto-tipus">{m.sebzéstípus} · {m.Forgatás}</span>
                <span className="mod-valaszto-ertekek">TÉ {m.TÉ} · VÉ {m.VÉ} · SP {m.SP}</span>
              </button>
            ))}
          </div>
        </div>
      </PopupOverlay>
    );
  }

  return (
    <PopupOverlay onClose={() => onClose(téResult ? { té: téResult.eredmény } : null)}>
      <div className="tamado-dobas-popup">
        {téResult && <button className="sebzes-reset-btn" onClick={() => setTéResult(null)}>⟲</button>}
        <div className="ke-dobas-header">Támadó dobás</div>

        {!téResult ? (
          <>
            {dobásInfo.téMegjegyzések.length > 0 && (
              <div className="dobas-info-list dobas-notes">
                {dobásInfo.téMegjegyzések.map((m, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge note">⚠</span>
                    <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
                  </div>
                ))}
              </div>
            )}
            {többMódú && (
              <button className="mod-valaszto-btn" onClick={() => setShowMódVálasztó(true)}>
                Mód: {aktívMód?.jelleg}{aktívSebzéstípus === 'másodlagos' ? ' (másodlagos)' : ''}
              </button>
            )}
            <ElonyPicker szint={szint} onChange={setSzint} />
            {dobásInfo.téHatások.length > 0 && (
              <HatásokInfo hatások={dobásInfo.téHatások} />
            )}
            {aktívExtraKontextus && (
              <ExtrakInfo fegyverExtrák={fegyverExtrák} extraDefs={extraDefs} kontextus={aktívExtraKontextus} />
            )}
            <div className="dobas-btn-row">
              <button className="tamado-dobas-btn" onClick={handleDobás}>Dobás</button>
              <ManualDicePicker szint={szint} onSelect={handleManualK20} alapÉrték={aktívTé} alapLabel="TÉ" />
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{téResult.eredmény}</div>
            <div className="ke-dobas-detail">
              TÉ ({téResult.alap}) + k20{téResult.dobás.rolls.length > 1
                ? ` [${téResult.dobás.rolls.join(', ')}] → ${téResult.dobás.eredmény}`
                : ` (${téResult.dobás.eredmény})`}
            </div>
            <button className="tamado-sebzes-btn" onClick={() => setShowSebzés(true)}>
              Sebzés
              {sebzésElőny > 0 && <span className="tamado-sebzes-btn-hint">Előny+{sebzésElőny}</span>}
            </button>
            <button className="tamado-ve-csokkentes-btn" onClick={() => setShowVéCsökkentés(true)}>
              VÉ csökkentés
            </button>
          </>
        )}
      </div>
    </PopupOverlay>
  );
}

// ponytail: HatásokInfo moved to shared HatasokInfo.tsx
