import { useState } from 'react';
import type { GameData } from '../../engine/data-types';
import type { Karakter } from '../../engine/types';
import type { HátterField } from './types';
import { TagCloud } from './TagCloud';
import { KarmaCloud } from './KarmaCloud';
import { FreeTextPopup } from './FreeTextPopup';
import './HatterekScreen.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string) => void;
  gameMode: boolean;
  onNavigate?: (tab: string) => void;
}

function baseName(entry: string): string {
  const idx = entry.lastIndexOf(' (');
  return idx >= 0 && entry.endsWith(')') ? entry.slice(0, idx) : entry;
}

export function HatterekScreen({ data, karakter, setKarakter, pushUndo, gameMode, onNavigate }: Props) {
  const [popup, setPopup] = useState<{ field: HátterField; elem: string } | null>(null);

  function updateField(field: HátterField, updater: (arr: string[]) => string[], undoMsg: string) {
    pushUndo(undoMsg);
    setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, [field]: updater(prev.hátterek[field]) } } : prev);
  }

  function handleToggle(item: string, field: HátterField, többszörös: boolean) {
    if (gameMode) return;
    if (többszörös) {
      setPopup({ field, elem: item });
      return;
    }
    const has = karakter.hátterek[field].includes(item);
    updateField(field, arr => has ? arr.filter(h => h !== item) : [...arr, item], `Háttér: ${item} ${has ? '❌' : '✓'}`);
  }

  function handleRemove(entry: string, field: HátterField) {
    if (gameMode) return;
    updateField(field, arr => arr.filter(e => e !== entry), `Háttér: ${entry} ❌`);
  }

  function getMultiEntries(baseNév: string, field: HátterField) {
    return karakter.hátterek[field].filter(e => baseName(e) === baseNév);
  }

  function handleFreeTextConfirm(text: string) {
    if (!popup) return;
    const entry = `${popup.elem} (${text})`;
    updateField(popup.field, arr => [...arr, entry], `Háttér: ${entry} ✓`);
    setPopup(null);
  }

  return (
    <div className="screen hatterek-screen">
      <h2>🟡 Hátterek</h2>

      {/* Faj háttér */}
      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Faj háttér</span>
        <div className="hatter-cloud">
          <span className="hatter-tag active" onClick={() => onNavigate?.('tulajdonsagok')}>
            {karakter.hátterek.faj || '— nincs —'}
          </span>
        </div>
      </div>

      {/* Leíró hátterek */}
      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Leíró hátterek</span>
        {data.hatterek.leíró_hátterek.map(cat => (
          <div key={cat.kategória} className="hatter-cloud-cat">
            <span className="hatter-cat-label">{cat.kategória}</span>
            <TagCloud
              items={cat.elemek}
              aktív={karakter.hátterek.leíró}
              field="leíró"
              többszörös={cat.többszörös}
              gameMode={gameMode}
              onToggle={handleToggle}
              onRemove={handleRemove}
              getMultiEntries={getMultiEntries}
            />
          </div>
        ))}
      </div>

      {/* Karma hátterek */}
      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Karma hátterek</span>
        <KarmaCloud
          entries={data.hatterek.karma_hátterek}
          aktív={karakter.hátterek.karma}
          gameMode={gameMode}
          onToggle={handleToggle}
          onRemove={handleRemove}
          getMultiEntries={getMultiEntries}
        />
      </div>

      {popup && (
        <FreeTextPopup
          label={popup.elem}
          onConfirm={handleFreeTextConfirm}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
