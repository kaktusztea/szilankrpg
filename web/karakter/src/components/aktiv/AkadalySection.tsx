import { useState } from 'react';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { OverlayPortal } from '../overlays/OverlayPortal';
import { akadályÁllapot, type AkadályForrás } from '../../engine/felszereles';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  data: GameData;
}

/** Az állapothoz tartozó informatív hatás-szöveg (md/010_03_07_akadaly.md). */
const ÁLLAPOT_HATÁS: Record<number, string> = {
  1: 'Státusz: Fizikai (1) · napi táv fele (hátráltatja a csapatot)',
  2: 'Státusz: Fizikai (2) · napi táv negyede (hátráltatja a csapatot)',
};

const VISELVE_LABEL = 'viselve';
const KÜLSŐ_LABEL = 'külső tárolóban';
const NINCS_LABEL = 'nincs nálad';

/** Egy akadály-forrás sor melyik tároló-kulccsal írható (páncél / pajzs). */
function forrásKulcs(forrás: AkadályForrás): 'páncél' | 'pajzs' {
  return forrás.név.startsWith('Pajzs') ? 'pajzs' : 'páncél';
}

/**
 * Akadály accordion (✏️ overlay, a Felszerelés accordion alatt).
 *
 * Informatív (read-only) származtatott panel: a tartós viselet/cipelés Akadály-állapota
 * (md/010_03_07) a viselt páncél/pajzs alapján. Nem additív - a legnagyobb forrás számít.
 * A header pöttyökkel jelzi az állapotot (üres/teli), mint a Felszerelés accordion.
 *
 * A páncél/pajzs "viselve / külső tárolóban / nincs nálad" háromállapota UGYANAZT a tárolót
 * írja, mint a Felszerelés accordion AUTO-sorai (session.aktív_páncél + felszerelés.külső /
 * kizárt_auto) - egy igazságforrás, csak egy második belépési pont.
 */
export function AkadalySection({ karakter, setKarakter, data }: Props) {
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState<AkadályForrás | null>(null);

  const { állapot, források } = akadályÁllapot(karakter, data);
  // A pötty-skála a maximális lehetséges állapot (2); teli = aktuális állapot.
  const MAX = 2;

  /** "külső" jelző be/ki a felszerelés.külső halmazban (kulcs-alapú). */
  function setKülső(kulcs: string, be: boolean) {
    setKarakter(prev => {
      if (!prev) return prev;
      const jelenlegi = prev.felszerelés?.külső ?? [];
      const külső = be ? [...jelenlegi, kulcs] : jelenlegi.filter(x => x !== kulcs);
      return {
        ...prev,
        felszerelés: {
          tárgyak: prev.felszerelés?.tárgyak ?? [],
          kizárt_auto: prev.felszerelés?.kizárt_auto ?? [],
          külső: [...new Set(külső)],
        },
      };
    });
  }

  /** Páncél/pajzs "viselve ↔ nincs" váltás (a külső jelzőt is törli). */
  function setNincs(kulcs: 'páncél' | 'pajzs', nincs: boolean) {
    setKülső(kulcs, false);
    setKarakter(prev => {
      if (!prev) return prev;
      if (kulcs === 'páncél') {
        return { ...prev, session: { ...prev.session, aktív_páncél: !nincs } };
      }
      const jelenlegi = prev.felszerelés?.kizárt_auto ?? [];
      const kizárt = nincs ? [...jelenlegi, 'pajzs'] : jelenlegi.filter(x => x !== 'pajzs');
      return {
        ...prev,
        felszerelés: {
          tárgyak: prev.felszerelés?.tárgyak ?? [],
          kizárt_auto: [...new Set(kizárt)] as ('pajzs' | 'páncél')[],
          külső: prev.felszerelés?.külső ?? [],
        },
      };
    });
  }

  /** A forrás "viselve" háromállapot-választása. */
  function válaszd(forrás: AkadályForrás, cél: 'viselve' | 'külső' | 'nincs') {
    const kulcs = forrásKulcs(forrás);
    if (cél === 'viselve') { setNincs(kulcs, false); setKülső(kulcs, false); }
    else if (cél === 'nincs') { setNincs(kulcs, true); }
    else { setNincs(kulcs, false); setKülső(kulcs, true); }
    setPicker(null);
  }

  function chipLabel(forrás: AkadályForrás): string {
    if (!forrás.viselve) {
      // A "külső" és a "nincs" megkülönböztetéséhez a tárolót nézzük.
      const kulcs = forrásKulcs(forrás);
      const külső = (karakter.felszerelés?.külső ?? []).includes(kulcs);
      return külső ? KÜLSŐ_LABEL : NINCS_LABEL;
    }
    return VISELVE_LABEL;
  }

  return (
    <details className="naplo-cp-section" open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="naplo-cp-summary">
        Akadály
        <span className="felsz-dots akadaly-dots" title={`Akadály állapot: ${állapot}`}>
          {Array.from({ length: MAX }, (_, i) => (
            <span key={`a-${i}`} className={`felsz-dot${i < állapot ? ' filled' : ''}`} />
          ))}
        </span>
      </summary>

      {állapot > 0 && (
        <div className="felsz-warning">⚠ {ÁLLAPOT_HATÁS[állapot]}</div>
      )}

      {források.length === 0 ? (
        <p className="akadaly-ures">Nincs olyan felszerelés (fém páncél / közepes-nagy pajzs), ami Akadályt okozna.</p>
      ) : (
        <table className="felsz-table">
          <thead>
            <tr><th>Forrás</th><th>Állapot</th><th>Viselet</th></tr>
          </thead>
          <tbody>
            {források.map(forrás => (
              <tr key={forrás.név} className={forrás.viselve && forrás.állapot > 0 ? '' : 'felsz-row-off'}>
                <td>{forrás.név}</td>
                <td style={{ textAlign: 'center' }}>{forrás.állapot > 0 ? forrás.állapot : '-'}</td>
                <td>
                  <button className="felsz-chip he-field-btn" onClick={() => setPicker(forrás)}>
                    {chipLabel(forrás)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {picker && (
        <OverlayPortal dismissible onClose={() => setPicker(null)}>
          <div className="kep-prompt-box felsz-picker">
            <button className="felsz-picker-opt" onClick={() => válaszd(picker, 'viselve')}>{VISELVE_LABEL}</button>
            <button className="felsz-picker-opt" onClick={() => válaszd(picker, 'külső')}>{KÜLSŐ_LABEL}</button>
            <button className="felsz-picker-opt" onClick={() => válaszd(picker, 'nincs')}>{NINCS_LABEL}</button>
          </div>
        </OverlayPortal>
      )}
    </details>
  );
}
