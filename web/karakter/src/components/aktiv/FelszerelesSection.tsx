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

/** Melyik sor pickerje nyílt: auto (fix-érték méret-neve) vagy kézi (index). */
type PickerTarget =
  | { fajta: 'auto'; sor: FelszerelésSor; fixMéret: Méret }
  | { fajta: 'kézi'; idx: number };

/**
 * Felszerelés accordion (Verziók/Napló/Jegyzetek overlay legfelső eleme).
 * Fejléc: Max/Aktuális. Táblázat: fegyver/pajzs/páncél AUTO (read-only név, nincs↔fix),
 * kézi tárgyak (szabad név + méret), mindig 1 üres sor alul.
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
    setKarakter(prev => prev ? { ...prev, felszerelés: { tárgyak, kizárt_auto: prev.felszerelés?.kizárt_auto ?? [] } } : prev);
  }

  function setKéziNév(idx: number, név: string) {
    if (idx === kézi.length) {
      // Üres sorba írtak → új tárgy (default közepes), ami után megjelenik a következő üres sor.
      if (név.trim()) setKézi([...kézi, { név, méret: 'közepes' }]);
    } else {
      const next = kézi.slice();
      next[idx] = { ...next[idx], név };
      setKézi(next);
    }
  }

  function setKéziMéret(idx: number, méret: Méret) {
    const next = kézi.slice();
    next[idx] = { ...next[idx], méret };
    setKézi(next);
  }

  function törölKézi(idx: number) {
    setKézi(kézi.filter((_, i) => i !== idx));
  }

  /** Auto-sor „nincs" ↔ fix váltás: fegyver → felszerelésben flag, pajzs/páncél → kizárt_auto. */
  function toggleAuto(sor: FelszerelésSor, nincs: boolean) {
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
      return { ...prev, felszerelés: { tárgyak: prev.felszerelés?.tárgyak ?? [], kizárt_auto: [...new Set(kizárt)] as ('pajzs' | 'páncél')[] } };
    });
  }

  /** A sor méret-chip felirata. */
  function chipLabel(sor: FelszerelésSor): string {
    if (!sor.számít) return 'nincs';
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
          {/* AUTO sorok (fegyver/pajzs/páncél) - read-only név, nincs ↔ fix chip */}
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
                    <button className="felsz-torol" title="Nincs a karakternél" onClick={() => toggleAuto(sor, true)}>✕</button>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Kézi tárgyak + 1 üres sor a végén */}
          {[...kézi, { név: '', méret: 'közepes' as Méret }].map((t, idx) => {
            const üres = idx === kézi.length;
            return (
              <tr key={`kézi-${idx}`}>
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
                      {data.konstansok.felszerelés.méret_pont[t.méret]}
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
                <button className="felsz-picker-opt" onClick={() => { toggleAuto(picker.sor, true); setPicker(null); }}>nincs</button>
                <button className="felsz-picker-opt" onClick={() => { toggleAuto(picker.sor, false); setPicker(null); }}>
                  {MÉRET_LABEL[picker.fixMéret]} ({picker.sor.pont})
                </button>
              </>
            ) : (
              <>
                <button className="felsz-picker-opt" onClick={() => { törölKézi(picker.idx); setPicker(null); }}>nincs (törlés)</button>
                {(['kicsi', 'közepes', 'nagy'] as Méret[]).map(m => (
                  <button key={m} className="felsz-picker-opt" onClick={() => { setKéziMéret(picker.idx, m); setPicker(null); }}>
                    {MÉRET_LABEL[m]} ({data.konstansok.felszerelés.méret_pont[m]})
                  </button>
                ))}
              </>
            )}
          </div>
        </OverlayPortal>
      )}
    </details>
  );
}
