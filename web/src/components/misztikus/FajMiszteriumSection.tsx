interface FajMisztériumSectionProps {
  fajNév: string;
  szint: number;
  maxSzint: number;
  gameMode: boolean;
  onEdit: (név: string) => void;
}

export function FajMisztériumSection({ fajNév, szint, maxSzint, gameMode, onEdit }: FajMisztériumSectionProps) {
  if (gameMode && szint === 0) return null;

  const fajMisztNév = fajNév ? `Faj misztérium: ${fajNév}` : '';

  return (
    <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
      <h3 style={{ fontSize: '17px', color: '#42a5f5', margin: '0 0 6px' }}>Faj misztérium</h3>
      {!fajNév ? (
        <span style={{ color: '#666', fontSize: '13px' }}>Faj nincs kiválasztva</span>
      ) : (
        <div className="miszt-row" onClick={() => !gameMode && onEdit(fajMisztNév)}>
          <span className="miszt-row-name">{fajNév}</span>
          <strong className={`kep-szint${szint > maxSzint ? ' kep-over' : szint >= 9 ? ' kep-szint-high' : ''}`}>{szint}</strong>
        </div>
      )}
    </section>
  );
}
