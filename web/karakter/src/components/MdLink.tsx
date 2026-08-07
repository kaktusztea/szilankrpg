export const REPO_BASE = 'https://github.com/kaktusztea/szilankrpg/blob/master/';
export const MD_BASE = REPO_BASE + 'md/';

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
