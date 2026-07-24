interface Props {
  aura: number;
  me: number;
  onMágiaAkarata?: () => void;
}

export function AuraPanel({ aura, me, onMágiaAkarata }: Props) {
  return (
    <div className="aura-panel">
      <div className="aura-card">
        <span className="aura-card-label">Mágiaellenállás</span><br/>
        <strong className="aura-card-value">{me}</strong>
      </div>
      <div className={`aura-card${onMágiaAkarata ? ' aura-card-clickable' : ''}`}
        onClick={onMágiaAkarata}>
        <span className="aura-card-label">Mágia akarata</span><br/>
        <strong className="aura-card-value">{aura} + k20</strong>
      </div>
      <div className="aura-card">
        <span className="aura-card-label">Aura</span><br/>
        <strong className="aura-card-value">{aura}</strong>
      </div>
    </div>
  );
}
