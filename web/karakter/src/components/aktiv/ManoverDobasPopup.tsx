import { useState } from 'react';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { ModositoTabla, ManoverKövetelmény } from '../../engine/data-types';
import { PopupOverlay } from '../PopupOverlay';
import { calcSzitModÖsszeg } from '../tulajdonsagok/kepzettseg-proba-calc';

export type Mód = 'aktív' | 'passzív';
export type FázisEredmény = 'pending' | 'igen' | 'nem';

interface ManőverDef {
  név: string;
  nehézség: number;
  fázisok: string;
  fázis_info: Record<string, string>;
  fázis_cselekvő: Record<string, 'én' | 'ellenfél'>;
  ellenpróba_bünteti: boolean;
  típus: string;
  hatás: string[];
  végrehajtás_té_módosító: number;
  követelmények: ManoverKövetelmény[];
  helyzetfüggő_módosítók: ModositoTabla[];
}

/** Egy harcmodor-képzettség szintje-e, ill. bármely harcmodor max szintje ("Harcmodor"). */
function harcmodorMaxSzint(karakter: Karakter, data: GameData): number {
  const nevek = new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[]);
  return Math.max(0, ...karakter.képzettségek.filter(k => nevek.has(k.név)).map(k => k.szint));
}

/**
 * Gépi (auto-kiértékelt) követelmény teljesül-e a karakter alapján.
 * Informatív ('egyéb') követelményt NEM lehet gépileg értékelni → null (a játékos dönt).
 */
export function követelményTeljesül(köv: ManoverKövetelmény, karakter: Karakter, data: GameData): boolean | null {
  if (köv.típus === 'egyéb') return null;
  const küszöb = köv.érték ?? 0;
  if (köv.típus === 'képzettség') {
    const szint = köv.név === 'Harcmodor'
      ? harcmodorMaxSzint(karakter, data)
      : (karakter.képzettségek.find(k => k.név === köv.név)?.szint ?? 0);
    return szint >= küszöb;
  }
  // fortély: a felvett (max) fok
  const fok = Math.max(0, ...karakter.fortélyok.filter(f => f.név === köv.név).map(f => f.fok));
  return fok >= küszöb;
}

/**
 * A gépi követelmények kiértékelése egy manőverre.
 * - `erősHiány`: van hiányzó gépi Erős követelmény → auto-kudarc (nem dobható).
 * - `normálHiány`: van hiányzó gépi Normál követelmény → a "Teljesül mind" gomb tiltandó.
 */
export function gépiKövetelményStátusz(
  követelmények: ManoverKövetelmény[], karakter: Karakter, data: GameData,
): { erősHiány: boolean; normálHiány: boolean } {
  let erősHiány = false, normálHiány = false;
  for (const köv of követelmények) {
    const teljesül = követelményTeljesül(köv, karakter, data);
    if (teljesül === false) {
      if (köv.erősség === 'erős') erősHiány = true;
      else normálHiány = true;
    }
  }
  return { erősHiány, normálHiány };
}

interface Props {
  manőver: ManőverDef;
  mód: Mód;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  data: GameData;
  /** Manőver Alap — kanonikus érték a reactive engine-ből (rules.json: manőver_alap). */
  manőverAlap: number;
  /** Aktív fegyver TÉ (from Harc fül computed — may be unavailable). */
  aktívTÉ: number | null;
  /** Aktuális VÉ (base - csökkenés). */
  aktívVÉ: number | null;
  onClose: () => void;
}

/** Parse fázisok string (e.g. "M,V,E" or "E (M*)") into ordered phase list. */
/** Parse fázisok string (e.g. "M,V,E" or "E (M*)") into phase list, PRESERVING the
 *  order of appearance in the string (the `fázisok:` field encodes the intended order).
 *  A `*` marker (conditional phase) is ignored; duplicates removed. */
