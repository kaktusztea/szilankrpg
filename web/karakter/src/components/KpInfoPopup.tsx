import type { KpDetails } from './kp-calc';

interface Props {
  kp: KpDetails;
  tsz: number;
  intelligencia: number;
  emlékezet: number;
  perszint: number;
  szekunderPerszint: number;
}

export function KpInfoPopup({ kp, tsz, intelligencia, emlékezet, perszint, szekunderPerszint }: Props) {
  const összesKeret = kp.összesKp + kp.szekunderKp + kp.specKp;

  return (
    <div className="kp-info-popup">
      <h3 className="kp-info-title">KP képlet bontás</h3>

      <Section label="Keret">
        <Row name="Összes KP" value={kp.összesKp} />
        <Formula>{tsz} × ({perszint} + {intelligencia}(Int))</Formula>
        <Row name="Szekunder KP" value={kp.szekunderKp} />
        <Formula>{tsz} × ({szekunderPerszint} + {emlékezet}(Eml))</Formula>
        {kp.specKp !== 0 && <Row name="Speciális KP" value={kp.specKp} />}
        <SumRow name="Összes keret" value={összesKeret} />
      </Section>

      <Section label="Elköltött">
        <Row name="Képzettségek" value={kp.kpKépzettségek} />
        <Row name="Fortélyok" value={kp.kpFortélyok} />
        <Row name="HM" value={kp.kpHm} />
        <Row name="CM" value={kp.kpCm} />
        {kp.kiemeltKp > 0 && <Row name="Kiemelt" value={kp.kiemeltKp} />}
        <SumRow name="Összes elköltött" value={kp.elköltöttKp} />
      </Section>

      <Section label="Eredmény">
        <ResultRow name="Maradt KP" value={kp.maradékKp} />
      </Section>

      <Section label="Primer bontás">
        <Row name="Primer keret" value={kp.primerKeret} />
        <Formula>összes_kp + spec_kp</Formula>
        <Row name="Primer költés" value={kp.primerKöltés} />
        <ResultRow name="Primer keret delta" value={kp.primerMaradt} />
      </Section>
    </div>
  );
}

// --- Helper sub-components ---

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="kp-info-section">
      <div className="kp-info-label">{label}</div>
      {children}
    </div>
  );
}

function Row({ name, value }: { name: string; value: number }) {
  return (
    <div className="kp-info-row">
      <span>{name}</span>
      <span className="kp-info-val">{value}</span>
    </div>
  );
}

function SumRow({ name, value }: { name: string; value: number }) {
  return (
    <div className="kp-info-row kp-info-sum">
      <span>{name}</span>
      <span className="kp-info-val">{value}</span>
    </div>
  );
}

function ResultRow({ name, value }: { name: string; value: number }) {
  return (
    <div className="kp-info-row kp-info-result">
      <span>{name}</span>
      <span className={`kp-info-val ${value < 0 ? 'kp-info-neg' : 'kp-info-pos'}`}>{value}</span>
    </div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return <div className="kp-info-row kp-info-formula">{children}</div>;
}
