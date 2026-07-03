import type { KarmaHátterEntry } from '../../engine/data-types';
import type { HátterField } from './types';

interface KarmaCloudProps {
  entries: KarmaHátterEntry[];
  aktív: string[];
  gameMode: boolean;
  onToggle: (item: string, field: HátterField, többszörös: boolean) => void;
  onRemove: (entry: string, field: HátterField) => void;
  getMultiEntries: (baseNév: string, field: HátterField) => string[];
  isMaxed?: (item: string, field: HátterField) => boolean;
}

export function KarmaCloud({ entries, aktív, gameMode, onToggle, onRemove, getMultiEntries, isMaxed }: KarmaCloudProps) {
  return (
    <div className="hatter-cloud">
      {/* Active entries first */}
      {entries.flatMap(entry =>
        entry.többszörös
          ? getMultiEntries(entry.név, 'karma').map((e, i) => (
              <span key={`a-${e}-${i}`} className="hatter-tag active" onClick={() => !gameMode && onRemove(e, 'karma')}>
                {e}
              </span>
            ))
          : aktív.includes(entry.név)
            ? [<span key={`a-${entry.név}`} className="hatter-tag active" onClick={() => onToggle(entry.név, 'karma', false)}>{entry.név}</span>]
            : []
      )}
      {/* Picker / inactive entries */}
      {[...entries].sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(entry =>
        entry.többszörös
          ? (!gameMode && <span key={entry.név} className={`hatter-tag hatter-tag-multi${isMaxed?.(entry.név, 'karma') ? ' hatter-tag-disabled' : ''}`} onClick={() => onToggle(entry.név, 'karma', true)}>{entry.név}</span>)
          : !aktív.includes(entry.név)
            ? <span key={entry.név} className="hatter-tag" onClick={() => onToggle(entry.név, 'karma', false)}>{entry.név}</span>
            : null
      )}
    </div>
  );
}
