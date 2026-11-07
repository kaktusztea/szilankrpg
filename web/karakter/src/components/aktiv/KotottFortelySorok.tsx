import { fmtCode } from '../formatters';
import type { HelyzetFortélyEntry } from './aktiv-calc';

/** Egy aktív helyzethez / taktikához kötött fortélyok sorai („→ Név (fok): hatás ✔"). `alapeset`: a 0. fok külön jelölése. */
export function KotottFortelySorok({ sorok, alapeset = false }: { sorok: HelyzetFortélyEntry[]; alapeset?: boolean }) {
  return <>
    {sorok.map((kf, j) => (
      <div key={j} className={`item-row aktiv-helyzet-fortely-sor ${alapeset && kf.fok === 0 ? 'aktiv-helyzet-alapeset' : kf.aktív ? 'aktiv-helyzet-aktiv' : 'aktiv-helyzet-inaktiv'}`}>
        <span>→ {kf.név} ({kf.fok}): {fmtCode(kf.hatás)}{kf.aktív ? ' ✔' : ''}</span>
      </div>
    ))}
  </>;
}
