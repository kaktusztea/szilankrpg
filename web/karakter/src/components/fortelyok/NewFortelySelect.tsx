import type { Fortely } from '../../engine/types';

interface Props {
  available: { név: string; maxfok: number; kp_perfok: number; többszörös_típus: string; ingyenes_perszint: number }[];
  csoport: string;
  slotok: Fortely[];
  tsz: number;
  fortélyok: Fortely[];
  fegyverNevek: string[];
  nyelvtanulásSzint: number;
  onAdd: (név: string) => void;
}

export function NewFortelySelect({ available, csoport, slotok, tsz, fortélyok, fegyverNevek, nyelvtanulásSzint, onAdd }: Props) {
  return (
    <div className="fort-row fort-row-new">
      <select className="fort-select" value="" onChange={e => { if (e.target.value) onAdd(e.target.value); }}>
        <option value="">+ Új fortély...</option>
        {available.map(d => {
          const label = buildOptionLabel(d, csoport, slotok, tsz, fortélyok, nyelvtanulásSzint);
          const disabled = isOptionDisabled(d, fortélyok, fegyverNevek, nyelvtanulásSzint);
          return <option key={d.név} value={d.név} disabled={disabled}>{label}</option>;
        })}
      </select>
    </div>
  );
}

function buildOptionLabel(
  d: { név: string; maxfok: number; kp_perfok: number; ingyenes_perszint: number },
  csoport: string,
  slotok: Fortely[],
  tsz: number,
  fortélyok: Fortely[],
  nyelvtanulásSzint: number
): string {
  let label = `${d.név} (${d.maxfok})`;

  if (csoport === 'szabad') {
    const nonKierdemelt = slotok.filter(s => !s.kiérdemelt).length;
    const maradtIngyenes = Math.max(0, tsz - nonKierdemelt);
    if (maradtIngyenes > 0) label += ` ●${maradtIngyenes}`;
  } else if (d.ingyenes_perszint > 0) {
    const ingyenesDb = Math.floor((tsz + 1) / d.ingyenes_perszint);
    const felvettDb = fortélyok.filter(f => f.név === d.név && !f.kiérdemelt).length;
    const maradtIngyenes = Math.max(0, ingyenesDb - felvettDb);
    if (maradtIngyenes > 0) label += ` ●${maradtIngyenes}`;
  } else if (d.kp_perfok < 0) {
    const vals = Array.from({ length: d.maxfok }, (_, i) => Math.abs(d.kp_perfok) * (i + 1));
    label += ` 🎁${vals.join('-')}KP`;
  }

  if (d.név === 'Nyelvismeret') {
    const keret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
    const used = fortélyok.filter(f => f.név === 'Nyelvismeret' && !f.kiérdemelt).reduce((s, f) => s + f.fok, 0)
      + fortélyok.filter(f => f.név === 'Nyelvismeret' && f.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
    const maradt = keret - used;
    if (maradt > 0) label += ` ●${maradt}`;
  }

  return label;
}

function isOptionDisabled(
  d: { név: string; többszörös_típus: string },
  fortélyok: Fortely[],
  fegyverNevek: string[],
  nyelvtanulásSzint: number
): boolean {
  if (d.többszörös_típus === 'fegyver') {
    return fegyverNevek.length === 0 || fegyverNevek.every(n => fortélyok.some(f => f.név === d.név && f.spec_elem === n));
  }
  if (d.név === 'Nyelvismeret') {
    const keret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
    const used = fortélyok.filter(f => f.név === 'Nyelvismeret' && !f.kiérdemelt).reduce((s, f) => s + f.fok, 0)
      + fortélyok.filter(f => f.név === 'Nyelvismeret' && f.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
    return keret - used <= 0;
  }
  return false;
}
