interface AuraPanelProps {
  aura: number;
  me: number;
}

export function AuraPanel({ aura, me }: AuraPanelProps) {
  return (
    <div className="aura-panel">
      <AuraCard label="Mágiaellenállás" value={String(me)} />
      <AuraCard label="Mágia akarata" value={`${aura} + k20`} />
      <AuraCard label="Aura" value={String(aura)} />
    </div>
  );
}

function AuraCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="aura-card">
      <span className="aura-card-label">{label}</span><br/>
      <strong className="aura-card-value">{value}</strong>
    </div>
  );
}
