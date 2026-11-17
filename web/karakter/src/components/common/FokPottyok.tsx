import './common.css';
/** Fortély fok as tappable purple dots (filled / empty), e.g. MF, Merevvértviselet, Pajzshasználat. Red on requirement error.
 *  Without onClick: display-only span (e.g. inside another button). */
export function FokPottyok({ név, fok, max, hiba, onClick }: { név: string; fok: number; max: number; hiba?: boolean; onClick?: () => void }) {
  const pöttyök = Array.from({ length: max }, (_, i) => <span key={i} className={`he-mf-dot${i < fok ? ' filled' : ''}`} />);
  if (!onClick) return <span className={`he-mf-dots he-mf-dots-statikus${hiba ? ' he-error' : ''}`} title={`${név}: ${fok}`}>{pöttyök}</span>;
  return (
    <button type="button" className={`he-mf-dots${hiba ? ' he-error' : ''}`} title={`${név}: ${fok}`} aria-label={`${név}: ${fok} - módosítás`}
      onClick={onClick}>
      {pöttyök}
    </button>
  );
}
