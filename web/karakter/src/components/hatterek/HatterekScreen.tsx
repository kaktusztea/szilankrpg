
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../../engine/data-types';
import type { Karakter } from '../../engine/types';
import './HatterekScreen.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string) => void;
  gameMode: boolean;
  onNavigate?: (tab: string) => void;
}

type HátterField = 'leíró' | 'karma';

/** Extract base name from "Név: kiegészítő" — uses LAST ": " as separator */
function baseName(entry: string): string {
  const idx = entry.lastIndexOf(': ');
  return idx >= 0 ? entry.slice(0, idx) : entry;
}

export function HatterekScreen({ data, karakter, setKarakter, pushUndo, gameMode, onNavigate }: Props) {
  const [freeTextPopup, setFreeTextPopup] = useState<{ field: HátterField; elem: string } | null>(null);
  const [freeText, setFreeText] = useState('');

  function updateField(field: HátterField, updater: (arr: string[]) => string[], undoMsg: string) {
    pushUndo(undoMsg);
    setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, [field]: updater(prev.hátterek[field]) } } : prev);
  }

  function handleToggle(item: string, field: HátterField, többszörös: boolean) {
    if (gameMode) return;
    if (többszörös) {
      setFreeText('');
      setFreeTextPopup({ field, elem: item });
      return;
    }
    const has = karakter.hátterek[field].includes(item);
    updateField(field, arr => has ? arr.filter(h => h !== item) : [...arr, item], `Háttér: ${item} ${has ? '❌' : '✓'}`);
  }

  function confirmFreeText() {
    if (!freeTextPopup || !freeText.trim()) return;
    const entry = `${freeTextPopup.elem}: ${freeText.trim()}`;
    updateField(freeTextPopup.field, arr => [...arr, entry], `Háttér: ${entry} ✓`);
    setFreeTextPopup(null);
  }

  function handleRemove(entry: string, field: HátterField) {
    if (gameMode) return;
    updateField(field, arr => { const a = [...arr]; const i = a.indexOf(entry); if (i >= 0) a.splice(i, 1); return a; }, `Háttér: ${entry} ❌`);
  }

  function getMultiEntries(baseNév: string, field: HátterField) {
    return karakter.hátterek[field].filter(e => baseName(e) === baseNév);
  }

  /** Render ✕ button for removable chips */
  function renderX(entry: string, field: HátterField) {
    if (gameMode) return null;
    return <span className="hatter-multi-x" onClick={(e) => { e.stopPropagation(); handleRemove(entry, field); }}>✕</span>;
  }

  return (
    <div className="screen hatterek-screen">
      <h2>🟡 Hátterek</h2>

      {/* Faj háttér */}
      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Faj háttér</span>
        <div className="hatter-cloud">
          <span className="hatter-tag active" onClick={() => onNavigate?.('tulajdonsagok')}>{karakter.hátterek.faj || '— nincs —'}</span>
        </div>
      </div>

      {/* Leíró hátterek */}
      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Leíró hátterek</span>
        {data.hatterek.leíró_hátterek.map(cat => (
          <div key={cat.kategória} className="hatter-cloud-cat">
            <span className="hatter-cat-label">{cat.kategória}</span>
            <div className="hatter-cloud">
              {cat.többszörös ? (
                <>
                  {cat.elemek.flatMap(item =>
                    getMultiEntries(item, 'leíró').map((entry, i) => (
                      <span key={`a-${entry}-${i}`} className="hatter-tag active">
                        {entry}{renderX(entry, 'leíró')}
                      </span>
                    ))
                  )}
                  {cat.elemek.map(item => (
                    <span key={item} className="hatter-tag hatter-tag-multi" onClick={() => handleToggle(item, 'leíró', true)}>{item}</span>
                  ))}
                </>
              ) : (
                [...cat.elemek].sort((a, b) => {
                  const aAct = karakter.hátterek.leíró.includes(a) ? 0 : 1;
                  const bAct = karakter.hátterek.leíró.includes(b) ? 0 : 1;
                  return aAct - bAct || a.localeCompare(b, 'hu');
                }).map(item => (
                  <span key={item} className={`hatter-tag ${karakter.hátterek.leíró.includes(item) ? 'active' : ''}`} onClick={() => handleToggle(item, 'leíró', false)}>{item}</span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Karma hátterek */}
      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Karma hátterek</span>
        <div className="hatter-cloud">
          {/* Active entries first */}
          {data.hatterek.karma_hátterek.flatMap(entry =>
            entry.többszörös
              ? getMultiEntries(entry.név, 'karma').map((e, i) => (
                  <span key={`a-${e}-${i}`} className="hatter-tag karma active">{e}{renderX(e, 'karma')}</span>
                ))
              : karakter.hátterek.karma.includes(entry.név)
                ? [<span key={`a-${entry.név}`} className="hatter-tag karma active" onClick={() => handleToggle(entry.név, 'karma', false)}>{entry.név}</span>]
                : []
          )}
          {/* Picker buttons / inactive entries */}
          {[...data.hatterek.karma_hátterek].sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(entry =>
            entry.többszörös
              ? <span key={entry.név} className="hatter-tag karma hatter-tag-multi" onClick={() => handleToggle(entry.név, 'karma', true)}>{entry.név}</span>
              : !karakter.hátterek.karma.includes(entry.név)
                ? <span key={entry.név} className="hatter-tag karma" onClick={() => handleToggle(entry.név, 'karma', false)}>{entry.név}</span>
                : null
          )}
        </div>
      </div>

      {/* Free text popup */}
      {freeTextPopup && createPortal(
        <div className="kep-prompt-overlay" onClick={() => setFreeTextPopup(null)}>
          <div className="kep-prompt" onClick={e => e.stopPropagation()}>
            <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>{freeTextPopup.elem}</label>
            <input
              className="kep-prompt-input"
              type="text"
              maxLength={20}
              autoFocus
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmFreeText(); if (e.key === 'Escape') setFreeTextPopup(null); }}
              placeholder="Kiegészítő szöveg (max 20)"
            />
            <div className="kep-prompt-btns" style={{ marginTop: 10 }}>
              <button onClick={confirmFreeText} disabled={!freeText.trim()}>OK</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
