import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import type { FegyverExtraDef } from '../../engine/data-types';
import { extrakInfoTételek, type ExtraKontextus, type ExtraStátusz } from './extrak-info-calc';

const STÁTUSZ_LABEL: Record<ExtraStátusz, string> = {
  aktív: 'aktív',
  inaktív: 'inaktív',
  km: 'KM dönt',
};

/**
 * „Extrák" gomb + popup a dobás-ablakokban (engine_spec §42, 2. fázis megjelenítő szelete).
 * A fegyver `fegyver_extrak.json`-beli extráit listázza, státusz-jelzéssel (aktív/inaktív/KM).
 * Ha van legalább egy AKTÍV extra, a gomb pulzál (figyelemfelhívás). Nincs extra → nem renderel.
 */
export function ExtrakInfo({ fegyverExtrák, extraDefs, kontextus }: {
  fegyverExtrák?: { id: string }[];
  extraDefs?: Record<string, FegyverExtraDef>;
  kontextus: ExtraKontextus;
}) {
  const [open, setOpen] = useState(false);
  const tételek = extrakInfoTételek(fegyverExtrák, extraDefs, kontextus);
  if (tételek.length === 0) return null;

  const vanAktív = tételek.some(t => t.státusz === 'aktív');
  const aktívDb = tételek.filter(t => t.státusz === 'aktív').length;

  return (
    <>
      <button
        className={`extrak-btn${vanAktív ? ' extrak-btn-pulse' : ''}`}
        onClick={() => setOpen(true)}
        title="Fegyver extrák"
      >
        💡 Extrák{aktívDb > 0 ? ` (${aktívDb} aktív)` : ''}
      </button>
      {open && (
        <PopupOverlay onClose={() => setOpen(false)} className="kep-prompt extrak-prompt">
          <div className="extrak-popup">
            <div className="ke-dobas-header">Fegyver extrák</div>
            <div className="extrak-lista">
              {tételek.map(t => (
                <div key={t.id} className={`extrak-tetel extrak-${t.státusz}`}>
                  <div className="extrak-tetel-fej">
                    <span className="extrak-tetel-nev">{t.név}</span>
                    <span className={`extrak-badge extrak-badge-${t.státusz}`}>{STÁTUSZ_LABEL[t.státusz]}</span>
                  </div>
                  {t.hatásSzöveg && <div className="extrak-tetel-hatas">{t.hatásSzöveg}</div>}
                  {t.leírás && <div className="extrak-tetel-leiras">{t.leírás}</div>}
                </div>
              ))}
            </div>
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
