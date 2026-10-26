import { useState } from 'react';
import type { Karakter, FelszerelésTárgy } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { OverlayPortal } from '../overlays/OverlayPortal';
import {
  felszerelésMax, felszerelésTerhelés, felszerelésSorok, felszerelésHátrány, type FelszerelésSor,
} from '../../engine/felszereles';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  data: GameData;
}

type Méret = 'kicsi' | 'közepes' | 'nagy';
const MÉRET_LABEL: Record<Méret, string> = { kicsi: 'kicsi', közepes: 'közepes', nagy: 'nagy' };
const NINCS_LABEL = 'nincs nálad';
const KÜLSŐ_LABEL = 'külső tárolóban';

/** Melyik sor pickerje nyílt: auto (fix-érték méret-neve) vagy kézi (index). */
type PickerTarget =
  | { fajta: 'auto'; sor: FelszerelésSor; fixMéret: Méret }
  | { fajta: 'kézi'; idx: number };

/**
 * Felszerelés accordion (Verziók/Napló/Jegyzetek overlay legfelső eleme).
 * Fejléc: Max/Aktuális. Táblázat: fegyver/pajzs/páncél AUTO (read-only név), kézi tárgyak
 * (szabad név + méret), mindig 1 üres sor alul. Minden sor háromállapotú:
 * nálad (pont számít) / "nincs nálad" / "külső tárolóban" - utóbbi kettő 0 pont + kiszürkítve.
 * Az AUTO "nálad↔nincs" a Harc fülhöz kötött (felszerelésben / kizárt_auto / aktív_páncél);
 * a "külső" egy párhuzamos megjelenítési jelző (felszerelés.külső halmaz, kulcs-alapú).
 * A kézi tárgy háromállapota a tárgy `hely` mezőjében (nincs/külső/∅=nálad).
 */
