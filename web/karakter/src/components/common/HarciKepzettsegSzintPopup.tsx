import type { GameData } from '../../engine/data-types';
import type { Kepzettseg } from '../../engine/types';
import { képzKulcs } from '../../engine/azonosito';
import { harciKepzDisplayName } from '../../engine/harc/harcertekek-helpers';
import { PopupOverlay } from '../PopupOverlay';
import { SzintGrid } from './PickerComponents';

/**
 * Harcmodor-képzettség szint választó (Harcértékek + Távharc). Bezárás választás nélkül: a frissen felvett, még
 * 0 szintű képzettség kikerül (a felvétel visszavonása); választás: a szint beíródik.
 */
export function HarciKepzettsegSzintPopup({ data, kulcs, képzettségek, setKépzettségek, onDone }: {
  data: GameData; kulcs: string; képzettségek: Kepzettseg[];
  setKépzettségek: (fn: (prev: Kepzettseg[]) => Kepzettseg[]) => void; onDone: () => void;
}) {
  const mégse = () => {
    if (képzettségek.find(k => képzKulcs(k) === kulcs)?.szint === 0) setKépzettségek(prev => prev.filter(k => képzKulcs(k) !== kulcs));
    onDone();
  };
  return (
    <PopupOverlay onClose={mégse}>
      <SzintGrid
        label={`${harciKepzDisplayName(data, kulcs)} - szint:`}
        maxSzint={data.konstansok.arányok.képzettség_max_szint}
        current={képzettségek.find(kp => képzKulcs(kp) === kulcs)?.szint ?? 0}
        onSelect={n => { setKépzettségek(prev => prev.map(kp => (képzKulcs(kp) === kulcs ? { ...kp, szint: n } : kp))); onDone(); }}
      />
    </PopupOverlay>
  );
}
