import { useState } from 'react';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from '../harc/ElonyPicker';
import { HatasokInfo as HatásokInfo } from '../harc/HatasokInfo';
import { VeCsokkentesPopup } from '../harc/VeCsokkentesPopup';
import type { Fegyverviszony } from '../harc/ve-csokkentes-calc';
import type { FegyverExtraDef } from '../../engine/data-types';
import type { ExtraKontextus } from '../harc/extrak-info-calc';
import { netElőnySzint } from '../harc/combat-roll-info';
import type { DobásHatás } from '../harc/combat-roll-info';
import type { ProbaDobás } from '../../engine/dice';
import {
  type Mód, type FázisEredmény, type ManőverDef,
  követelményTeljesül, gépiKövetelményStátusz, parseFázisok, könnyítettFázisok, helyzetKönnyítés, aktívFegyverInfo,
  calcManőverPont, getBelharcFok, fázisCselekvő, fázisSikeres, FÁZIS_FELIRAT, rontottVFázis,
  szitModKezdőÁllapot, szitTáblákMódszerint, szitModÁllapot,
} from './manover-dobas-calc';
import {
  ManoverDobasSor, ManoverKovetelmenyLepes, ManoverFazisChipek, ManoverVegeredmeny, ManoverSzitPicker, ManoverMpPicker, ManoverTePopup,
  type KövetelményDöntés, type Végeredmény,
} from './ManoverDobasReszek';

/** Kockák: Végrehajtás = támadó dobás (k20), Ellenpróba = k10 (§066). */
const VÉGREHAJTÁS_KOCKA = 20;
const ELLENPRÓBA_KOCKA = 10;
/** Normál követelmény-hiány: Hátrány-2 az Ellenpróbán (md/066_04). */
const ELLENPRÓBA_NORMÁL_HIÁNY_EH = -2;

interface Props {
  manőver: ManőverDef;
  mód: Mód;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  data: GameData;
  /** Manőver Alap - kanonikus érték a reactive engine-ből (rules.json: manőver_alap). */
  manőverAlap: number;
  /** Aktív fegyver TÉ - ugyanaz, mint a Támadó dobásé (fegyver, MF, fortély, taktika, helyzet, státusz). */
  aktívTÉ: number | null;
  /** Aktív fegyver VÉ - ugyanaz, mint a Harc fülé (fegyver/pajzs, taktika, helyzet, VÉ-csökkenés). */
  aktívVÉ: number | null;
  /** Aktív TÉ-dobás hatások (helyzet/státusz Előny/Hátrány) - kezdőszint + forrás-sor, mint a Támadó dobásnál. */
  téHatások?: DobásHatás[];
  /** `konstansok.yaml` → `vé_csökkentés_alap` (Fegyverviszony bázis) - a rontott V fázis VÉ-csökkentéséhez. */
  véCsökkentésAlap?: Record<Fegyverviszony, number>;
  /** Taktika-eredetű szorzó a Fegyverviszony-alapú VÉ csökkentésre (pl. Roham: 2) - mint a Támadó dobásnál. */
  véCsökkentésSzorzó?: number;
  /** A szorzót adó taktika(k) neve - a VÉ-csökkentés bontásban jelenik meg. */
  véCsökkentésSzorzóForrás?: string;
  /** Harci helyzet-eredetű flat VÉ-csökkentés bővítések (pl. Meglepetés +2). */
  helyzetVéCsökkentés?: { forrás: string; érték: number }[];
  /** Az aktív fegyver extrái + definíciói + kontextus a VÉ-csökkentés warninghoz. */
  fegyverExtrák?: { id: string }[];
  extraDefs?: Record<string, FegyverExtraDef>;
  extraKontextus?: ExtraKontextus;
  /** A rontott V fázis dobásának + a hozzá választott VÉ-csökkentésnek a TÉ-chip history-ba vezetése
   *  (ugyanaz a `té_dobások` tömb, mint a Támadó dobásnál - a megjelenített érték az ellenfélé). */
  onTéDobás?: (té: number, veCsökkentés: number) => void;
  onClose: () => void;
}

