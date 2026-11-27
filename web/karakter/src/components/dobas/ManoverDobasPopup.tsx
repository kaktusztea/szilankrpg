import { useState } from 'react';
import type { Karakter, Session, SetSession } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyLepteto } from './ElonyLepteto';
import { ForrasLista } from './ForrasLista';
import { KeziBonuszBtn } from './KeziBonuszBtn';
import { ExtrakInfo } from './ExtrakInfo';
import { VeCsokkentesPopup } from './VeCsokkentesPopup';
import type { Fegyverviszony } from '../../engine/harc/ve-csokkentes-calc';
import type { FegyverExtraDef } from '../../engine/data-types';
import type { ExtraKontextus } from '../../engine/extrak-info-calc';
import { netElőnySzint } from '../../engine/harc/combat-roll-info';
import type { DobásHatás } from '../../engine/harc/combat-roll-info';
import type { ProbaDobás } from '../../engine/dice';
import {
  type Mód, type FázisEredmény, type ManőverDef, type KövetelményDöntés,
  követelményÁllapot, parseFázisok, könnyítettFázisok, helyzetKönnyítés, aktívFegyverInfo,
  calcManőverPont, getBelharcFok, ellenpróbaBiztosKudarc, fázisCselekvő, manőverFázisSikeres, rontottVFázis,
  szitModKezdőÁllapot, szitTáblákMódszerint, szitModÁllapot,
} from '../../engine/harc/manover-dobas-calc';
import {
  ManoverDobasSor, ManoverKovetelmenyLepes, ManoverFazisChipek, ManoverVegeredmeny, ManoverSzitPicker, ManoverMpPicker, ManoverTePopup,
  type Végeredmény,
} from './ManoverDobasReszek';
import { ManoverFejlecChip, ManoverFazisFejlec, ManoverKapszulak, EllenprobaParbaj } from './ManoverFazisReszek';
import './dobas.css';

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
  setSession: SetSession;
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
  /** Harcképtelen (md/081, `harcképtelenForrások`): passzív módban a Megakasztás / Végrehajtás kimarad, csak az Ellenpróba. */
  harcképtelen?: boolean;
  onClose: () => void;
}

