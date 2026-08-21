import { useState } from 'react';
import type { KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';
import type { Tulajdonsagok } from '../engine/types';
import { MdLink } from './MdLink';
import { KepzettsegProbaPopup } from './tulajdonsagok/KepzettsegProbaPopup';

interface Props {
  def: KepzettsegDef;
  kit: KiterjesztesEntry[];
  fortélyFokok: Record<string, number>;
  tulajdonságok: Tulajdonsagok;
  szint: number;
  képzettségek?: { név: string; szint: number }[];
  sérültFok?: number;
}

export function KepzettsegInfoPanel({ def, kit, fortélyFokok, tulajdonságok, szint, képzettségek, sérültFok }: Props) {
  const [showProba, setShowProba] = useState(false);
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
      <div className="info-panel-row info-panel-actions">
        {def.md_fájl && <MdLink mdFájl={def.md_fájl} />}
        <button className="kep-proba-dice-btn" title="Képzettségpróba dobás" onClick={() => setShowProba(true)}>🎲</button>
      </div>

      {showProba && (
        <KepzettsegProbaPopup
          képzettségNév={def.név}
          szint={szint}
          tulajdonságok={tulajdonságok}
          kiterjesztesek={kit}
          fortélyFokok={fortélyFokok}
          képzettségek={képzettségek || []}
          sérültFok={sérültFok || 0}
          módosítóTáblák={def.helyzetfüggő_módosítók || []}
          onClose={() => setShowProba(false)}
        />
      )}
    </div>
  );
}
