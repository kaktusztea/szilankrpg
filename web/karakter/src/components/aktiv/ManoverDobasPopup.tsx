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
export function parseFázisok(s: string): ('M' | 'V' | 'E')[] {
  const result: ('M' | 'V' | 'E')[] = [];
  if (s.includes('M')) result.push('M');
  if (s.includes('V')) result.push('V');
  if (s.includes('E')) result.push('E');
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
  const vanNormál = követelmények.some(k => k.erősség === 'normál');
  const vanErős = követelmények.some(k => k.erősség === 'erős');
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

  // Find current active phase (first pending), but stop if manőver already failed.
  const manőverMárSikertelen = eredmények.some((e, i) => e !== 'pending' && !fázisSikeres(fázisok[i], e, mód));
  const aktívFázisIdx = (!követelményKész || követelményKudarc || manőverMárSikertelen)
    ? -1 : eredmények.findIndex(e => e === 'pending');
  const végeredmény: 'folyamatban' | 'sikeres' | 'sikertelen' =
    követelményKudarc ? 'sikertelen'
    : !követelményKész ? 'folyamatban'
    : manőverMárSikertelen ? 'sikertelen'
    : eredmények.includes('pending') ? 'folyamatban'
    : isDone(eredmények, fázisok) ? 'sikeres' : 'sikertelen';

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
   * A gombok a MANŐVER sikerére vonatkoznak (Siker/Kudarc). A tárolt igen/nem
   * reprezentáció fázisfüggő: Megakasztásnál a "nem" (elhibázta) = manőver-siker.
   */
  function handleSiker(siker: boolean) {
    if (aktívFázisIdx === -1) return;
    handleChip(fázisok[aktívFázisIdx] === 'M' ? !siker : siker);
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
                    <span className={`manover-kov-erosseg manover-kov-${köv.erősség}`}>{köv.erősség === 'erős' ? '🟥' : '🟩'}</span>
                    <span className="manover-kov-cimke">{cimke}</span>
                    {teljesül === true && <span className="manover-fazis-ok">✓</span>}
                    {teljesül === false && <span className="manover-fazis-fail">✗</span>}
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
            const sikeresAManőverSzempontjából = fázisSikeres(f, eredmény, mód);

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
                    {renderFázisInfo(f)}
                    <div className="manover-fazis-chips">
                      <button className="manover-chip manover-chip-igen" onClick={() => handleSiker(true)}>Siker</button>
                      <button className="manover-chip manover-chip-nem" onClick={() => handleSiker(false)}>Kudarc</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {végeredmény !== 'folyamatban' && (
          <div className={`manover-dobas-veg ${végeredmény === 'sikeres' ? 'manover-veg-sikeres' : 'manover-veg-sikertelen'}`}>
            {végeredmény === 'sikeres'
              ? (mód === 'passzív' ? '✓ Manőver sikeres ellened' : '✓ Manőver sikeres')
              : (mód === 'passzív' ? '✗ Manőver sikertelen ellened' : '✗ Manőver sikertelen')}
            {végeredmény === 'sikeres' && (
              <div className="manover-dobas-hatas">
                {manőver.hatás.map((mondat, i) => (
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
 * Determine if a phase result means success for the manőver.
 * M: "igen" (hit) = FAILURE for manőver; "nem" (missed) = success.
 * V: "igen" (hit) = success; "nem" = failure.
 * E: "igen" (reached) = success; "nem" = failure.
 */
export function fázisSikeres(fázis: 'M' | 'V' | 'E', eredmény: FázisEredmény, _mód: Mód): boolean {
  if (eredmény === 'pending') return false;
  if (fázis === 'M') return eredmény === 'nem'; // miss = manőver continues
  return eredmény === 'igen';
}

/** All done and all successful for the manőver? */
function isDone(eredmények: FázisEredmény[], fázisok: ('M' | 'V' | 'E')[]): boolean {
  return eredmények.every((e, i) => e !== 'pending' && fázisSikeres(fázisok[i], e, 'aktív'));
}