export function ManoverDobasPopup({ manőver, mód, karakter, session, setSession, data, manőverAlap, aktívTÉ, aktívVÉ, téHatások = [], véCsökkentésAlap, véCsökkentésSzorzó, véCsökkentésSzorzóForrás, helyzetVéCsökkentés = [], fegyverExtrák, extraDefs, extraKontextus, onTéDobás, harcképtelen = false, onClose }: Props) {
  const könnyítés = mód === 'aktív' ? helyzetKönnyítés(session) : { meglepetés: false, orvtámadás: false };
  const vanKönnyítés = könnyítés.meglepetés || könnyítés.orvtámadás;
  const aktívFegyver = mód === 'aktív' ? aktívFegyverInfo(karakter, session, data) : null;
  const nyersFázisok = parseFázisok(manőver.fázisok);
  const fázisok = könnyítettFázisok(nyersFázisok, mód, session, harcképtelen);
  const harcképtelenKönnyítés = harcképtelen && mód === 'passzív' && nyersFázisok.some(f => f !== 'E');
  const [eredmények, setEredmények] = useState<FázisEredmény[]>(fázisok.map(() => 'pending'));
  const [költöttMP, setKöltöttMP] = useState(0);
  // Kockadobások: csak a kocka értéke tárolt, az összeg élőben számol (a módosító/MP változása utólag is érvényes).
  const téHatásSzint = netElőnySzint(téHatások);
  const [téSzint, setTéSzint] = useState(téHatásSzint);
  const [téKéziBónusz, setTéKéziBónusz] = useState(0);
  const [vDobás, setVDobás] = useState<ProbaDobás | null>(null);
  const [eDobás, setEDobás] = useState<ProbaDobás | null>(null);

  // Helyzetfüggő módosítók - a dobó-oldalhoz illő táblák (mód_oldal szerint, §066_04). Aktív: aktív-
  // oldali táblák + globális módosítók; passzív: passzív-oldali táblák (fegyver-extrák, pl. Fegyvertörés-immunis).
  const módosítóTáblák = szitTáblákMódszerint(manőver.helyzetfüggő_módosítók, mód, data);
  // A popupon belül egyszerre legfeljebb egy al-popup nyitott (TÉ magyarázat / MP / Helyzetfüggő módosítók / VÉ csökkentés).
  const [alPopup, setAlPopup] = useState<'té' | 'mp' | 'szit' | 'véCsökk' | null>(null);
  // Outside click in the middle of the multi-phase flow asks first (accidental tap would lose the phases)
  const [megszakításKérdés, setMegszakításKérdés] = useState(false);
  const alZár = () => setAlPopup(null);
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

  // 0. lépés: követelmények (CSAK aktív módban - az alkalmazóra vonatkoznak), egyszer kiértékelve.
  const követelmények = mód === 'aktív' ? (manőver.követelmények ?? []) : [];
  const vanKövetelmény = követelmények.length > 0;
  const kövÁllapot = követelményÁllapot(követelmények, karakter, data, session, aktívFegyver);
  // Gépi Erős hiány → auto-kudarc; minden gépileg teljesül → auto "mind" (nincs KM-jóváhagyás).
  const [követelményDöntés, setKövetelményDöntés] = useState<KövetelményDöntés>(kövÁllapot.kezdőDöntés);
  // A 0. lépés akkor "kész", ha van döntés (vagy nincs követelmény).
  const követelményKész = !vanKövetelmény || követelményDöntés !== 'pending';
  const követelményKudarc = követelményDöntés === 'erős';
  // Hátrány-2 az Ellenpróbán, ha a döntés "normál" (Normál hiány).
  const ellenpróbaHátrány = követelményDöntés === 'normál' ? ELLENPRÓBA_NORMÁL_HIÁNY_EH : null;

  const fázisSikeresM = (i: number, e: FázisEredmény) => manőverFázisSikeres(fázisok[i], e, manőver);

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
  // Anything done in the flow yet (a phase result, a roll, spent MP, a requirement decision) - only then an outside click asks.
  const vanHaladás = eredmények.some(e => e !== 'pending') || vDobás != null || eDobás != null || költöttMP > 0
    || követelményDöntés !== kövÁllapot.kezdőDöntés;

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

  // Az „Extrák" gomb kontextusa a manőver-módhoz igazítva: a manőver_állapot-feltételes extrák
  // (pl. Fegyvertörés-immunis passzív oldalon) és a manőver-al-feltételes hatások helyes státuszt
  // kapjanak. A mód (aktív/passzív) → manőverÁllapot, a manőver id → aktívManőver.
  const manőverExtraKontextus = extraKontextus && {
    ...extraKontextus,
    manőverÁllapot: mód,
    aktívManőver: manőver.id,
  };

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

  /** Final Végrehajtás TÉ (aktív mode only): base TÉ + manőver modifier + manual bonus. */
  const téVégső = mód === 'aktív' && aktívTÉ != null ? aktívTÉ + manőver.végrehajtás_té_módosító + téKéziBónusz : null;
  /** Rolled Végrehajtás total (aktív): final TÉ + k20. */
  const vÖsszeg = téVégső != null && vDobás ? téVégső + vDobás.eredmény : null;
  /** Ellenpróba modifiers (MP + belharc + situational): aktív → added to my roll, passzív → to the opponent's target. */
  const ellenpróbaMódosító = költöttMP + belharcBónusz + szitModÖsszeg;
  /** Aktív Ellenpróba roll base (Manőver Alap + modifiers), without the k10. */
  const ellenpróbaAlap = manőverAlap + ellenpróbaMódosító;

  /** Aktív Ellenpróba roll: below the bare Nehézség the target can't be reached even with ellen MA 0 -> auto "Nem értem el". */
  function onEDobás(d: ProbaDobás | null) {
    setEDobás(d);
    if (d && ellenpróbaBiztosKudarc(ellenpróbaAlap + d.eredmény, manőver.nehézség)) handleSiker(false);
  }

  /** Rolled result shown in a closed phase header (aktív V/E only; passive mode has no own roll). */
  function lezártÉrték(f: 'M' | 'V' | 'E'): string | null {
    if (mód !== 'aktív') return null;
    if (f === 'V' && vÖsszeg != null) return `${vÖsszeg}`;
    if (f === 'E' && eDobás) return `${ellenpróbaAlap + eDobás.eredmény} vs ${manőver.nehézség}+MA`;
    return null;
  }

  function renderVégrehajtás() {
    if (mód === 'aktív') {
      return (
        <div className="manover-fazis-info manover-te-center">
          {/* Same E/H block as the Támadó dobás: stepper + its sources (with "back to computed") */}
          {téVégső != null && !vDobás && (
            <div className="elony-blokk manover-elony-blokk">
              <ElonyLepteto szint={téSzint} onChange={setTéSzint} />
              <ForrasLista hatások={téHatások} szint={téSzint} alapSzint={téHatásSzint} onVissza={() => setTéSzint(téHatásSzint)} />
            </div>
          )}
          {téVégső != null && !vDobás && <KeziBonuszBtn kapszula bónusz={téKéziBónusz} onChange={setTéKéziBónusz} />}
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

  const kapszulák = (
    <ManoverKapszulak vanSzit={módosítóTáblák.length > 0} vanMp={maxKölthető > 0}
      szitÖsszeg={szitModÖsszeg} szitLehetetlen={szitLehetetlen} szitImmunis={szitImmunis} költöttMP={költöttMP}
      onSzit={() => setAlPopup('szit')} onMp={() => setAlPopup('mp')} />
  );

  function renderEllenpróba() {
    if (mód === 'aktív') {
      // §066_04: a Helyzetfüggő módosítók a DOBÁShoz adódnak (nem a Célszámhoz). A Célszám fix:
      // a Manőver Nehézsége + ellenfél Manőver Alapja. Pozitív szitMod könnyít (nagyobb dobás).
      // Dobás után a módosítók (Helyzet, MP) zárolva: utólag már nem változtathatják az eredményt.
      const dobható = !szitLehetetlen && !szitImmunis;
      return (
        <div className="manover-fazis-info">
          {dobható && !eDobás && (
            <EllenprobaParbaj alap={ellenpróbaAlap} kocka={ELLENPRÓBA_KOCKA} hátrány={ellenpróbaHátrány} célszám={manőver.nehézség} />
          )}
          {!eDobás && kapszulák}
          {dobható && (
            <ManoverDobasSor alap={ellenpróbaAlap} alapLabel="Alap" kocka={ELLENPRÓBA_KOCKA} szint={ellenpróbaHátrány ?? 0}
              dobás={eDobás} setDobás={onEDobás}
              cél={<><strong className="manover-celszam-ertek">{manőver.nehézség}</strong> + ellen MA</>} />
          )}
        </div>
      );
    }
    // Passzív: a passzív-oldali táblák (pl. fegyver-extrák: "Lefegyverzés ellene nehezebb +2") a passzív
    // fél szemszögéből értendők - pozitív = neki kedvez → az ellenfél célszáma nő (mint a költött MP).
    const célszám = manőverAlap + manőver.nehézség + ellenpróbaMódosító;
    return (
      <div className="manover-fazis-info">
        {kapszulák}
        <div className="manover-ep-vs-row">
          <span className="manover-ep-side">Célszám: <strong className="manover-celszam-ertek">{célszám}</strong></span>
        </div>
        <div className="manover-fazis-desc">Ellenfél dob: MA + k{ELLENPRÓBA_KOCKA} ≥ célszám</div>
      </div>
    );
  }

  /** Body of the active phase: mode-aware explanation, phase info and the outcome buttons. */
  function renderAktívFázis(f: 'M' | 'V' | 'E') {
    // A fázis_info mód-tudatos: aktív = alkalmazó nézőpont, passzív = elszenvedő nézőpont
    // (data/sources/manoverek.yaml `fázis_info: { aktív, passzív }`).
    const magyarázat = manőver.fázis_info?.[mód]?.[f];
    return (
      <>
        {magyarázat && <div className="manover-fazis-magyarazat">ⓘ {magyarázat}</div>}
        {/* E és V: a dobás-UI mindig kell (a magyarázat KIEGÉSZÍTI). M: a magyarázat helyettesíti a fix
            érték-sort (elkerüli az ellentmondást). */}
        {(f === 'E' || f === 'V' || !magyarázat) && renderFázisInfo(f)}
        {/* Biztos rontás: 99 sentinel aktív E fázisban. A siker/kudarc gombok aktív V/E fázisban csak a
            Dobás UTÁN jelennek meg (a dobás adja az eredményt); passzív módban az ellenfél dob → nincs gate. */}
        <ManoverFazisChipek fázis={f} mód={mód} manőver={manőver}
          biztosRontás={szitLehetetlen && f === 'E' && mód === 'aktív'}
          letiltva={mód === 'aktív' && ((f === 'V' && !vDobás) || (f === 'E' && !eDobás))}
          onSiker={handleSiker} />
      </>
    );
  }

  return (
    <>
    <PopupOverlay onClose={() => (vanHaladás && végeredmény === 'folyamatban' ? setMegszakításKérdés(true) : onClose())}
      onEscape={() => { if (!alPopup) onClose(); }}>
      <div className="manover-dobas-popup">
        <div className="manover-dobas-header">
          <span className="manover-dobas-title">{manőver.név} ({fázisok.join(' ')})</span>
          <ManoverFejlecChip mód={mód} aktFázis={aktívFázisIdx >= 0 ? fázisok[aktívFázisIdx] : null} fázisok={fázisok}
            lezárt={végeredmény !== 'folyamatban'} aktívTÉ={aktívTÉ} aktívVÉ={aktívVÉ} téMódosító={manőver.végrehajtás_té_módosító} />
          <span className="manover-dobas-mod-label">{mód === 'aktív' ? 'Aktív' : 'Passzív'}</span>
        </div>

        {manőverExtraKontextus && (
          <ExtrakInfo fegyverExtrák={fegyverExtrák} extraDefs={extraDefs} kontextus={manőverExtraKontextus} csakManőver />
        )}

        {vanKönnyítés && (
          <div className="manover-konnyites-chip">
            {[könnyítés.meglepetés && 'Meglepetés', könnyítés.orvtámadás && 'Orvtámadás'].filter(Boolean).join(' + ')}: nincs Megakasztás és támadó dobás (a találat automatikus, sebzés a fegyvertáblán)
          </div>
        )}

        {harcképtelenKönnyítés && (
          <div className="manover-konnyites-chip">
            Harcképtelen: a Megakasztás automatikus kudarc, a Végrehajtás automatikus siker (az ellenfélé) - csak az Ellenpróbát dobod
          </div>
        )}

        {vanKövetelmény && (
          <ManoverKovetelmenyLepes követelmények={követelmények} állapot={kövÁllapot} data={data}
            döntés={követelményDöntés} setDöntés={setKövetelményDöntés} kész={követelményKész} />
        )}

        <div className="manover-dobas-fazisok">
          {fázisok.map((f, i) => {
            const isAktív = i === aktívFázisIdx;
            const kész = eredmények[i] !== 'pending';
            return (
              <div key={i} className={`manover-fazis${isAktív ? ' manover-fazis-aktiv' : ''}${kész ? ' manover-fazis-done' : ''}`}>
                <ManoverFazisFejlec fázis={f} aktív={isAktív} kész={kész} sikeres={fázisSikeresM(i, eredmények[i])}
                  lezártÉrték={kész ? lezártÉrték(f) : null} téVégső={téVégső} onTé={() => setAlPopup('té')} />
                {isAktív && renderAktívFázis(f)}
              </div>
            );
          })}
        </div>

        {végeredmény !== 'folyamatban' && (
          <ManoverVegeredmeny végeredmény={végeredmény} mód={mód} manőver={manőver} büntetve={bünteti_büntetve} immunisLeírás={szitImmunis ? immunisLeírás : null}
            alsóAkció={véCsökkGombLátszik ? (
              <button type="button" className="manover-ve-csokk-btn manover-ve-csokk-pulse" onClick={() => setAlPopup('véCsökk')}>
                VÉ csökkentés
                {véCsökkentésSzorzó && véCsökkentésSzorzó !== 1 && (
                  <span className="manover-ve-csokk-hint"> × {véCsökkentésSzorzó}{véCsökkentésSzorzóForrás ? ` (${véCsökkentésSzorzóForrás})` : ''}</span>
                )}
              </button>
            ) : undefined} />
        )}
      </div>
    </PopupOverlay>

    {alPopup === 'szit' && (
      <ManoverSzitPicker táblák={módosítóTáblák} szitMods={szitMods} setSzitMods={setSzitMods} multiMods={multiMods} setMultiMods={setMultiMods}
        összeg={szitModÖsszeg} karakter={karakter} session={session} data={data} onClose={alZár} />
    )}
    {megszakításKérdés && (
      <PopupOverlay onClose={() => setMegszakításKérdés(false)} centerText className="kep-prompt torles-megerosites">
        <label className="kep-prompt-label-bold">Megszakítod a manővert?</label>
        <span className="overlay-desc-dim">Az eddigi fázisok eredménye elvész.</span>
        <div className="manover-megszakitas-gombok">
          <button type="button" className="he-field-btn" onClick={() => setMegszakításKérdés(false)}>Folytatás</button>
          <button type="button" className="btn-halvany-veszely" onClick={onClose}>Megszakítás</button>
        </div>
      </PopupOverlay>
    )}
    {alPopup === 'mp' && <ManoverMpPicker költött={költöttMP} max={maxKölthető} onSelect={setKöltöttMP} onClose={alZár} />}
    {alPopup === 'té' && (
      <ManoverTePopup módosító={manőver.végrehajtás_té_módosító} standard={mk.végrehajtás_TÉ_standard} aktívTÉ={aktívTÉ} onClose={alZár} />
    )}
    {alPopup === 'véCsökk' && véCsökkentésAlap && vDobás && (
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
            onTéDobás?.(vÖsszeg ?? 0, eredmény.végső);
            onClose();
          } else {
            alZár();
          }
        }}
      />
    )}
    </>
  );
}

