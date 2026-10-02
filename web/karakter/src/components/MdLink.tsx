// A repo base a Vite `define`-ból jön (site.config.ts). Teszt környezetben nincs
// beállítva, ezért a fallback - a futó appban mindig a define értéke érvényesül.
export const REPO_BASE =
  typeof __REPO_BLOB_BASE__ !== 'undefined'
    ? __REPO_BLOB_BASE__
    : 'https://github.com/kaktusztea/szilankrpg/blob/master/';
export const MD_BASE = REPO_BASE + 'md/';

/** Nyers fájl letöltési base (raw) - pl. PDF-ekhez. */
export const REPO_RAW_BASE =
  typeof __REPO_RAW_BASE__ !== 'undefined'
    ? __REPO_RAW_BASE__
    : 'https://github.com/kaktusztea/szilankrpg/raw/master/';

interface Props {
  mdFájl: string;
}

export function MdLink({ mdFájl }: Props) {
  if (!mdFájl) return null;
  return (
    <a
      className="md-link"
      href={MD_BASE + mdFájl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
    >🔗</a>
  );
}
