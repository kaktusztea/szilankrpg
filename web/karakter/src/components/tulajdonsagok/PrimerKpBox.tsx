import { useMemo } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { calcPrimerKp, type KpDetail } from './primerKpCalc';

interface Props {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
}

export function PrimerKpBox({ data, karakter, képzettségek }: Props) {
  const kpData = useMemo(
    () => calcPrimerKp(data, karakter, képzettségek),
    [data, karakter, képzettségek]
  );

  const pct = (v: number) => kpData.total > 0 ? Math.round(v / kpData.total * 100) : 0;

  return (
    <div className="primer-kp-box">
      <strong className="primer-kp-title">Primer KP bontás</strong>
      <KpRow label="HM + CM" value={kpData.kp_hm_cm} pct={pct(kpData.kp_hm_cm)} />
      <KpRow label="Harcmodor képzettségek" value={kpData.kp_harcmodor} pct={pct(kpData.kp_harcmodor)} />
      <DetailList items={kpData.harcmodorDetails} type="kep" />
      <KpRow label="Misztikus képzettségek" value={kpData.kp_misztikus} pct={pct(kpData.kp_misztikus)} />
      <DetailList items={kpData.misztikusDetails} type="kep" />
      <KpRow label="Primer világi képzettségek" value={kpData.kp_világi} pct={pct(kpData.kp_világi)} />
      <DetailList items={kpData.világiDetails} type="kep" />
      <KpRow label="Harci fortélyok" value={kpData.kp_harci_fort} pct={pct(kpData.kp_harci_fort)} />
      <DetailList items={kpData.harcifortDetails} type="fort" />
      <KpRow label="Misztikus fortélyok" value={kpData.kp_miszt_fort} pct={pct(kpData.kp_miszt_fort)} />
      <DetailList items={kpData.misztfortDetails} type="fort" />
      <div className="primer-kp-total"><strong>Össz primer: {kpData.total} KP</strong></div>
    </div>
  );
}

function KpRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  return <div>{label}: {value} KP ({pct}%)</div>;
}

function DetailList({ items, type }: { items: KpDetail[]; type: 'kep' | 'fort' }) {
  return (<>
    {items.map((d, i) => (
      <div key={i} className="primer-kp-indent">
        · {d.név}{d.spec ? `: ${d.spec}` : ''} ({type === 'kep' ? `${d.szint}.sz` : `${d.fok}.fok`}): {d.kp} KP
      </div>
    ))}
  </>);
}