export function FelszerelesSection({ karakter, setKarakter, data }: Props) {
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  const max = felszerelésMax(karakter, data);
  const terhelés = felszerelésTerhelés(karakter, data);
  const sorok = felszerelésSorok(karakter, data);
  const hátrány = felszerelésHátrány(terhelés, max, data);
  const túlterhelt = terhelés > max;

  const autoSorok = sorok.filter(s => s.típus !== 'kézi');

  // Kézi tárgyak + mindig egy üres sor a végén. (A felszerelés localStorage-ból jöhet hiányosan.)
  const kézi = karakter.felszerelés?.tárgyak ?? [];

  function setKézi(tárgyak: FelszerelésTárgy[]) {
    setKarakter(prev => prev ? {
      ...prev,
      felszerelés: {
        tárgyak,
        kizárt_auto: prev.felszerelés?.kizárt_auto ?? [],
        külső: prev.felszerelés?.külső ?? [],
        úton: prev.felszerelés?.úton,
      },
    } : prev);
  }

  function setKéziNév(idx: number, név: string) {
    if (idx === kézi.length) {
      // Üres sorba írtak → új tárgy (default közepes, nálad), ami után megjelenik a következő üres sor.
      if (név.trim()) setKézi([...kézi, { név, méret: 'közepes' }]);
    } else {
      const next = kézi.slice();
      next[idx] = { ...next[idx], név };
      setKézi(next);
    }
  }

  function setKéziMéret(idx: number, méret: Méret) {
    const next = kézi.slice();
    // Méret választása visszahelyezi a tárgyat „nálad" állapotba (a hely jelzőt töröljük).
    const { hely: _elhagyott, ...többi } = next[idx];
    void _elhagyott;
    next[idx] = { ...többi, méret };
    setKézi(next);
  }

  function setKéziHely(idx: number, hely: 'nincs' | 'külső') {
    const next = kézi.slice();
    next[idx] = { ...next[idx], hely };
    setKézi(next);
  }

  function törölKézi(idx: number) {
    setKézi(kézi.filter((_, i) => i !== idx));
  }

  /** AUTO-sor „külső" jelző be/ki a felszerelés.külső halmazban (kulcs-alapú). */
  function setAutoKülső(kulcs: string, be: boolean) {
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
          úton: prev.felszerelés?.úton,
        },
      };
    });
  }

  /** AUTO-sor „nálad ↔ nincs nálad" váltás: fegyver → felszerelésben, pajzs/páncél → kizárt_auto/aktív_páncél.
   * A „külső" jelzőt is töröljük (a nincs/nálad kölcsönösen kizárja a külső-t). */
  function setAutoNincs(sor: FelszerelésSor, nincs: boolean) {
    setAutoKülső(sor.kulcs, false);
    setKarakter(prev => {
      if (!prev) return prev;
      if (sor.típus === 'fegyver') {
        const idx = parseInt(sor.autoId!.split(':')[1], 10);
        const fegyverek = prev.fegyverek.map((f, i) => i === idx ? { ...f, felszerelésben: !nincs } : f);
        return { ...prev, fegyverek };
      }
      if (sor.típus === 'páncél') {
        // A páncél "viselve/nincs" egyetlen igazságforrása a session.aktív_páncél (Harc fül "Páncél viselve").
        return { ...prev, session: { ...prev.session, aktív_páncél: !nincs } };
      }
      // Pajzs: kizárt_auto lista (nincs session-toggle-je).
      const jelenlegi = prev.felszerelés?.kizárt_auto ?? [];
      const kizárt = nincs ? [...jelenlegi, 'pajzs'] : jelenlegi.filter(x => x !== 'pajzs');
      return {
        ...prev,
        felszerelés: {
          tárgyak: prev.felszerelés?.tárgyak ?? [],
          kizárt_auto: [...new Set(kizárt)] as ('pajzs' | 'páncél')[],
          külső: prev.felszerelés?.külső ?? [],
          úton: prev.felszerelés?.úton,
        },
      };
    });
  }

  /** AUTO-sor „külső tárolóban"-ra állítása: bekapcsolja a külső jelzőt ÉS visszaállítja „nálad"-ra
   * (különben a nincs-flag maradna, és a sor Harc-oldalon nem elérhető lenne - a külső is nem-elérhető,
   * de a jelzőt egyértelműen a külső adja). */
  function setAutoKülsőTároló(sor: FelszerelésSor) {
    setAutoNincs(sor, false);
    setAutoKülső(sor.kulcs, true);
  }

  /** A sor méret-chip felirata (háromállapot). */
  function chipLabel(sor: FelszerelésSor): string {
    if (sor.külső) return KÜLSŐ_LABEL;
    if (!sor.számít) return NINCS_LABEL;
    return `${sor.pont}`;
  }

  return (
    <details className="naplo-cp-section" open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="naplo-cp-summary">
        Felszerelés
        <span className="felsz-dots" title={`Max: ${max} / Aktuális: ${terhelés}`}>
          {Array.from({ length: max }, (_, i) => (
            <span key={`k-${i}`} className={`felsz-dot${i < terhelés ? ' filled' : ''}`} />
          ))}
          {túlterhelt && Array.from({ length: terhelés - max }, (_, i) => (
            <span key={`t-${i}`} className="felsz-dot filled over" />
          ))}
        </span>
      </summary>

      {túlterhelt && (
        <div className="felsz-warning">
          ⚠ Túlterhelt: Hátrány{hátrány.ehSzint} a Fizikai próbákra
          {hátrány.nemHarcol && ' - nem tud harcolni, a próbák automatikus kudarcok'}
        </div>
      )}

      <table className="felsz-table">
        <thead>
          <tr><th>Név</th><th>Méret</th><th aria-label="törlés"></th></tr>
        </thead>
        <tbody>
          {/* AUTO sorok (fegyver/pajzs/páncél) - read-only név, háromállapotú chip */}
          {autoSorok.map((sor, i) => {
            const fixMéret: Méret = sor.pont >= 2 ? 'nagy' : sor.pont === 1 ? 'közepes' : 'kicsi';
            return (
              <tr key={`auto-${sor.autoId ?? i}`} className={sor.számít ? '' : 'felsz-row-off'}>
                <td>{sor.név}</td>
                <td>
                  <button
                    className="felsz-chip he-field-btn"
                    onClick={() => setPicker({ fajta: 'auto', sor, fixMéret })}
                  >
                    {chipLabel(sor)}
                  </button>
                </td>
                <td>
                  {sor.számít && (
                    <button className="felsz-torol" title="Nincs a karakternél" onClick={() => setAutoNincs(sor, true)}>✕</button>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Kézi tárgyak + 1 üres sor a végén */}
          {[...kézi, { név: '', méret: 'közepes' as Méret } as FelszerelésTárgy].map((t, idx) => {
            const üres = idx === kézi.length;
            const külső = t.hely === 'külső';
            const nincs = t.hely === 'nincs';
            const kiszürke = külső || nincs;
            const chip = külső ? KÜLSŐ_LABEL : nincs ? NINCS_LABEL : `${data.konstansok.felszerelés.méret_pont[t.méret]}`;
            return (
              <tr key={`kézi-${idx}`} className={!üres && kiszürke ? 'felsz-row-off' : ''}>
                <td>
                  <input
                    className="felsz-nev-input"
                    value={t.név}
                    placeholder={üres ? '+ új tárgy' : ''}
                    onChange={e => setKéziNév(idx, e.target.value)}
                  />
                </td>
                <td>
                  {!üres && (
                    <button className="felsz-chip he-field-btn" onClick={() => setPicker({ fajta: 'kézi', idx })}>
                      {chip}
                    </button>
                  )}
                </td>
                <td>
                  {!üres && (
                    <button className="felsz-torol" title="Tárgy törlése" onClick={() => törölKézi(idx)}>✕</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {picker && (
        <OverlayPortal dismissible onClose={() => setPicker(null)}>
          <div className="kep-prompt-box felsz-picker">
            {picker.fajta === 'auto' ? (
              <>
                <button className="felsz-picker-opt" onClick={() => { setAutoNincs(picker.sor, false); setPicker(null); }}>
                  {MÉRET_LABEL[picker.fixMéret]} ({picker.sor.pont})
                </button>
                <button className="felsz-picker-opt" onClick={() => { setAutoNincs(picker.sor, true); setPicker(null); }}>{NINCS_LABEL}</button>
                <button className="felsz-picker-opt" onClick={() => { setAutoKülsőTároló(picker.sor); setPicker(null); }}>{KÜLSŐ_LABEL}</button>
              </>
            ) : (
              <>
                {(['kicsi', 'közepes', 'nagy'] as Méret[]).map(m => (
                  <button key={m} className="felsz-picker-opt" onClick={() => { setKéziMéret(picker.idx, m); setPicker(null); }}>
                    {MÉRET_LABEL[m]} ({data.konstansok.felszerelés.méret_pont[m]})
                  </button>
                ))}
                <button className="felsz-picker-opt" onClick={() => { setKéziHely(picker.idx, 'nincs'); setPicker(null); }}>{NINCS_LABEL}</button>
                <button className="felsz-picker-opt" onClick={() => { setKéziHely(picker.idx, 'külső'); setPicker(null); }}>{KÜLSŐ_LABEL}</button>
              </>
            )}
          </div>
        </OverlayPortal>
      )}
    </details>
  );
}
