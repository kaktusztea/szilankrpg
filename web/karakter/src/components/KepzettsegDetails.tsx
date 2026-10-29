import { Fragment, useState } from 'react';
import type { KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';
import { MD_BASE } from './MdLink';
import { PopupOverlay } from './PopupOverlay';
import { kattinthatóProps } from './a11y';

interface Props {
  /** A karakter képzettség-eleme (többszörösnél): az elemhez kötött szituációk is megjelennek. */
  elem?: string;
  def: KepzettsegDef;
  kit: KiterjesztesEntry[];
  /** Felvett fortélyok fok-mapje szín-jelzéshez; ha üres/undefined → nincs szín */
  fortélyFokok?: Record<string, number>;
}

export function KepzettsegDetails({ def, kit, fortélyFokok, elem }: Props) {
  const [popup, setPopup] = useState<KiterjesztesEntry | null>(null);
  const normál = kit.filter(k => k.típus !== 'erős');
  const erős = kit.filter(k => k.típus === 'erős');
  const szituációk = [...(def.kapcsolódó_szituációk ?? []), ...(elem ? def.kapcsolódó_szituációk_elem?.[elem] ?? [] : [])];

  return (
    <div className="info-panel">
      {def.primer && <div className="info-panel-row"><span className="info-panel-label">Primer</span></div>}
      <div className="info-panel-row"><span className="info-panel-label">Próba:</span> {def.próba}</div>
      {def.domináns_tulajdonságok.length > 0 && (
        <div className="info-panel-row"><span className="info-panel-label">Domináns:</span> {def.domináns_tulajdonságok.join(', ')}</div>
      )}
      <FortelyLista label="Kiterjeszti Normál" szint="normál" entries={normál} fortélyFokok={fortélyFokok} onInfo={setPopup} />
      <FortelyLista label="Kiterjeszti Erős" szint="erős" entries={erős} fortélyFokok={fortélyFokok} onInfo={setPopup} />
      {szituációk.length > 0 && (
        <div className="info-panel-row info-panel-szit">
          <span className="info-panel-label">Szituációk:</span>
          <span className="info-panel-szit-list">{szituációk.map((sz, i) => (
            <a key={i} className="info-panel-szit-link" href={MD_BASE + sz.fájl} target="_blank" rel="noopener noreferrer">{sz.név}</a>
          ))}</span>
        </div>
      )}
      {popup && (
        <PopupOverlay className="kep-prompt kit-info-popup" onClose={() => setPopup(null)}>
          <div className="kit-info-cim">{popup.név}</div>
          <div className="kit-info-leiras">{popup.leírás}</div>
        </PopupOverlay>
      )}
    </div>
  );
}

/** Közös fortély lista renderelő (kiterjesztő fortélyok). Szín: felvett = zöld; hiányzó = sárga (normál) / piros (erős). */
function FortelyLista({ label, szint, entries, fortélyFokok, onInfo }: {
  label: string;
  szint: 'normál' | 'erős';
  entries: KiterjesztesEntry[];
  fortélyFokok?: Record<string, number>;
  onInfo: (e: KiterjesztesEntry) => void;
}) {
  if (entries.length === 0) return null;
  const hiányClass = szint === 'erős' ? 'kit-hiany-eros' : 'kit-hiany-normal';
  return (
    <div className="info-panel-row">
      <span className="info-panel-label">{label}:</span>
      <span className="info-panel-kit">{entries.map((k, i) => {
        const felvett = (fortélyFokok?.[k.fortély] ?? 0) > 0;
        const színClass = !fortélyFokok ? undefined : felvett ? 'fort-req-met' : hiányClass;
        const hasInfo = !!k.leírás;
        return (
          <Fragment key={i}>
            {i > 0 ? <span className="kit-sep">; </span> : null}
            <span
              className={`${színClass ?? ''}${hasInfo ? ' kit-nev-info' : ''}`.trim() || undefined}
              title={hasInfo ? k.leírás : undefined}
              {...(hasInfo ? kattinthatóProps(() => onInfo(k)) : {})}
            >
              {k.név}
            </span>
          </Fragment>
        );
      })}</span>
    </div>
  );
}
