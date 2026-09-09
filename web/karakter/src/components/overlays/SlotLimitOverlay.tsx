import { OverlayPortal } from './OverlayPortal';
import { MAX_KARAKTER_DB, MAX_NJK_DB } from '../../ui-constants';

/** 'total' = összes karakter limit, 'njk' = tárolt NJK limit */
export type SlotLimitKind = 'total' | 'njk';

const SZÖVEGEK: Record<SlotLimitKind, { cím: string; sorok: string[] }> = {
  total: {
    cím: 'Karakter limit',
    sorok: [
      'Nem hozható létre új karakter.',
      `Maximum tárolható karakterek száma: ${MAX_KARAKTER_DB}`,
      'Törölj egy régebbi karaktert, ha újat akarsz létrehozni.',
    ],
  },
  njk: {
    cím: 'NJK limit',
    sorok: [
      'Nem hozható létre új NJK.',
      `Maximum tárolható NJK-k száma: ${MAX_NJK_DB}`,
      'Törölj egy régebbi NJK-t, ha újat akarsz létrehozni.',
    ],
  },
};

interface Props {
  kind: SlotLimitKind;
  onClose: () => void;
}

export function SlotLimitOverlay({ kind, onClose }: Props) {
  const { cím, sorok } = SZÖVEGEK[kind];
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-confirm">
        <label className="overlay-label overlay-label-error">{cím}</label>
        <span className="overlay-desc">
          {sorok.map((sor, i) => (
            <span key={i}>{sor}{i < sorok.length - 1 && <br />}</span>
          ))}
        </span>
      </div>
    </OverlayPortal>
  );
}
