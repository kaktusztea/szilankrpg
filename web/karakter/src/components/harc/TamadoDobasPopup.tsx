import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import { SebzesPopup } from '../dobas/SebzesPopup';
import { VeCsokkentesPopup } from '../dobas/VeCsokkentesPopup';
import { ManualDicePicker } from '../dobas/ManualDicePicker';
import { TaktikaHelyzetPicker } from '../picker/TaktikaHelyzetPicker';
import { MegjegyzesLista, DobasKeplet, BontasNyil, k20Eredmény, kéziDobás, k20BontásSzöveg, useEHSzint, type K20Eredmény } from '../dobas/K20Reszek';
import { aktívTerületen } from '../../engine/taktika/taktika-helpers';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import type { DobásInfo } from '../../engine/harc/combat-roll-info';
import type { SebzésjellegPáncélMátrix, FegyverExtraDef } from '../../engine/data-types';
import type { Fegyverviszony } from '../../engine/harc/ve-csokkentes-calc';
import { támadódobástTiltóTaktika } from '../../engine/harc/ve-csokkentes-calc';
import { netElőnySzint, fegyverSpBónuszok, sebzésElőnyK20ból } from '../../engine/harc/combat-roll-info';
import { ExtrakInfo } from '../dobas/ExtrakInfo';
import { KeziBonuszBtn } from '../dobas/KeziBonuszBtn';
import type { ExtraKontextus } from '../../engine/extrak-info-calc';
import { taktikaDef } from '../../engine/lookup';
import type { FegyverResultMód } from '../../engine/harc/types';
import { TaktikaHelyzetChipek } from '../dobas/TaktikaHelyzetChipek';
import type { SessionProps } from '../session-props';

interface Props extends SessionProps {
  /** Active weapon TÉ value (fallback: elsődleges mód, ha nincs módok lista) */
  té: number;
  /** Active weapon SP value (from reactive engine; fallback az elsődleges mód) */
  sp: number;
  /** Fegyver Átütés értéke (informatív, ha > 0) */
  átütés?: number;
  /** A fegyver összes kiszámított módja. >1 elem esetén mód-választó gomb jelenik meg.
   * Üres/1 elem → egymódú fegyver, a té/sp/átütés propok érvényesek. */
  módok?: FegyverResultMód[];
  /** Az aktív fegyver neve (a Mesterfegyver bontás-feliratához). */
  fegyverNév?: string;
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
  /** `konstansok.yaml` → `vé_csökkenés_találatnál` (md/064_02_07): a hit always costs the target this much VÉ. */
  véCsökkenésTalálatnál: number;
  /** Taktika-eredetű szorzó a Fegyverviszony-alapú VÉ csökkentésre (pl. Roham/Öngyilkos roham: 2). */
  véCsökkentésSzorzó?: number;
  /** A szorzót adó taktika(k) neve (pl. "Roham") - a VÉ-csökkentés bontásban jelenik meg. */
  véCsökkentésSzorzóForrás?: string;
  /** Harci helyzetek vé_csökkentés flat bővítései (pl. Meglepetés +2) - a VÉ-csökkentés popupnak továbbadva. */
  helyzetVéCsökkentés?: { forrás: string; érték: number }[];
  onClose: (eredmény: { té: number; sp?: number; veCsökkentés?: number } | null) => void;
}

/**
 * Támadó dobás popup - two-phase:
 *  Phase 1: Előny/Hátrány picker + active effects info + Dobás button
 *  Phase 2: Result display + Sebzés button → opens SebzesPopup
 */
