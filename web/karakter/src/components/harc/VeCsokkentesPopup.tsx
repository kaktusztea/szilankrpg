import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { calcVéCsökkentés, type Fegyverviszony, type VéCsökkentésEredmény, type TaktikaVéCsökkentésEredmény } from './ve-csokkentes-calc';
import type { FegyverExtraDef } from '../../engine/data-types';
import type { ExtraKontextus } from './extrak-info-calc';
import { hiányzóInfósExtrák } from './extrak-effekt';

interface Props {
  /** A Támadó dobás k20 eredménye (a sikertelen támadás VÉ csökkentésének kockatagja). Fárasztás-ágnál irreleváns. */
  k20: number;
  /** `konstansok.yaml` → `vé_csökkentés_alap`. */
  alapTáblázat: Record<Fegyverviszony, number>;
  /** Az aktív fegyver extrái - a VÉ-t érintő, ellenfél-infó nélküli extrák warning-jához. */
  fegyverExtrák?: { id: string }[];
  /** Az összes fegyver-extra definíció (id → def). */
  extraDefs?: Record<string, FegyverExtraDef>;
  /** Harci kontextus (a VÉ-warning feltétel-kiértékeléséhez). */
  extraKontextus?: ExtraKontextus;
  /**
   * Ha megvan (pl. Fárasztás taktika aktív, md/065_02): nincs Fegyverviszony-választó/k20P,
   * az eredmény azonnal, bontással jelenik meg (taktika override+flat + fortély flat bővítések).
   */
  taktikaVéCsökkentés?: TaktikaVéCsökkentésEredmény;
  /** A `taktikaVéCsökkentés` esetén megjelenítendő cím (pl. "Fárasztás taktika"). */
  taktikaCím?: string;
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
 *
 * `taktikaVéCsökkentés` esetén (pl. Fárasztás, md/065_02): nincs Fegyverviszony-választó/k20P,
 * az eredmény AZONNAL látható, a Fegyverviszony-mezők dummy értékkel töltve (a hívó csak a
 * `.végső`-t használja, l. HarcScreen.tsx `changeVé`).
 */
export function VeCsokkentesPopup({
  k20, alapTáblázat, fegyverExtrák, extraDefs, extraKontextus, taktikaVéCsökkentés, taktikaCím, onClose,
}: Props) {
  const [eredmény, setEredmény] = useState<VéCsökkentésEredmény | null>(null);

  function handleVálasztás(fv: Fegyverviszony) {
    setEredmény(calcVéCsökkentés(fv, k20, alapTáblázat));
  }

  // VÉ-t érintő, ellenfél-infó nélküli extrák (pl. Béltépő „Pocsék védekező" páncélos ellen): nem
  // számoljuk (hiányos korreláció - a VÉ-csökkentésnél nincs ellenfél-páncél infó), csak WARNING.
  const véWarningok = extraKontextus
    ? hiányzóInfósExtrák(fegyverExtrák, extraDefs, extraKontextus, 'VÉ')
    : [];

  if (taktikaVéCsökkentés) {
    const t = taktikaVéCsökkentés;
    return (
      <PopupOverlay onClose={() => onClose({ fegyverviszony: 'fegyverazonosság', bázis: t.taktikaBázis, k20: 0, k20p: 0, végső: t.végső })}>
        <div className="tamado-dobas-popup ve-csokkentes-popup">
          <div className="ke-dobas-header">{taktikaCím ?? 'VÉ csökkentés'}</div>
          <div className="ke-dobas-result">{t.végső}</div>
          <div className="ke-dobas-detail">
            {taktikaCím ?? 'Taktika'} ({t.taktikaBázis})
            {t.fortélyBővítések.map((f, i) => <span key={i}>{' + '}{f.forrás} (+{f.érték})</span>)}
          </div>
        </div>
      </PopupOverlay>
    );
  }

  return (
    <PopupOverlay onClose={() => onClose(eredmény)}>
      <div className="tamado-dobas-popup ve-csokkentes-popup">
        <div className="ke-dobas-header">VÉ csökkentés</div>

        {véWarningok.length > 0 && (
          <div className="ve-csokkentes-warning">
            ⚠ Ellenfél-páncéltól függő VÉ-extra: {véWarningok.join(', ')} - ellenőrizd az „Extrák" ablakban.
          </div>
        )}

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
