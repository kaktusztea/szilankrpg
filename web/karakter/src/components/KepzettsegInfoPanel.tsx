import type { KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';
import { MdLink } from './MdLink';

interface Props {
  def: KepzettsegDef;
  kit: KiterjesztesEntry[];
  felvettFortelyok: string[];
}

export function KepzettsegInfoPanel({ def, kit, felvettFortelyok }: Props) {
  const normál = kit.filter(k => k.típus !== 'erős');
  const erős = kit.filter(k => k.típus === 'erős');
  return (
    <div className="kep-info">
      <div className="kep-info-row"><span className="kep-info-label">Próba:</span> {def.próba}</div>
      {def.domináns_tulajdonságok.length > 0 && (
        <div className="kep-info-row"><span className="kep-info-label">Domináns:</span> {def.domináns_tulajdonságok.join(', ')}</div>
      )}
      {normál.length > 0 && (
        <div className="kep-info-row">
          <span className="kep-info-label">Kiterjeszti Normál:</span>
          <span className="kep-info-kit">{normál.map((k, i) => (
            <span key={i} className={felvettFortelyok.includes(k.fortély) ? 'fort-req-met' : 'fort-req-unmet'}>{i > 0 ? '; ' : ''}{k.fortély}</span>
          ))}</span>
        </div>
      )}
      {erős.length > 0 && (
        <div className="kep-info-row">
          <span className="kep-info-label">Kiterjeszti Erős:</span>
          <span className="kep-info-kit">{erős.map((k, i) => (
            <span key={i} className={felvettFortelyok.includes(k.fortély) ? 'fort-req-met' : 'fort-req-unmet'}>{i > 0 ? '; ' : ''}{k.fortély}</span>
          ))}</span>
        </div>
      )}
      {def.md_fájl && <div className="kep-info-row"><MdLink mdFájl={def.md_fájl} /></div>}
    </div>
  );
}
