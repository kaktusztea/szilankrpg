import type { TradícióOpció } from '../types';
import { OverlayPortal } from '../../overlays/OverlayPortal';

interface Props {
  tradícióNév: string;
  opciók: TradícióOpció[];
  onPick: (tradíció: string, altípus: string) => void;
  onClose: () => void;
}

export function AltípusPickerPopup({ tradícióNév, opciók, onPick, onClose }: Props) {
  const trad = opciók.find(t => t.név === tradícióNév);
  if (!trad) return null;

  const hasPantheon = trad.altípusok.some(a => a.pantheon);

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt" onClick={e => e.stopPropagation()}>
        <label className="kep-prompt-label-bold-mb">{tradícióNév} — altípus</label>
        <div className="kep-prompt-flex-col-list">
          {!hasPantheon
            ? trad.altípusok.map(a => (
                <button key={a.név} className="he-field-btn" onClick={() => onPick(tradícióNév, a.név)}>{a.név}</button>
              ))
            : <PantheonLista altípusok={trad.altípusok} onPick={név => onPick(tradícióNév, név)} />
          }
        </div>
      </div>
    </OverlayPortal>
  );
}

function PantheonLista({ altípusok, onPick }: {
  altípusok: { név: string; leírás?: string; pantheon?: string }[];
  onPick: (név: string) => void;
}) {
  const byPantheon = new Map<string, typeof altípusok>();
  for (const a of altípusok) {
    const p = a.pantheon || '';
    if (!byPantheon.has(p)) byPantheon.set(p, []);
    byPantheon.get(p)!.push(a);
  }

  return (
    <>
      {[...byPantheon.entries()].map(([pantheon, items]) => (
        <div key={pantheon} className="miszt-pantheon-group">
          <div className="miszt-section-label">{pantheon}</div>
          {items.map(item => (
            <button key={item.név} className="he-field-btn" onClick={() => onPick(item.név)}>
              {item.név} {item.leírás && <span className="kep-prompt-text-dim-sm">— {item.leírás}</span>}
            </button>
          ))}
        </div>
      ))}
    </>
  );
}
