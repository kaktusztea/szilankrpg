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

/** Közös fortély lista renderelő (kiterjesztő fortélyok).
 *  Állapot: színes pötty (felvett = zöld; hiányzó = sárga normál / piros erős), a név semleges (hiányzó = tompított).
 *  Az azonos "X - Y" / "X: Y" előtagú tételek egy csoportba vonódnak: "X: Y1, Y2, ...". */
function FortelyLista({ label, szint, entries, fortélyFokok, onInfo }: {
  label: string;
  szint: 'normál' | 'erős';
  entries: KiterjesztesEntry[];
  fortélyFokok?: Record<string, number>;
  onInfo: (e: KiterjesztesEntry) => void;
}) {
  if (entries.length === 0) return null;
  const csoportok = csoportosít(entries);

  const tétel = (k: KiterjesztesEntry, név: string) => {
    const felvett = (fortélyFokok?.[k.fortély] ?? 0) > 0;
    const állapot = felvett ? 'felvett' : szint === 'erős' ? 'eros' : 'normal';
    const állapotSzöveg = felvett ? 'felvett' : `hiányzó (${szint})`;
    const hasInfo = !!k.leírás;
    const névClass = [fortélyFokok && !felvett ? 'kit-hiany' : '', hasInfo ? 'kit-nev-info' : ''].join(' ').trim() || undefined;
    return (
      <Fragment key={k.fortély + név}>{' '}<span className="kit-tetel">
        {fortélyFokok && <span className={`kit-dot kit-dot-${állapot}`} role="img" aria-label={állapotSzöveg} />}
        <span
          className={névClass}
          title={hasInfo ? k.leírás : undefined}
          {...(hasInfo ? kattinthatóProps(() => onInfo(k)) : {})}
        >
          {név}
        </span>
      </span></Fragment>
    );
  };

  return (
    <div className="info-panel-row kit-row">
      <span className="info-panel-label">
        <svg className={`kit-szint-ikon kit-szint-${szint === 'erős' ? 'eros' : 'normal'}`} viewBox="0 0 10 10" aria-hidden="true">
          <rect width="10" height="10" rx="2" />
        </svg>
        {label}
      </span>
      <span className="kit-lista">{csoportok.map(cs => cs.előtag === null
        ? tétel(cs.tételek[0].k, cs.tételek[0].név)
        : (
          <span key={cs.előtag} className="kit-csoport">
            {' '}<span className="kit-csoport-cim">{cs.előtag}:</span>
            <span className="kit-csoport-tetelek">{cs.tételek.map(t => tétel(t.k, t.név))}</span>
          </span>
        ))}</span>
    </div>
  );
}

/** Prefix separators in fortély names: "Tájtípus - erdős", "Kézműves: Asztalos". */
const ELŐTAG_RE = /^(.+?)(?: - |: )(.+)$/;

/** Groups entries sharing an "X - Y" / "X: Y" prefix (2+ items); others stay single, original order kept. */
function csoportosít(entries: KiterjesztesEntry[]) {
  const előtag = (név: string) => ELŐTAG_RE.exec(név)?.[1] ?? null;
  const darab = new Map<string, number>();
  for (const k of entries) { const e = előtag(k.név); if (e) darab.set(e, (darab.get(e) ?? 0) + 1); }
  const out: { előtag: string | null; tételek: { k: KiterjesztesEntry; név: string }[] }[] = [];
  const index = new Map<string, number>();
  for (const k of entries) {
    const e = előtag(k.név);
    if (e && (darab.get(e) ?? 0) > 1) {
      const név = ELŐTAG_RE.exec(k.név)?.[2] ?? k.név;
      const idx = index.get(e);
      if (idx === undefined) { index.set(e, out.length); out.push({ előtag: e, tételek: [{ k, név }] }); }
      else out[idx].tételek.push({ k, név });
    } else out.push({ előtag: null, tételek: [{ k, név: k.név }] });
  }
  return out;
}