export function parseFázisok(s: string): ('M' | 'V' | 'E')[] {
  const result: ('M' | 'V' | 'E')[] = [];
  for (const ch of s) {
    if ((ch === 'M' || ch === 'V' || ch === 'E') && !result.includes(ch)) {
      result.push(ch);
    }
  }
  return result;
}

function calcManőverPont(karakter: Karakter, data: GameData): number {
  const { képzettségek, tsz } = karakter;
  const harcmodorNevek = [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])];
  const összeg = harcmodorNevek.reduce((s, n) => s + (képzettségek.find(k => k.név === n)?.szint ?? 0), 0);
  return Math.ceil(összeg * 2 / (tsz || 1));
}

function getBelharcFok(karakter: Karakter): number {
  const f = karakter.fortélyok.find(f => f.név === 'Belharc');
  return f?.fok ?? 0;
}

export interface TéBontásSor { forrás: string; érték: number }

/**
 * A Manőver popup közelítő TÉ-bontása (a HarcScreen `baseTÉ` képletének EGYETLEN forrása).
 * A HarcScreen ennek az összegét használja — így a bontás és az összeg sosem driftel szét.
 * ponytail: közelítő (per-fegyver módosítók nélkül), ahogy a `baseTÉ` komment is jelzi.
 */
export function téBontás(karakter: Karakter, data: GameData): TéBontásSor[] {
  const t = karakter.tulajdonságok;
  return [
    { forrás: 'Alap TÉ', érték: data.konstansok.harcérték_alap?.TÉ ?? 0 },
    { forrás: 'Erő', érték: t.erő },
    { forrás: 'Ügyesség', érték: t.ügyesség },
    { forrás: 'Gyorsaság', érték: t.gyorsaság },
    { forrás: 'Harcmodor (HM)', érték: karakter.HM_TÉ },
  ];
}

export function téBontásÖsszeg(karakter: Karakter, data: GameData): number {
  return téBontás(karakter, data).reduce((s, r) => s + r.érték, 0);
}

