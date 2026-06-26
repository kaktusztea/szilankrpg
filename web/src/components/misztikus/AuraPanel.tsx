interface AuraPanelProps {
  aura: number;
  me: number;
}

export function AuraPanel({ aura, me }: AuraPanelProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <AuraCard label="Mágiaellenállás" value={String(me)} />
      <AuraCard label="Mágia akarata" value={`${aura} + k20`} />
      <AuraCard label="Aura" value={String(aura)} />
    </div>
  );
}

function AuraCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--input-bg)', border: '1px solid #444', borderRadius: '6px', padding: '8px 14px', textAlign: 'center' }}>
      <span style={{ fontSize: '14px', color: '#aaa' }}>{label}</span><br/>
      <strong style={{ fontSize: '20px' }}>{value}</strong>
    </div>
  );
}
