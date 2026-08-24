import type { KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';
import { MD_BASE } from './MdLink';

interface Props {
  def: KepzettsegDef;
  kit: KiterjesztesEntry[];
  fortélyFokok: Record<string, number>;
}

export function KepzettsegInfoPanel({ def, kit, fortélyFokok }: Props) {
  const van = (fortély: string) => (fortélyFokok[fortély] ?? 0) > 0;
  const normál = kit.filter(k => k.típus !== 'erős');
  const erős = kit.filter(k => k.típus === 'erős');
  const szituációk = def.kapcsolódó_szituációk ?? [];
  return (
    <div className="info-panel">
      <div className="info-panel-row"><span className="info-panel-label">Próba:</span> {def.próba}</div>
      {def.domináns_tulajdonságok.length > 0 && (
        <div className="info-panel-row"><span className="info-panel-label">Domináns:</span> {def.domináns_tulajdonságok.join(', ')}</div>
      )}
      {normál.length > 0 && (
        <div className="info-panel-row">
          <span className="info-panel-label">Kiterjeszti Normál:</span>
          <span className="info-panel-kit">{normál.map((k, i) => (
            <span key={i} className={van(k.fortély) ? 'fort-req-met' : 'fort-req-unmet'}>{i > 0 ? '; ' : ''}{k.fortély}</span>
          ))}</span>
        </div>
      )}
      {erős.length > 0 && (
        <div className="info-panel-row">
          <span className="info-panel-label">Kiterjeszti Erős:</span>
          <span className="info-panel-kit">{erős.map((k, i) => (
            <span key={i} className={van(k.fortély) ? 'fort-req-met' : 'fort-req-unmet'}>{i > 0 ? '; ' : ''}{k.fortély}</span>
          ))}</span>
        </div>
      )}
      {szituációk.length > 0 && (
        <div className="info-panel-row info-panel-szit">
          <span className="info-panel-label">Szituációk:</span>
          <span className="info-panel-szit-list">{szituációk.map((sz, i) => (
            <a key={i} className="info-panel-szit-link" href={MD_BASE + sz.fájl} target="_blank" rel="noopener noreferrer">{sz.név}</a>
          ))}</span>
        </div>
      )}
    </div>
  );
}