export function ManoverDobasPopup({ manőver, mód, karakter, session, setSession, data, manőverAlap, aktívTÉ, aktívVÉ, onClose }: Props) {
  const fázisok = parseFázisok(manőver.fázisok);
  const [eredmények, setEredmények] = useState<FázisEredmény[]>(fázisok.map(() => 'pending'));
  const [költöttMP, setKöltöttMP] = useState(0);

  // Helyzetfüggő módosítók — CSAK aktív módban (mindig az alkalmazó módosítói).
  const módosítóTáblák = mód === 'aktív' ? (manőver.helyzetfüggő_módosítók ?? []) : [];
  const [szitPickerNyitva, setSzitPickerNyitva] = useState(false);
  const [mpPickerNyitva, setMpPickerNyitva] = useState(false);
  const [téPopupNyitva, setTéPopupNyitva] = useState(false);
  const [szitMods, setSzitMods] = useState<Record<string, number>>({});
  const [multiMods, setMultiMods] = useState<Record<string, boolean[]>>(
    () => Object.fromEntries(módosítóTáblák.filter(t => t.mód === 'multi').map(t => [t.kategória, t.sorok.map(() => false)])),
  );
  // Manőverhez nincs próba-enyhítés → üres lista.
  const szitModÖsszeg = calcSzitModÖsszeg(módosítóTáblák, szitMods, multiMods, []);

  const manőverPont = calcManőverPont(karakter, data);
  const aktMP = Math.max(0, manőverPont - session.manőver_pont_használt);
  const belharcFok = getBelharcFok(karakter);
  const isBelharcos = manőver.típus === 'belharcos';
  const maxKölthető = mód === 'aktív'
    ? Math.min(aktMP, data.konstansok.manőver?.max_mp_támadó ?? 4)
    : Math.min(aktMP, data.konstansok.manőver?.max_mp_védő ?? 2);
  const belharcSzorzó = data.konstansok.manőver?.belharc_fok_szorzó ?? 2;

  // 0. lépés: követelmények (CSAK aktív módban — az alkalmazóra vonatkoznak).
  const követelmények = mód === 'aktív' ? (manőver.követelmények ?? []) : [];
  const vanKövetelmény = követelmények.length > 0;
  // Egy erősségre csak akkor kell "hiány" gomb, ha van HIÁNYOZHATÓ eleme:
  // informatív (a játékos dönthet hiányról) VAGY gépi, ami nem teljesül.
  // Ha egy erősség minden eleme gépi ÉS mind teljesül → a hiány kizárt → nincs gomb.
  const hiányLehet = (erősség: 'normál' | 'erős') =>
    követelmények.some(k => k.erősség === erősség
      && (k.típus === 'egyéb' || követelményTeljesül(k, karakter, data) === false));
  const vanNormál = hiányLehet('normál');
  const vanErős = hiányLehet('erős');
  const gépiStátusz = gépiKövetelményStátusz(követelmények, karakter, data);
  // Auto-kudarc, ha gépi Erős hiány. Ekkor a döntés nem is választható.
  const [követelményDöntés, setKövetelményDöntés] = useState<'pending' | 'mind' | 'normál' | 'erős'>(
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
  const aktívFázisIdx = (!követelményKész || követelményKudarc || manőverMárSikertelen)
    ? -1 : eredmények.findIndex(e => e === 'pending');
  const végeredmény: 'folyamatban' | 'sikeres' | 'sikertelen' =
    követelményKudarc ? 'sikertelen'
    : !követelményKész ? 'folyamatban'
    : manőverMárSikertelen ? 'sikertelen'
    : eredmények.includes('pending') ? 'folyamatban'
    : eredmények.every((e, i) => fázisSikeresM(i, e)) ? 'sikeres' : 'sikertelen';

  // Bünteti-manőver (Átsiklás/Kibontakozás) sikeres, de rontott ellenpróbával → "büntetve"
  // (a manőver átment, de megcsaphatták/megcsaptad). Ez a végeredmény-sáv SÁRGA átmeneti állapota.
  const bünteti_büntetve = végeredmény === 'sikeres' && manőver.ellenpróba_bünteti
    && fázisok.some((f, i) => f === 'E' && eredmények[i] === 'nem');

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
      // Ellenem támadnak — szükségem van a VÉ-mre.
      return (
        <div className="manover-fazis-info">
          <div className="manover-fazis-desc">Ellenfél támad a VÉ-d ellen</div>
          {aktívVÉ != null && <div className="manover-fazis-ertek">VÉ: <strong>{aktívVÉ}</strong></div>}
        </div>
      );
    } else {
      // Én támadok (megakasztás) — szükségem van a TÉ-mre.
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
            <button className="manover-te-chip" onClick={() => setTéPopupNyitva(true)}>
              TÉ: <strong>{téVégső}</strong> <span className="manover-te-info">ⓘ</span>
            </button>
          )}
        </div>
      );
    } else {
      return (
        <div className="manover-fazis-info">
          <div className="manover-fazis-desc">Ellenfél támad TÉ+4-gyel</div>
          {aktívVÉ != null && <div className="manover-fazis-ertek">VÉ: <strong>{aktívVÉ}</strong></div>}
        </div>
      );
    }
  }

  /** MP-választó gomb (a "Helyzetfüggő módosítók" gombbal azonos stílus). Popup: karikás fok-választó. */
  function renderMpGomb() {
    if (maxKölthető <= 0) return null;
    return (
      <button className="manover-szit-btn" onClick={() => setMpPickerNyitva(true)}>
        MP használata
        {költöttMP > 0 && <span className="manover-szit-sum manover-szit-pos">+{költöttMP}</span>}
      </button>
    );
  }

  function renderEllenpróba() {
    if (mód === 'aktív') {
      const dobásÉrték = manőverAlap + költöttMP + (isBelharcos ? belharcFok * belharcSzorzó : 0);
      const célszám = manőver.nehézség + szitModÖsszeg;
      return (
        <div className="manover-fazis-info">
          {módosítóTáblák.length > 0 && (
            <button className="manover-szit-btn" onClick={() => setSzitPickerNyitva(true)}>
              Helyzetfüggő módosítók
              {szitModÖsszeg !== 0 && (
                <span className={`manover-szit-sum${szitModÖsszeg > 0 ? ' manover-szit-neg' : ' manover-szit-pos'}`}>
                  {szitModÖsszeg > 0 ? '+' : ''}{szitModÖsszeg}
                </span>
              )}
            </button>
          )}
          {renderMpGomb()}
          <div className="manover-ep-vs-row">
            <span className="manover-ep-side"><strong>{dobásÉrték}</strong> + {ellenpróbaHátrány2 ? <span className="manover-hatrany2">k10 (Hátrány-2)</span> : 'k10'}</span>
            <span className="manover-ep-vs">vs</span>
            <span className="manover-ep-side">
              <strong className="manover-celszam-ertek">{célszám}</strong>
              {' '}+ ellen MA
            </span>
          </div>
        </div>
      );
    } else {
      const célszámAlap = manőverAlap + manőver.nehézség + költöttMP + (isBelharcos ? belharcFok * belharcSzorzó : 0);
      return (
        <div className="manover-fazis-info">
          {renderMpGomb()}
          <div className="manover-ep-vs-row">
            <span className="manover-ep-side">Célszám: <strong className="manover-celszam-ertek">{célszámAlap}</strong></span>
          </div>
          <div className="manover-fazis-desc">Ellenfél dob: MA + k10 ≥ célszám</div>
        </div>
      );
    }
  }

  /** Fázis label. */
  function fázisLabel(f: 'M' | 'V' | 'E'): string {
    switch (f) {
      case 'M': return '(M)egakasztás';
      case 'V': return '(V)égrehajtás';
      case 'E': return '(E)llenpróba';
    }
  }

  return (
    <>
    <PopupOverlay onClose={onClose} onEscape={() => { if (!szitPickerNyitva && !mpPickerNyitva && !téPopupNyitva) onClose(); }}>
      <div className="manover-dobas-popup">
        <div className="manover-dobas-header">
          <span className="manover-dobas-title">{manőver.név} ({fázisok.join(' ')})</span>
          <span className="manover-dobas-mod-label">{mód === 'aktív' ? 'Aktív' : 'Passzív'}</span>
        </div>

        {vanKövetelmény && (
          <div className={`manover-kov-lepes${követelményKész ? ' manover-fazis-done' : ' manover-fazis-aktiv'}`}>
            <div className="manover-fazis-label">Követelmények</div>
            <div className="manover-kov-lista">
              {követelmények.map((köv, i) => {
                const teljesül = követelményTeljesül(köv, karakter, data);
                const cimke = köv.típus === 'egyéb'
                  ? köv.leírás
                  : `${köv.név}${köv.érték != null ? ` ${köv.érték}${köv.típus === 'fortély' ? '.fok' : '.szint'}` : ''}`;
                return (
                  <div key={i} className="manover-kov-sor">
                    <span className={`manover-kov-erosseg manover-kov-${köv.erősség}`}>{köv.erősség === 'erős' ? '🟥' : '🟨'}</span>
                    <span className="manover-kov-cimke">{cimke}</span>
                    {teljesül === true && <span className="manover-fazis-ok">✓</span>}
                    {teljesül === false && <span className="manover-fazis-fail">✗</span>}
                    {teljesül === null && <span className="manover-kov-info">?</span>}
                  </div>
                );
              })}
            </div>
            {gépiStátusz.erősHiány
              ? <div className="manover-kov-auto-fail">Erős követelmény hiányzik — a manőver nem kísérelhető meg.</div>
              : !követelményKész && (
                <div className="manover-fazis-chips">
                  <button className="manover-chip manover-chip-igen"
                    disabled={gépiStátusz.normálHiány}
                    onClick={() => setKövetelményDöntés('mind')}>Teljesül mind</button>
                  {vanNormál && (
                    <button className="manover-chip manover-chip-normal"
                      onClick={() => setKövetelményDöntés('normál')}>Normál hiány</button>
                  )}
                  {vanErős && (
                    <button className="manover-chip manover-chip-nem"
                      onClick={() => setKövetelményDöntés('erős')}>Erős hiány</button>
                  )}
                </div>
              )}
          </div>
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
                  {fázisLabel(f)}
                </div>
                {isAktív && (
                  <>
                    {manőver.fázis_info?.[f] && (
                      <div className="manover-fazis-magyarazat">ⓘ {manőver.fázis_info[f]}</div>
                    )}
                    {/* M/V: a magyarázat helyettesíti a fix érték-sort (elkerüli az ellentmondást).
                        E: a magyarázat KIEGÉSZÍTŐ — a dobás-UI (módosítók, MP, célszám) mindig kell. */}
                    {(f === 'E' || !manőver.fázis_info?.[f]) && renderFázisInfo(f)}
                    <div className="manover-fazis-chips">
                      {/* Szín az ALKALMAZÓ szempontjából: aktívban a manőver-siker jó (zöld);
                          passzívban ÉN védekezem, így a manőver-siker nekem ROSSZ (piros). */}
                      {(() => {
                        // ellenpróba_bünteti + E: a rontott dobás is sikeres manőver (csak büntetés).
                        // A feliratok és a szín az ALKALMAZÓ/VÉDŐ szemszögéből mód-függők.
                        const bünt = manőver.ellenpróba_bünteti && f === 'E';
                        if (bünt) {
                          // handleSiker(true) = elért (nincs büntetés); handleSiker(false) = rontott (büntetés).
                          const felirat = mód === 'passzív'
                            ? { siker: 'Átjutott', kudarc: 'Megcsapkodod (1x)' }   // ellenfél siklik mellettem
                            : { siker: 'Sikeres', kudarc: 'Rontott (megcsapkodnak)' };
                          const sikerZöld = mód !== 'passzív';               // passzívban az ő sikere nekem rossz
                          return <>
                            <button className={`manover-chip ${sikerZöld ? 'manover-chip-igen' : 'manover-chip-nem'}`} onClick={() => handleSiker(true)}>{felirat.siker}</button>
                            <button className={`manover-chip ${sikerZöld ? 'manover-chip-nem' : 'manover-chip-igen'}`} onClick={() => handleSiker(false)}>{felirat.kudarc}</button>
                          </>;
                        }
                        const felirat = getFázisFelirat(f, mód, fázisCselekvő(f, manőver.fázis_cselekvő));
                        const sikerZöld = mód !== 'passzív';
                        return <>
                          <button className={`manover-chip ${sikerZöld ? 'manover-chip-igen' : 'manover-chip-nem'}`} onClick={() => handleSiker(true)}>{felirat.siker}</button>
                          <button className={`manover-chip ${sikerZöld ? 'manover-chip-nem' : 'manover-chip-igen'}`} onClick={() => handleSiker(false)}>{felirat.kudarc}</button>
                        </>;
                      })()}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {végeredmény !== 'folyamatban' && (
          <div className={`manover-dobas-veg ${
            bünteti_büntetve ? 'manover-veg-buntetve'
            : (végeredmény === 'sikeres') === (mód !== 'passzív') ? 'manover-veg-sikeres' : 'manover-veg-sikertelen'}`}>
            {bünteti_büntetve
              ? (mód === 'passzív'
                  ? '⚠ Átjutott, de megcsaptad (1x)'
                  : '⚠ Sikeres, de megcsaptak (1x)')
              : végeredmény === 'sikeres'
              ? (mód === 'passzív' ? '✓ Manőver sikeres ellened' : '✓ Manőver sikeres')
              : (mód === 'passzív' ? '✗ Manőver sikertelen ellened' : '✗ Manőver sikertelen')}
            {végeredmény === 'sikeres' && (
              <div className="manover-dobas-hatas">
                {eredményHatás(manőver.hatás).map((mondat, i) => (
                  <div key={i} className="manover-dobas-hatas-mondat">{mondat}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PopupOverlay>

    {szitPickerNyitva && (
      <PopupOverlay className="kep-prompt kep-proba-szit-popup" onClose={() => setSzitPickerNyitva(false)}>
        <label className="kep-prompt-label-bold-mb">Helyzetfüggő módosítók</label>
        <div className="kep-proba-szit-body">
            {módosítóTáblák.map(t => (
              <div key={t.kategória} className="kep-proba-szit-cat">
                <span className="kep-proba-szit-label">{t.kategória}</span>
                <div className="kep-proba-szit-items">
                  {t.sorok.map((s, i) => {
                    const isMulti = t.mód === 'multi';
                    const isActive = isMulti ? !!(multiMods[t.kategória]?.[i]) : szitMods[t.kategória] === i;
                    const handleClick = isMulti
                      ? () => setMultiMods(m => ({ ...m, [t.kategória]: m[t.kategória].map((v, j) => j === i ? !v : v) }))
                      : () => setSzitMods(m => ({ ...m, [t.kategória]: m[t.kategória] === i ? -1 : i }));
                    return (
                      <button key={i}
                        className={`kep-proba-szit-item${isActive ? ' kep-proba-szit-item-active' : ''}${s.érték > 0 ? ' kep-proba-szit-neg' : s.érték < 0 ? ' kep-proba-szit-pos' : ''}`}
                        onClick={handleClick}>
                        <span className="kep-proba-szit-val">{s.érték > 0 ? '+' : ''}{s.érték}</span>
                        <span className="kep-proba-szit-desc">{s.leírás}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
        {szitModÖsszeg !== 0 && (
          <div className={`kep-proba-szit-sum-footer${szitModÖsszeg > 0 ? ' kep-proba-szit-neg' : ' kep-proba-szit-pos'}`}>
            Összesen: {szitModÖsszeg > 0 ? '+' : ''}{szitModÖsszeg}
          </div>
        )}
      </PopupOverlay>
    )}

    {mpPickerNyitva && (
      <PopupOverlay onClose={() => setMpPickerNyitva(false)}>
        <label className="kep-prompt-label-bold-mb">MP használata</label>
        <div className="kep-prompt-flex-fok">
          <button className={`fort-fok-btn${költöttMP === 0 ? ' active' : ''}`}
            onClick={() => { setKöltöttMP(0); setMpPickerNyitva(false); }}>0</button>
          {Array.from({ length: maxKölthető }, (_, i) => i + 1).map(n => (
            <button key={n} className={`fort-fok-btn${költöttMP === n ? ' active' : ''}`}
              onClick={() => { setKöltöttMP(n); setMpPickerNyitva(false); }}>+{n}</button>
          ))}
        </div>
      </PopupOverlay>
    )}

    {téPopupNyitva && (
      <PopupOverlay className="kep-prompt manover-te-popup" onClose={() => setTéPopupNyitva(false)}>
        <label className="kep-prompt-label-bold-mb">Manőver TÉ módosító</label>
        <div className="manover-te-body">
          {manőver.végrehajtás_té_módosító > 0 ? (
            <div className="manover-te-row">
              <span className="manover-te-src">Végrehajtás fázis (standard)</span>
              <span className="manover-te-val manover-szit-pos">+{manőver.végrehajtás_té_módosító}</span>
            </div>
          ) : (
            <div className="manover-te-none">
              Ennél a manővernél <strong>nincs</strong> a szokásos <strong>+4 TÉ</strong> a Végrehajtásra — sima támadást dobsz.
            </div>
          )}
        </div>
        <div className="manover-te-sum">TÉ összesen: <strong>{(aktívTÉ ?? 0) + manőver.végrehajtás_té_módosító}</strong></div>
      </PopupOverlay>
    )}
    </>
  );
}

/**
 * Ki a cselekvő az adott fázisban (az ALKALMAZÓ szemszögéből, aktív mód).
 * Default: M → ellenfél (ő akaszt), V/E → én. A manőver `fázis_cselekvő` felülírhatja
 * (pl. Távoltartás M → én).
 */
export function fázisCselekvő(
  fázis: 'M' | 'V' | 'E', cselekvők: Record<string, 'én' | 'ellenfél'> | undefined,
): 'én' | 'ellenfél' {
  const override = cselekvők?.[fázis];
  if (override) return override;
  return fázis === 'M' ? 'ellenfél' : 'én';
}

/**
 * Egy fázis eredménye a MANŐVER szempontjából sikeres-e.
 * A CSELEKVŐ éri-e el a célját: ha a cselekvő = én → találat/elérés (`igen`) a jó;
 * ha a cselekvő = ellenfél (megakaszt) → a hibázása (`nem`) a jó a manővernek.
 */
export function fázisSikeres(eredmény: FázisEredmény, cselekvő: 'én' | 'ellenfél'): boolean {
  if (eredmény === 'pending') return false;
  return cselekvő === 'én' ? eredmény === 'igen' : eredmény === 'nem';
}

/**
 * Fázis gomb-feliratok a KONKRÉT dobás alapján. A cselekvő (én/ellenfél) + a mód
 * együtt adja, hogy a képernyő előtt ülő dob-e: tényleges = cselekvő XOR (passzív).
 * A `siker`/`kudarc` a MANŐVER-siker felé mutató, ill. attól elvezető dobás-eredmény.
 */
export function getFázisFelirat(
  fázis: 'M' | 'V' | 'E', mód: Mód, cselekvő: 'én' | 'ellenfél',
): { siker: string; kudarc: string } {
  // A képernyő előtt ülő az adott fázisban maga dob-e?
  const énDobok = (cselekvő === 'én') === (mód === 'aktív');
  if (fázis === 'M' && cselekvő === 'ellenfél') {
    // Megakasztó az ellenfél — a manőver-siker = a megakasztás NEM talál.
    return énDobok
      ? { siker: 'Elhibáztam', kudarc: 'Eltaláltam' }
      : { siker: 'Elhibázta', kudarc: 'Eltalált' };
  }
  // Cselekvő = én-típusú akció (V, E, vagy én-Megakasztás mint Távoltartás):
  // a cselekvő találata/elérése a manőver-siker.
  if (fázis === 'E') {
    return énDobok
      ? { siker: 'Elértem', kudarc: 'Nem értem el' }
      : { siker: 'Elérte', kudarc: 'Nem érte el' };
  }
  // M (én-cselekvő, pl. Távoltartás) vagy V — támadás/találat
  return énDobok
    ? { siker: 'Talált', kudarc: 'Nem talált' }
    : { siker: 'Eltalált', kudarc: 'Nem talált' };
}

/**
 * A "Manőver sikeres" boxban megjelenő hatás-sorok: a `hatás`-ból kiszűrjük a
 * kudarc-jellegű ("Sikertelen:" / "Kudarc:") és a feltétel/meta ("Feltétel:") sorokat —
 * ezek a SIKERES kontextusban félrevezetők/feleslegesek (a teljes `hatás` a pickerben látszik).
 * C2 (ponytail: prefix-alapú szűrés).
 */
export function eredményHatás(hatás: string[]): string[] {
  return hatás.filter(s => !/^\s*(sikertelen|kudarc|feltétel)\b/i.test(s));
}
