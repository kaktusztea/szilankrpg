import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { calcVéCsökkentés, type Fegyverviszony, type VéCsökkentésEredmény } from './ve-csokkentes-calc';

interface Props {
  /** A Támadó dobás k20 eredménye (a sikertelen támadás VÉ csökkentésének kockatagja). */
  k20: number;
  /** `konstansok.yaml` → `vé_csökkentés_alap`. */
  alapTáblázat: Record<Fegyverviszony, number>;
  /** Eredmény átadása a hívónak (pl. `session.vé_csökkenés` növelése + TÉ history), vagy `null` ha bezárás nélkül. */
  onClose: (eredmény: VéCsökkentésEredmény | null) => void;
}

const FEGYVERVISZONY_LABEL: Record<Fegyverviszony, string> = {
  fegyverhátrány: 'Fegyverhátrány',
  fegyverazonosság: 'Fegyverazonosság',
  fegyverelőny: 'Fegyverelőny',
};

/**
 * VÉ csökkentés popup: Fegyverviszony választó (3 gomb) → eredmény megjelenítése
 * (bázis + k20P bontással), harcszimulacio.spec.md §5.3. A választás UTÁN a felhasználó
 * látja a bontást, a bezárás (mellékatt/Escape) commitolja az eredményt a hívónál
 * (session.vé_csökkenés + TÉ history) - nincs újradobás, mert a k20P a már eldobott
 * Támadó dobásból jön.
 */
export function VeCsokkentesPopup({ k20, alapTáblázat, onClose }: Props) {
  const [eredmény, setEredmény] = useState<VéCsökkentésEredmény | null>(null);

  function handleVálasztás(fv: Fegyverviszony) {
    setEredmény(calcVéCsökkentés(fv, k20, alapTáblázat));
  }

  return (
    <PopupOverlay onClose={() => onClose(eredmény)}>
      <div className="tamado-dobas-popup ve-csokkentes-popup">
        <div className="ke-dobas-header">Fegyverviszony</div>

        {!eredmény ? (
          <div className="ve-csokkentes-btn-row">
            {(Object.keys(FEGYVERVISZONY_LABEL) as Fegyverviszony[]).map(fv => (
              <button key={fv} className="ve-csokkentes-fv-btn" onClick={() => handleVálasztás(fv)}>
                {FEGYVERVISZONY_LABEL[fv]}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="ke-dobas-result">{eredmény.végső}</div>
            <div className="ke-dobas-detail">
              {FEGYVERVISZONY_LABEL[eredmény.fegyverviszony]} ({eredmény.bázis})
              {' + '}k20P ({eredmény.k20} → {eredmény.k20p})
            </div>
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
