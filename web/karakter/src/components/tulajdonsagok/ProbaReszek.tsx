import type { ReactNode } from 'react';
import type { ProbaDobás } from '../../engine/dice';
import { előnyHátrányLabel, eredményFelirat, type ÖsszetettEredmény } from './proba-common';

/** Popup fejléc: ✕ bezárás, cím, ⟲ újradobás (csak ha van eredmény). */
export function ProbaFejlec({ cím, vanEredmény, onReset, onClose }: { cím: string; vanEredmény: boolean; onReset: () => void; onClose: () => void }) {
  return (
    <div className="kep-proba-header">
      <button type="button" className="kep-proba-close-btn" onClick={onClose} title="Bezárás" aria-label="Bezárás">✕</button>
      {cím}
      <button type="button" className="kep-proba-reset-btn" disabled={!vanEredmény} onClick={onReset} title="Újradobás" aria-label="Újradobás">⟲</button>
    </div>
  );
}

/** Kapcsoló gomb az Extrák sorban. */
export function ExtraGomb({ aktív, disabled, title, onClick, children }: { aktív: boolean; disabled?: boolean; title?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`kep-proba-extras-btn${aktív ? ' kep-proba-extras-btn-active' : ''}`}
      aria-pressed={aktív} disabled={disabled} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * „Helyzetfüggő módosítók" chip-felirat (Tulajdonság- és Képzettségpróba közös).
 * Érték nélkül nyíl (` →`), értékkel `: <előjeles szám>` - a kettőspontot NEM színezi, csak a számot
 * (ezért a `: ` a színes spanen kívül van).
 */
export function SzitChipFelirat({ összeg }: { összeg: number }) {
  if (összeg === 0) return <>Helyzetfüggő módosítók →</>;
  return (
    <>Helyzetfüggő módosítók: <span className={összeg > 0 ? 'kep-proba-szit-pos' : 'kep-proba-szit-neg'}>{összeg > 0 ? '+' : ''}{összeg}</span></>
  );
}

/** Összetett próba: +1M … +maxM (újrakattintás = ki). */
/** A dobott kockák sora (E/H címke + az összes kocka, a választott kiemelve). */
function DobasKockak({ dobás, kocka, ehSzint }: { dobás: ProbaDobás; kocka: number; ehSzint: number }) {
  const ehCímke = előnyHátrányLabel(ehSzint);
  return (
    <div className="kep-proba-rolls">
      {ehCímke && <span className={ehSzint > 0 ? 'kep-proba-eh-előny' : 'kep-proba-eh'}>{ehCímke} · </span>}
      k{kocka}: {dobás.rolls.map((r, i) => (
        <span key={i}>{i > 0 ? ' ' : ''}<span className={r === dobás.eredmény ? 'kep-proba-roll-sel' : ''}>{r}</span></span>
      ))}
    </div>
  );
}

interface EredményProps {
  bázis: number;
  nehézség: number | null;
  /** Ellenpróba vagy rejtett célszám: csak az összeg látszik, nincs siker/kudarc. */
  csakÖsszeg: boolean;
  dobás: ProbaDobás | null;
  összetett: ÖsszetettEredmény | null;
  kocka: number;
  kiemeltKülönbség: number;
  ehSzint: number;
  /** Az eredmény alá (pl. Vállalás eredmény). */
  children?: ReactNode;
}

/** A próba eredmény-blokkja: összetett sorok / csak összeg / sima (vs célszám, siker-felirat). */
export function ProbaEredmeny({ bázis, nehézség, csakÖsszeg, dobás, összetett, kocka, kiemeltKülönbség, ehSzint, children }: EredményProps) {
  if (összetett) {
    return (
      <div className="kep-proba-result">
        <div className="kep-proba-osszetett-rows">
          {összetett.sorok.map((s, i) => (
            <div key={i} className={`kep-proba-osszetett-sor${!csakÖsszeg && !s.siker ? ' kep-proba-osszetett-fail' : ''}`}>
              <span className="kep-proba-osszetett-label">{s.label}{!csakÖsszeg ? ` (${s.célszám})` : ''}:</span>
              <span className="kep-proba-osszetett-sum">{s.összeg}</span>
              {!csakÖsszeg && <span className={s.siker ? 'kep-proba-osszetett-ok' : 'kep-proba-osszetett-x'}>{s.siker ? '✓' : '✗'}</span>}
            </div>
          ))}
        </div>
        {!csakÖsszeg && (
          <div className={összetett.összSiker ? 'kep-proba-siker' : 'kep-proba-sikertelen'}>
            {összetett.összSiker ? 'Siker' : 'Sikertelen'}
            {` (${összetett.sorok.filter(s => s.siker).length}/${összetett.sorok.length})`}
          </div>
        )}
        {children}
      </div>
    );
  }
  if (!dobás) return null;
  const eredmény = bázis + dobás.eredmény;
  return (
    <div className="kep-proba-result">
      {csakÖsszeg || nehézség === null ? (
        <div className="kep-proba-result-num">{eredmény}</div>
      ) : (
        <>
          <div className="kep-proba-result-num">
            {eredmény}<span className="kep-proba-result-vs"> vs </span><span className="kep-proba-result-cel">{nehézség}</span>
          </div>
          <div className={eredmény >= nehézség ? 'kep-proba-siker' : 'kep-proba-sikertelen'}>
            {eredményFelirat(eredmény, nehézség, kiemeltKülönbség)}
          </div>
        </>
      )}
      <DobasKockak dobás={dobás} kocka={kocka} ehSzint={ehSzint} />
      {children}
    </div>
  );
}

/** Célszám-választó gomb (aktív kiemeléssel). */
export function CelszamGomb({ aktív, onClick, children, className = '', disabled = false }: { aktív: boolean; onClick: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  return (
    <button type="button" className={`he-field-btn${className ? ` ${className}` : ''}${aktív ? ' vallas-active' : ''}`} aria-pressed={aktív} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
