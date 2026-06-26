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
    <section className="miszt-section">
      <h3 className="miszt-section-title">Faj misztérium</h3>
      {!fajNév ? (
        <span className="miszt-no-faj">Faj nincs kiválasztva</span>
      ) : (
        <div className="miszt-row" onClick={() => !gameMode && onEdit(fajMisztNév)}>
          <span className="miszt-row-name">{fajNév}</span>
          <strong className={`kep-szint${szint > maxSzint ? ' kep-over' : szint >= 9 ? ' kep-szint-high' : ''}`}>{szint}</strong>
        </div>
      )}
    </section>
  );
}