export function TamadoDobasPopup({ té, sp, átütés, módok, fegyverNév, páncélMátrix, fegyverExtrák, extraDefs, extraKontextus, dobásInfo, véCsökkentésAlap, véCsökkenésTalálatnál, véCsökkentésSzorzó, véCsökkentésSzorzóForrás, helyzetVéCsökkentés, data, karakter, session, setSession, pushUndo, onClose }: Props) {
  const többMódú = (módok?.length ?? 0) > 1;
  // Egyszerre legfeljebb egy al-popup (a popup korai return-nel vált rájuk).
  const [alPopup, setAlPopup] = useState<'mód' | 'sebzés' | 'véCsökkentés' | 'taktika' | 'helyzet' | null>(null);
  const [módIndex, setMódIndex] = useState(0);
  const [téResult, setTéResult] = useState<K20Eredmény | null>(null);
  const [kéziBónusz, setKéziBónusz] = useState(0);
  const [bontásNyitva, setBontásNyitva] = useState(false); // TÉ + k20 breakdown under the result, collapsed by default

  const téHatásSzint = netElőnySzint(dobásInfo.téHatások);
  const [szint, setSzint] = useEHSzint(téHatásSzint, !!téResult);

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

  function rögzít(dobás: ProbaDobás) {
    setBontásNyitva(false);
    setTéResult(k20Eredmény(aktívTé, kéziBónusz, dobás));
  }

  const k20Érték = téResult?.dobás.eredmény ?? 0;
  // Másodlagos sebzéstípus → Hátrány−1 (a Sebzés popupba beépítve adjuk át).
  const sebzésElőny = sebzésElőnyK20ból(k20Érték) + (aktívSebzéstípus === 'másodlagos' ? -1 : 0);

  // Ha a popupon BELÜL olyan taktikát kapcsolnak be, ami kizárja a rendes Támadó dobást (Fárasztás /
  // Teljes Védekezés), a dobás-fázisban nem engedünk dobni (csak Bezár). A tiltás oka a taktika saját
  // `megjegyzés`-éből jön (egy igazságforrás: taktikak.yaml) - l. HarcScreen.onTéClick ugyanezen ágai.
  // A chipek száma: csak a közelharci aktívak (a picker is csak ezeket mutatja).
  const aktívDb = aktívTerületen(session, data, 'közelharc');
  const tiltóTaktika = támadódobástTiltóTaktika(session, data);
  const tiltóMegjegyzés = tiltóTaktika ? taktikaDef(data, tiltóTaktika)?.megjegyzés ?? '' : '';

  // Az aktuálisan választott mód aktorára igazított extra-kontextus (az `aktor`-feltételes extrák -
  // pl. `pontos` - mód-váltásra reagáljanak). A forgatás a base kontextusból (elsődleges mód) jön,
  // a cél_páncél-t a Sebzés popup adja.
  const aktívExtraKontextus: ExtraKontextus | undefined = extraKontextus && {
    ...extraKontextus,
    aktorNév: aktívMód?.aktor ?? extraKontextus.aktorNév,
  };

  if (alPopup === 'sebzés') {
    return (
      <SebzesPopup
        sp={aktívSp}
        sebzéstípus={aktívSebzéstípus}
        defaultElőny={sebzésElőny}
        téK20={k20Érték}
        sebzésHatások={dobásInfo.sebzésHatások}
        spBónuszok={[...fegyverSpBónuszok(aktívMód ?? elsődleges, fegyverNév), ...dobásInfo.spBónuszok]}
        megjegyzések={dobásInfo.sebzésMegjegyzések}
        átütés={aktívÁtütés}
        jelleg={aktívMód?.jelleg}
        páncélMátrix={páncélMátrix}
        fegyverExtrák={fegyverExtrák}
        extraDefs={extraDefs}
        extraKontextus={aktívExtraKontextus}
        véCsökkenésTalálatnál={véCsökkenésTalálatnál}
        // Only a resolved damage step is recorded; closing before the roll abandons the flow (no history entry).
        onClose={(spEredmény, találat) => onClose(téResult && találat ? { té: téResult.eredmény, sp: spEredmény, veCsökkentés: véCsökkenésTalálatnál } : null)}
        onEscape={() => setAlPopup(null)}
      />
    );
  }

  if (alPopup === 'véCsökkentés') {
    return (
      <VeCsokkentesPopup
        k20={k20Érték}
        alapTáblázat={véCsökkentésAlap}
        véCsökkentésSzorzó={véCsökkentésSzorzó}
        véCsökkentésSzorzóForrás={véCsökkentésSzorzóForrás}
        helyzetVéCsökkentés={helyzetVéCsökkentés}
        fegyverExtrák={fegyverExtrák}
        extraDefs={extraDefs}
        extraKontextus={aktívExtraKontextus}
        onClose={(eredmény) => {
          if (eredmény) {
            onClose(téResult ? { té: téResult.eredmény, veCsökkentés: eredmény.végső } : null);
          } else {
            setAlPopup(null);
          }
        }}
      />
    );
  }

  if (alPopup === 'taktika' || alPopup === 'helyzet') {
    return (
      <TaktikaHelyzetPicker fajta={alPopup} terület="közelharc" data={data} karakter={karakter} session={session}
        setSession={setSession} pushUndo={pushUndo} onClose={() => setAlPopup(null)} />
    );
  }

  if (alPopup === 'mód' && módok) {
    return (
      <PopupOverlay onClose={() => setAlPopup(null)}>
        <div className="tamado-dobas-popup">
          <div className="ke-dobas-header">Fegyver mód</div>
          <div className="mod-valaszto-list">
            {módok.map((m, i) => (
              <button key={i}
                className={`mod-valaszto-item${i === módIndex ? ' active' : ''}`}
                onClick={() => { setMódIndex(i); setTéResult(null); setAlPopup(null); }}>
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
    // Closing here (Escape / outside click) abandons the flow: a TÉ roll without Sebzés or VÉ csökkentés is not recorded.
    <PopupOverlay className="kep-prompt tamado-dobas-wrapper" onClose={() => onClose(null)}>
      <div className="tamado-dobas-popup">
        {téResult && <button className="sebzes-reset-btn" onClick={() => setTéResult(null)}><Ikon név="reset" /></button>}
        {/* Header: title + (before the roll) the Fegyver extrák icon on the right */}
        <div className="dobas-fejlec">
          <div className="ke-dobas-header">Támadó dobás</div>
          {!téResult && aktívExtraKontextus && (
            <ExtrakInfo fegyverExtrák={fegyverExtrák} extraDefs={extraDefs} kontextus={aktívExtraKontextus} ikon />
          )}
        </div>

        {!téResult ? (
          <>
            {!tiltóTaktika && <MegjegyzesLista lista={dobásInfo.téMegjegyzések} />}
            <DobasKeplet alap={aktívTé} kézi={kéziBónusz} />
            {többMódú && (
              // Same pill look as the Taktika / Harci helyzet / Bónusz pills
              <button type="button" className="dobas-kapszula" onClick={() => setAlPopup('mód')}>
                Mód <span className="dobas-kapszula-db">{aktívMód?.jelleg}{aktívSebzéstípus === 'másodlagos' && ' (másodlagos)'}</span>
              </button>
            )}
            {/* Modifier pills above the E/H box (stepper + its sources); both share one column */}
            <div className="dobas-oszlop">
              <TaktikaHelyzetChipek kapszula taktikaDb={aktívDb.taktika} helyzetDb={aktívDb.helyzet}
                onTaktika={() => setAlPopup('taktika')} onHelyzet={() => setAlPopup('helyzet')}>
                {!tiltóTaktika && <KeziBonuszBtn kapszula bónusz={kéziBónusz} onChange={setKéziBónusz} />}
              </TaktikaHelyzetChipek>
              <div className="elony-blokk">
                <ElonyLepteto szint={szint} onChange={setSzint} />
                <ForrasLista hatások={dobásInfo.téHatások} szint={szint} alapSzint={téHatásSzint} onVissza={() => setSzint(téHatásSzint)} />
              </div>
            </div>
            {tiltóTaktika ? (
              <>
                <MegjegyzesLista lista={[{ forrás: tiltóTaktika, szöveg: tiltóMegjegyzés }]} />
                <div className="dobas-btn-row">
                  <button className="tamado-ve-csokkentes-btn" onClick={() => onClose(null)}>Bezár</button>
                </div>
              </>
            ) : (
              <div className="dobas-btn-row">
                <button className="tamado-dobas-btn dobas-btn-ikon" onClick={() => rögzít(rollElőnyHátrányK20(szint))}><Ikon név="kocka" méret={22} />Dobás</button>
                <ManualDicePicker szint={szint} onSelect={v => rögzít(kéziDobás(v))} alapÉrték={aktívTé} alapLabel="TÉ" />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{téResult.eredmény}
              <BontasNyil nyitva={bontásNyitva} onVált={() => setBontásNyitva(v => !v)} label="Támadó dobás bontása" />
            </div>
            {bontásNyitva && <div className="ke-dobas-detail">{k20BontásSzöveg('TÉ', téResult, szint)}</div>}
            {téResult.dobás.eredmény === 1 && (
              <MegjegyzesLista lista={[{ forrás: 'Dobás', szöveg: '1 (k20) - ha a támadás sikertelen, narratív hátrány érhet.' }]} />
            )}
            {/* The two outcomes: hit → Sebzés dobás, miss → VÉ csökkentés */}
            <div className="talalat-par">
              <button type="button" className="talalat-gomb talalt" onClick={() => setAlPopup('sebzés')}>
                <b>Talált</b>
                <span>Sebzés dobás{sebzésElőny > 0 ? ` · Előny+${sebzésElőny}` : ''}</span>
              </button>
              <button type="button" className="talalat-gomb" onClick={() => setAlPopup('véCsökkentés')}>
                <b>Nem talált</b>
                <span>VÉ csökkentés{véCsökkentésSzorzó && véCsökkentésSzorzó !== 1 ? ` · ×${véCsökkentésSzorzó}${véCsökkentésSzorzóForrás ? ` (${véCsökkentésSzorzóForrás})` : ''}` : ''}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
