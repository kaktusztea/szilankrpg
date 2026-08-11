import { useState } from 'react';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';

export type Mód = 'aktív' | 'passzív';
export type FázisEredmény = 'pending' | 'igen' | 'nem';

interface ManőverDef {
  név: string;
  nehézség: number;
  fázisok: string;
  típus: string;
  hatás: string;
}

interface Props {
  manőver: ManőverDef;
  mód: Mód;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  data: GameData;
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

function calcManőverAlap(karakter: Karakter): number {
  return Math.ceil((karakter.HM_TÉ + karakter.HM_VÉ) / 10);
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

export function ManoverDobasPopup({ manőver, mód, karakter, session, setSession, data, aktívTÉ, aktívVÉ, onClose }: Props) {
  const fázisok = parseFázisok(manőver.fázisok);
  const [eredmények, setEredmények] = useState<FázisEredmény[]>(fázisok.map(() => 'pending'));
  const [költöttMP, setKöltöttMP] = useState(0);

  const manőverAlap = calcManőverAlap(karakter);
  const manőverPont = calcManőverPont(karakter, data);
  const aktMP = Math.max(0, manőverPont - session.manőver_pont_használt);
  const belharcFok = getBelharcFok(karakter);
  const isBelharcos = manőver.típus === 'belharcos';
  const maxKölthető = mód === 'aktív'
    ? Math.min(aktMP, data.konstansok.manőver?.max_mp_támadó ?? 4)
    : Math.min(aktMP, data.konstansok.manőver?.max_mp_védő ?? 2);
  const belharcSzorzó = data.konstansok.manőver?.belharc_fok_szorzó ?? 2;

  // Find current active phase (first pending), but stop if manőver already failed.
  const manőverMárSikertelen = eredmények.some((e, i) => e !== 'pending' && !fázisSikeres(fázisok[i], e, mód));
  const aktívFázisIdx = manőverMárSikertelen ? -1 : eredmények.findIndex(e => e === 'pending');
  const végeredmény: 'folyamatban' | 'sikeres' | 'sikertelen' =
    manőverMárSikertelen ? 'sikertelen'
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
      const té4 = aktívTÉ != null ? aktívTÉ + 4 : null;
      return (
        <div className="manover-fazis-info">
          {té4 != null && <div className="manover-fazis-ertek">TÉ: <strong>{té4}</strong> <span className="manover-dim">({aktívTÉ} + 4)</span></div>}
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

  function renderEllenpróba() {
    if (mód === 'aktív') {
      const dobásÉrték = manőverAlap + költöttMP + (isBelharcos ? belharcFok * belharcSzorzó : 0);
      return (
        <div className="manover-fazis-info">
          {maxKölthető > 0 && (
            <div className="manover-ep-mp-row">
              <span className="manover-ep-mp-label">MP</span>
              {Array.from({ length: maxKölthető }, (_, i) => (
                <button key={i} className={`manover-mp-chip${költöttMP === i + 1 ? ' manover-mp-chip-active' : ''}`}
                  onClick={() => setKöltöttMP(költöttMP === i + 1 ? 0 : i + 1)}>+{i + 1}</button>
              ))}
            </div>
          )}
          <div className="manover-ep-vs-row">
            <span className="manover-ep-side"><strong>{dobásÉrték}</strong> + k10</span>
            <span className="manover-ep-vs">vs</span>
            <span className="manover-ep-side"><strong className="manover-celszam-ertek">{manőver.nehézség}</strong> + ellen MA</span>
          </div>
        </div>
      );
    } else {
      const célszámAlap = manőverAlap + manőver.nehézség + költöttMP + (isBelharcos ? belharcFok * belharcSzorzó : 0);
      return (
        <div className="manover-fazis-info">
          {maxKölthető > 0 && (
            <div className="manover-ep-mp-row">
              <span className="manover-ep-mp-label">MP</span>
              {Array.from({ length: maxKölthető }, (_, i) => (
                <button key={i} className={`manover-mp-chip${költöttMP === i + 1 ? ' manover-mp-chip-active' : ''}`}
                  onClick={() => setKöltöttMP(költöttMP === i + 1 ? 0 : i + 1)}>+{i + 1}</button>
              ))}
            </div>
          )}
          <div className="manover-ep-vs-row">
            <span className="manover-ep-side">Célszám: <strong className="manover-celszam-ertek">{célszámAlap}</strong></span>
          </div>
          <div className="manover-fazis-desc">Ellenfél dob: MA + k10 ≥ célszám</div>
        </div>
      );
    }
  }

  /** Question text for the Igen/Nem chips. */
  function getKérdés(fázis: 'M' | 'V' | 'E'): string {
    switch (fázis) {
      case 'M':
        return mód === 'aktív' ? 'Eltalált?' : 'Eltaláltad?';
      case 'V':
        return mód === 'aktív' ? 'Találat?' : 'Eltalált?';
      case 'E':
        return mód === 'aktív' ? 'Elérted a célszámot?' : 'Elérte a célszámot?';
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
    <PopupOverlay onClose={onClose}>
      <div className="manover-dobas-popup">
        <div className="manover-dobas-header">
          <span className="manover-dobas-title">{manőver.név}</span>
          <span className="manover-dobas-mod-label">{mód === 'aktív' ? 'Aktív' : 'Passzív'}</span>
        </div>
        <div className="manover-dobas-fazisok-label">Fázisok: {manőver.fázisok}</div>

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
                      <span className="manover-fazis-kerdes">{getKérdés(f)}</span>
                      <button className="manover-chip manover-chip-igen" onClick={() => handleChip(true)}>Igen</button>
                      <button className="manover-chip manover-chip-nem" onClick={() => handleChip(false)}>Nem</button>
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
            {végeredmény === 'sikeres' && <div className="manover-dobas-hatas">{manőver.hatás}</div>}
          </div>
        )}
      </div>
    </PopupOverlay>
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
