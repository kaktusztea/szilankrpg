/** Fortély fok as tappable purple dots (filled / empty), e.g. MF, Merevvértviselet, Pajzshasználat. Red on requirement error. */
export function FokPottyok({ név, fok, max, hiba, onClick }: { név: string; fok: number; max: number; hiba?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`he-mf-dots${hiba ? ' he-error' : ''}`} title={`${név}: ${fok}`} aria-label={`${név}: ${fok} - módosítás`}
      onClick={onClick}>
      {Array.from({ length: max }, (_, i) => <span key={i} className={`he-mf-dot${i < fok ? ' filled' : ''}`} />)}
    </button>
  );
}
