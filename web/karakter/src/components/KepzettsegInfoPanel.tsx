import type { KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';

interface Props {
  def: KepzettsegDef;
  kit: KiterjesztesEntry[];
  fortélyFokok: Record<string, number>;
}

export function KepzettsegInfoPanel({ def, kit, fortélyFokok }: Props) {
  const van = (fortély: string) => (fortélyFokok[fortély] ?? 0) > 0;
  const normál = kit.filter(k => k.típus !== 'erős');
  const erős = kit.filter(k => k.típus === 'erős');
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
    </div>
  );
}
