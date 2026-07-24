import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { isTaktikaAllowed, formatFokMods } from './AktivHelpers';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  onAddSimple: (név: string) => void;
  onFokválasztó: (név: string) => void;
}

export function TaktikaPickerList({ data, karakter, session, onAddSimple, onFokválasztó }: Props) {
  const pinned = (data.konstansok.pinned_taktikák ?? []) as string[];
  const items = data.taktikak
    .filter(t => !session.aktív_taktikák.some(a => a.név === t.név) && isTaktikaAllowed(t.név, session, karakter, data))
    .sort((a, b) => {
      // Távharci taktikák mindig a végére kerülnek
      const aRemote = a.csoport === 'távharc' ? 1 : 0;
      const bRemote = b.csoport === 'távharc' ? 1 : 0;
      if (aRemote !== bRemote) return aRemote - bRemote;
      const aPin = pinned.indexOf(a.név), bPin = pinned.indexOf(b.név);
      if (aPin >= 0 && bPin >= 0) return aPin - bPin;
      if (aPin >= 0) return -1;
      if (bPin >= 0) return 1;
      return a.név.localeCompare(b.név, 'hu');
    });

  let tavharcHeaderShown = false;

  return <>
    {items.map(t => {
      const showHeader = t.csoport === 'távharc' && !tavharcHeaderShown;
      if (showHeader) tavharcHeaderShown = true;
      return <div key={t.név}>
        {showHeader && <div className="manover-category-label aktiv-picker-tavharc-header">🏹 Távharci taktikák</div>}
        <div className="aktiv-picker-item" onClick={() => {
          if (t.fokozatos) onFokválasztó(t.név);
          else onAddSimple(t.név);
        }}>
          <span className="aktiv-picker-item-name">{t.név}{t.fokozatos ? ' 📶' : ''}</span>
          <span className="aktiv-picker-item-details">
            {t.fokozatos && t.fokok
              ? t.fokok.map((f: any) => `${f.fok}: ${formatFokMods(f)}`).join(' | ')
              : t.módosítók ? Object.entries(t.módosítók).filter(([, v]) => v !== 0).map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(', ') : ''}
          </span>
          {t.megjegyzés && <span className="aktiv-picker-item-hatas">{t.megjegyzés}</span>}
        </div>
      </div>;
    })}
  </>;
}