export function ManoverDobasPopup({ manőver, mód, karakter, session, setSession, data, manőverAlap, aktívTÉ, aktívVÉ, téHatások = [], véCsökkentésAlap, véCsökkentésSzorzó, véCsökkentésSzorzóForrás, helyzetVéCsökkentés = [], fegyverExtrák, extraDefs, extraKontextus, onTéDobás, onClose }: Props) {
  const könnyítés = mód === 'aktív' ? helyzetKönnyítés(session) : { meglepetés: false, orvtámadás: false };
  const vanKönnyítés = könnyítés.meglepetés || könnyítés.orvtámadás;
  const aktívFegyver = mód === 'aktív' ? aktívFegyverInfo(karakter, session, data) : null;
  const fázisok = könnyítettFázisok(parseFázisok(manőver.fázisok), mód, session);
  const [eredmények, setEredmények] = useState<FázisEredmény[]>(fázisok.map(() => 'pending'));
  const [költöttMP, setKöltöttMP] = useState(0);
  // Kockadobások: csak a kocka értéke tárolt, az összeg élőben számol (a módosító/MP változása utólag is érvényes).
  const [téSzint, setTéSzint] = useState(() => netElőnySzint(téHatások));
  const [vDobás, setVDobás] = useState<ProbaDobás | null>(null);
  const [eDobás, setEDobás] = useState<ProbaDobás | null>(null);
  const [véCsökkNyitva, setVéCsökkNyitva] = useState(false);

  // Helyzetfüggő módosítók - a dobó-oldalhoz illő táblák (mód_oldal szerint, §066_04). Aktív: aktív-
  // oldali táblák + globális módosítók; passzív: passzív-oldali táblák (fegyver-extrák, pl. Fegyvertörés-immunis).
  const módosítóTáblák = szitTáblákMódszerint(manőver.helyzetfüggő_módosítók, mód, data);
  const [szitPickerNyitva, setSzitPickerNyitva] = useState(false);
  const [mpPickerNyitva, setMpPickerNyitva] = useState(false);
  const [téPopupNyitva, setTéPopupNyitva] = useState(false);
  const [szitMods, setSzitMods] = useState<Record<string, number>>(
    () => szitModKezdőÁllapot(módosítóTáblák, karakter, session, data).single,
  );
  const [multiMods, setMultiMods] = useState<Record<string, boolean[]>>(
    () => szitModKezdőÁllapot(módosítóTáblák, karakter, session, data).multi,
  );
  // A kiválasztott módosítók aggregált állapota: összeg + a két sentinel-ág (99 = nem kísérelhető meg,
  // -99 = immunis) + az immunis extra leírása - egy helyen (manover-dobas-calc). Manőverhez nincs
  // próba-enyhítés. A sentinelek NEM adódnak az összeghez (vakon +99 bónusz biztos sikert adna).
  const { összeg: szitModÖsszeg, lehetetlen: szitLehetetlen, immunis: szitImmunis, immunisLeírás } =
    szitModÁllapot(módosítóTáblák, szitMods, multiMods, data);

  const manőverPont = calcManőverPont(karakter, data);
  const aktMP = Math.max(0, manőverPont - session.manőver_pont_használt);
  const belharcFok = getBelharcFok(karakter);
  const isBelharcos = manőver.típus === 'belharcos';
  const mk = data.konstansok.manőver;
  const maxKölthető = Math.min(aktMP, mód === 'aktív' ? mk.max_mp_támadó : mk.max_mp_védő);
  const belharcBónusz = isBelharcos ? belharcFok * mk.belharc_fok_szorzó : 0;

  // 0. lépés: követelmények (CSAK aktív módban - az alkalmazóra vonatkoznak).
  const követelmények = mód === 'aktív' ? (manőver.követelmények ?? []) : [];
  const vanKövetelmény = követelmények.length > 0;
  // Egy erősségre csak akkor kell "hiány" gomb, ha van HIÁNYOZHATÓ eleme:
  // informatív (a játékos dönthet hiányról) VAGY gépi, ami nem teljesül.
  // Ha egy erősség minden eleme gépi ÉS mind teljesül → a hiány kizárt → nincs gomb.
  const hiányLehet = (erősség: 'normál' | 'erős') =>
    követelmények.some(k => k.erősség === erősség
      && (k.típus === 'egyéb' || követelményTeljesül(k, karakter, data, session, aktívFegyver) === false)
      && követelményTeljesül(k, karakter, data, session, aktívFegyver) !== true);
  const vanNormál = hiányLehet('normál');
  const vanErős = hiányLehet('erős');
  const gépiStátusz = gépiKövetelményStátusz(követelmények, karakter, data, session, aktívFegyver);
  // Auto-kudarc, ha gépi Erős hiány. Ekkor a döntés nem is választható.
  const [követelményDöntés, setKövetelményDöntés] = useState<KövetelményDöntés>(
    () => gépiStátusz.erősHiány ? 'erős' : 'pending',
  );
  // A 0. lépés akkor "kész", ha van döntés (vagy nincs követelmény).
  const követelményKész = !vanKövetelmény || követelményDöntés !== 'pending';
  const követelményKudarc = követelményDöntés === 'erős';
  // Hátrány-2 az Ellenpróbán, ha a döntés "normál" (Normál hiány).
  const ellenpróbaHátrány2 = követelményDöntés === 'normál';

  // Egy fázis sikere a manővernek: cselekvő-alapú, DE ha ellenpróba_bünteti és E fázis,
  // a rontott dobás NEM buktat (a manőver sikeres, csak büntetés jár).
  const fázisSikeresM = (i: number, e: FázisEredmény): boolean => {
    if (manőver.ellenpróba_bünteti && fázisok[i] === 'E') return e !== 'pending';
    return fázisSikeres(e, fázisCselekvő(fázisok[i], manőver.fázis_cselekvő));
  };

  // Find current active phase (first pending), but stop if manőver already failed.
  const manőverMárSikertelen = eredmények.some((e, i) => e !== 'pending' && !fázisSikeresM(i, e));
  const aktívFázisIdx = (!követelményKész || követelményKudarc || manőverMárSikertelen || szitImmunis)
    ? -1 : eredmények.findIndex(e => e === 'pending');
  const végeredmény: Végeredmény =
    szitImmunis ? 'sikertelen'   // a fegyver immunis → a manőver sikertelen (a passzív félnek siker), azonnal
    : követelményKudarc ? 'sikertelen'
    : !követelményKész ? 'folyamatban'
    : manőverMárSikertelen ? 'sikertelen'
    : eredmények.includes('pending') ? 'folyamatban'
    : eredmények.every((e, i) => fázisSikeresM(i, e)) ? 'sikeres' : 'sikertelen';

  // Bünteti-manőver (Átsiklás/Kibontakozás) sikeres, de rontott ellenpróbával → "büntetve"
  // (a manőver átment, de megcsaphatták/megcsaptad). Ez a végeredmény-sáv SÁRGA átmeneti állapota.
  const bünteti_büntetve = végeredmény === 'sikeres' && manőver.ellenpróba_bünteti
    && fázisok.some((f, i) => f === 'E' && eredmények[i] === 'nem');

  // Rontott Végrehajtás (V) → VÉ csökkentés, mint egy sima sikertelen támadás (md/066_04:
  // „Sikertelen Manőver és VÉ csökkentés"). CSAK aktív módban és csak V fázisnál (a Megakasztás
  // rontása NEM okoz VÉ-csökkentést). A VÉ-csökkenés az ELLENFELET éri (én támadok), ezért CSAK
  // megjelenítés - nem írjuk a saját session.vé_csökkenés-t (mint a Támadó dobásnál). A k20 a már
  // eldobott V (támadó) dobásból jön - l. rontottVFázis.
  const vRontott = rontottVFázis(fázisok, eredmények, mód, vDobás != null);
  const véCsökkGombLátszik = vRontott && !!véCsökkentésAlap;

  function handleChip(igen: boolean) {
    if (aktívFázisIdx === -1) return;
    // Deduct MP when Ellenpróba phase is resolved (regardless of outcome).
    if (fázisok[aktívFázisIdx] === 'E' && költöttMP > 0) {
      setSession(prev => ({ ...prev, manőver_pont_használt: prev.manőver_pont_használt + költöttMP }));
    }
    const next = [...eredmények];
    next[aktívFázisIdx] = igen ? 'igen' : 'nem';
    setEredmények(next);
  }

  /**
   * A gombok a MANŐVER sikere felé mutatnak. A tárolt igen/nem reprezentáció a cselekvőtől
   * függ: én-cselekvőnél a találat (igen) a siker, ellenfél-megakasztónál a hibázás (nem).
   */
  function handleSiker(siker: boolean) {
    if (aktívFázisIdx === -1) return;
    const cs = fázisCselekvő(fázisok[aktívFázisIdx], manőver.fázis_cselekvő);
    handleChip(cs === 'én' ? siker : !siker);
  }

  function renderFázisInfo(fázis: 'M' | 'V' | 'E') {
    switch (fázis) {
      case 'M': return renderMegakasztás();
      case 'V': return renderVégrehajtás();
      case 'E': return renderEllenpróba();
    }
  }

  function renderMegakasztás() {
    if (mód === 'aktív') {
      // Ellenem támadnak - szükségem van a VÉ-mre.
      return (
        <div className="manover-fazis-info">
          <div className="manover-fazis-desc">Ellenfél támad a VÉ-d ellen</div>
          {aktívVÉ != null && <div className="manover-fazis-ertek">VÉ: <strong>{aktívVÉ}</strong></div>}
        </div>
      );
    } else {
      // Én támadok (megakasztás) - szükségem van a TÉ-mre.
      return (
        <div className="manover-fazis-info">
          <div className="manover-fazis-desc">Megakasztás támadás</div>
          {aktívTÉ != null && <div className="manover-fazis-ertek">TÉ: <strong>{aktívTÉ}</strong></div>}
        </div>
      );
    }
  }

  function renderVégrehajtás() {
    if (mód === 'aktív') {
      const téMód = manőver.végrehajtás_té_módosító;
      const téVégső = aktívTÉ != null ? aktívTÉ + téMód : null;
      return (
        <div className="manover-fazis-info manover-te-center">
          {téVégső != null && (
            <button type="button" className="manover-te-chip" onClick={() => setTéPopupNyitva(true)}>
              TÉ: <strong>{téVégső}</strong> <span className="manover-te-info">ⓘ</span>
            </button>
          )}
          {téVégső != null && !vDobás && <ElonyPicker szint={téSzint} onChange={setTéSzint} rövid />}
          {téVégső != null && !vDobás && téHatások.length > 0 && <HatásokInfo hatások={téHatások} />}
          {téVégső != null && <ManoverDobasSor alap={téVégső} alapLabel="TÉ" kocka={VÉGREHAJTÁS_KOCKA} szint={téSzint} dobás={vDobás} setDobás={setVDobás} />}
        </div>
      );
    } else {
      return (
        <div className="manover-fazis-info">
          <div className="manover-fazis-desc">Ellenfél támad TÉ+{manőver.végrehajtás_té_módosító}-gyel</div>
          {aktívVÉ != null && <div className="manover-fazis-ertek">VÉ: <strong>{aktívVÉ}</strong></div>}
        </div>
      );
    }
  }

  /** MP-választó gomb (a "Helyzetfüggő módosítók" gombbal azonos stílus). Popup: karikás fok-választó. */
  function renderMpGomb() {
    if (maxKölthető <= 0) return null;
    return (
      <button type="button" className="manover-szit-btn" onClick={() => setMpPickerNyitva(true)}>
        MP használata
        {költöttMP > 0 && <span className="manover-szit-sum manover-szit-pos">+{költöttMP}</span>}
      </button>
    );
  }

  function renderEllenpróba() {
    if (mód === 'aktív') {
      // §066_04: a Helyzetfüggő módosítók a DOBÁShoz adódnak (nem a Célszámhoz). A Célszám fix:
      // a Manőver Nehézsége + ellenfél Manőver Alapja. Pozitív szitMod könnyít (nagyobb dobás).
      const dobásÉrték = manőverAlap + költöttMP + belharcBónusz + szitModÖsszeg;
      const célszám = manőver.nehézség;
      return (
        <div className="manover-fazis-info">
          {módosítóTáblák.length > 0 && (
            <button type="button" className="manover-szit-btn manover-szit-btn-flash" onClick={() => setSzitPickerNyitva(true)}>
              Helyzetfüggő módosítók
              {szitLehetetlen
                ? <span className="manover-szit-sum manover-szit-neg">letilt</span>
                : szitImmunis
                ? <span className="manover-szit-sum manover-szit-pos">immunis</span>
                : szitModÖsszeg !== 0 && (
                  <span className={`manover-szit-sum${szitModÖsszeg > 0 ? ' manover-szit-pos' : ' manover-szit-neg'}`}>
                    {szitModÖsszeg > 0 ? '+' : ''}{szitModÖsszeg}
                  </span>
                )}
            </button>
          )}
          {renderMpGomb()}
          {!szitLehetetlen && !szitImmunis && (
            <div className="manover-ep-vs-row">
              <span className="manover-ep-side"><strong>{dobásÉrték}</strong> + {ellenpróbaHátrány2 ? <span className="manover-hatrany2">k{ELLENPRÓBA_KOCKA} (Hátrány{ELLENPRÓBA_NORMÁL_HIÁNY_EH})</span> : `k${ELLENPRÓBA_KOCKA}`}</span>
              <span className="manover-ep-vs">vs</span>
              <span className="manover-ep-side">
                <strong className="manover-celszam-ertek">{célszám}</strong>
                {' '}+ ellen MA
              </span>
            </div>
          )}
          {!szitLehetetlen && !szitImmunis && <ManoverDobasSor alap={dobásÉrték} alapLabel="Dobás" kocka={ELLENPRÓBA_KOCKA} szint={ellenpróbaHátrány2 ? ELLENPRÓBA_NORMÁL_HIÁNY_EH : 0} dobás={eDobás} setDobás={setEDobás} />}
        </div>
      );
    } else {
      const célszámAlap = manőverAlap + manőver.nehézség + költöttMP + belharcBónusz;
      return (
        <div className="manover-fazis-info">
          {renderMpGomb()}
          <div className="manover-ep-vs-row">
            <span className="manover-ep-side">Célszám: <strong className="manover-celszam-ertek">{célszámAlap}</strong></span>
          </div>
          <div className="manover-fazis-desc">Ellenfél dob: MA + k{ELLENPRÓBA_KOCKA} ≥ célszám</div>
        </div>
      );
    }
  }

  return (
    <>
    <PopupOverlay onClose={onClose} onEscape={() => { if (!szitPickerNyitva && !mpPickerNyitva && !téPopupNyitva && !véCsökkNyitva) onClose(); }}>
      <div className="manover-dobas-popup">
        <div className="manover-dobas-header">
          <span className="manover-dobas-title">{manőver.név} ({fázisok.join(' ')})</span>
          {/* VÉ mindig látható (a popup eltakarja a HarcHeader VÉ-dobozát): passzív manővernél kézi
              VÉ-csökkenés könyveléshez, aktívban a Megakasztás elleni védekezéshez kell. */}
          {aktívVÉ != null && <span className="manover-dobas-ve-chip">VÉ: <strong>{aktívVÉ}</strong></span>}
          <span className="manover-dobas-mod-label">{mód === 'aktív' ? 'Aktív' : 'Passzív'}</span>
        </div>

        {vanKönnyítés && (
          <div className="manover-konnyites-chip">
            {[könnyítés.meglepetés && 'Meglepetés', könnyítés.orvtámadás && 'Orvtámadás'].filter(Boolean).join(' + ')}: nincs Megakasztás és támadó dobás (a találat automatikus, sebzés a fegyvertáblán)
          </div>
        )}

        {vanKövetelmény && (
          <ManoverKovetelmenyLepes követelmények={követelmények} karakter={karakter} data={data} session={session} aktívFegyver={aktívFegyver}
            döntés={követelményDöntés} setDöntés={setKövetelményDöntés} kész={követelményKész}
            erősHiány={gépiStátusz.erősHiány} normálHiány={gépiStátusz.normálHiány} vanNormál={vanNormál} vanErős={vanErős} />
        )}

        <div className="manover-dobas-fazisok">
          {fázisok.map((f, i) => {
            const eredmény = eredmények[i];
            const isAktív = i === aktívFázisIdx;
            const isDonePhase = eredmény !== 'pending';
            // Determine if this phase was a success FOR THE MANŐVER.
            const sikeresAManőverSzempontjából = fázisSikeresM(i, eredmény);

            return (
              <div key={i} className={`manover-fazis${isAktív ? ' manover-fazis-aktiv' : ''}${isDonePhase ? ' manover-fazis-done' : ''}`}>
                <div className="manover-fazis-label">
                  {isDonePhase && (sikeresAManőverSzempontjából
                    ? <span className="manover-fazis-ok">✓ </span>
                    : <span className="manover-fazis-fail">✗ </span>
                  )}
                  {FÁZIS_FELIRAT[f]}
                </div>
                {isAktív && (
                  <>
                    {manőver.fázis_info?.[f] && (
                      <div className="manover-fazis-magyarazat">ⓘ {manőver.fázis_info[f]}</div>
                    )}
                    {/* E és V: a dobás-UI mindig kell (E: módosítók/MP/célszám; V: TÉ chip a
                        tényleges támadó dobás értékével - a magyarázat KIEGÉSZÍTI, nem helyettesíti).
                        M: a magyarázat helyettesíti a fix érték-sort (elkerüli az ellentmondást). */}
                    {(f === 'E' || f === 'V' || !manőver.fázis_info?.[f]) && renderFázisInfo(f)}
                    {/* Biztos rontás: 99 sentinel aktív E fázisban. (Immunis / passzív letilt → azonnali végeredmény, nincs aktív fázis.) */}
                    {/* A siker/kudarc gombok csak a Dobás UTÁN aktívak (aktív mód, V/E fázis): a dobás
                        adja az eredményt, előtte nincs mit elkönyvelni. Passzív módban nincs dobás-sor
                        (az ellenfél dob) → nincs gate. */}
                    <ManoverFazisChipek fázis={f} mód={mód} manőver={manőver}
                      biztosRontás={szitLehetetlen && f === 'E' && mód === 'aktív'}
                      letiltva={mód === 'aktív' && ((f === 'V' && !vDobás) || (f === 'E' && !eDobás))}
                      onSiker={handleSiker} />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {végeredmény !== 'folyamatban' && (
          <ManoverVegeredmeny végeredmény={végeredmény} mód={mód} manőver={manőver} büntetve={bünteti_büntetve} immunisLeírás={szitImmunis ? immunisLeírás : null}
            alsóAkció={véCsökkGombLátszik ? (
              <button type="button" className="manover-ve-csokk-btn manover-ve-csokk-pulse" onClick={() => setVéCsökkNyitva(true)}>
                VÉ csökkentés
                {véCsökkentésSzorzó && véCsökkentésSzorzó !== 1 && (
                  <span className="manover-ve-csokk-hint"> × {véCsökkentésSzorzó}{véCsökkentésSzorzóForrás ? ` (${véCsökkentésSzorzóForrás})` : ''}</span>
                )}
              </button>
            ) : undefined} />
        )}
      </div>
    </PopupOverlay>

    {szitPickerNyitva && (
      <ManoverSzitPicker táblák={módosítóTáblák} szitMods={szitMods} setSzitMods={setSzitMods} multiMods={multiMods} setMultiMods={setMultiMods}
        összeg={szitModÖsszeg} karakter={karakter} session={session} data={data} onClose={() => setSzitPickerNyitva(false)} />
    )}
    {mpPickerNyitva && <ManoverMpPicker költött={költöttMP} max={maxKölthető} onSelect={setKöltöttMP} onClose={() => setMpPickerNyitva(false)} />}
    {téPopupNyitva && (
      <ManoverTePopup módosító={manőver.végrehajtás_té_módosító} standard={mk.végrehajtás_TÉ_standard} aktívTÉ={aktívTÉ} onClose={() => setTéPopupNyitva(false)} />
    )}
    {véCsökkNyitva && véCsökkentésAlap && vDobás && (
      <VeCsokkentesPopup
        k20={vDobás.eredmény}
        alapTáblázat={véCsökkentésAlap}
        véCsökkentésSzorzó={véCsökkentésSzorzó}
        véCsökkentésSzorzóForrás={véCsökkentésSzorzóForrás}
        helyzetVéCsökkentés={helyzetVéCsökkentés}
        fegyverExtrák={fegyverExtrák}
        extraDefs={extraDefs}
        extraKontextus={extraKontextus}
        onClose={(eredmény) => {
          // A manőver-flow a rontott V után itt ér véget: az EREDMÉNY-ablakból (eredmény != null)
          // mellékattintva az egész flow-t zárjuk. A Fegyverviszony-választó fázisból (eredmény null)
          // csak a VÉ-popupot - vissza a végeredmény-sávhoz.
          if (eredmény) {
            // A rontott V dobás + a választott VÉ-csökkentés a TÉ-chip history-ba (mint a Támadó dobás).
            const vÖsszeg = (aktívTÉ ?? 0) + manőver.végrehajtás_té_módosító + (vDobás?.eredmény ?? 0);
            onTéDobás?.(vÖsszeg, eredmény.végső);
            onClose();
          } else {
            setVéCsökkNyitva(false);
          }
        }}
      />
    )}
    </>
  );
}

