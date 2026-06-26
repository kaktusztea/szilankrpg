import { createPortal } from 'react-dom';
import type { GameData } from '../../engine/data-loader';
import type { KepzettsegSlot } from './types';
import { KorPicker } from './KorPicker';
import { getDisplayName } from './helpers';

interface PromptState { alapNév: string }
interface DeleteTarget { idx: number; név: string; szint: number }

interface Props {
  data: GameData;
  képzettségek: KepzettsegSlot[];
  setKépzettségek: React.Dispatch<React.SetStateAction<KepzettsegSlot[]>>;
  // Prompt (szabad szöveges többszörös)
  promptState: PromptState | null;
  setPromptState: (v: PromptState | null) => void;
  promptValue: string;
  setPromptValue: (v: string) => void;
  onConfirmPrompt: () => void;
  // Delete confirm
  deleteTarget: DeleteTarget | null;
  setDeleteTarget: (v: DeleteTarget | null) => void;
  // Pending edit (szint popup új képzettséghez)
  pendingEditIdx: number | null;
  setPendingEditIdx: (v: number | null) => void;
  // Név editor
  editingNév: boolean;
  setEditingNév: (v: boolean) => void;
  tempNév: string;
  setTempNév: (v: string) => void;
  setNév: (v: string) => void;
  // Becenév editor
  editingBecenév: boolean;
  setEditingBecenév: (v: boolean) => void;
  tempBecenév: string;
  setTempBecenév: (v: string) => void;
  setBecenév: (v: string) => void;
  // TSZ editor
  editingTsz: boolean;
  setEditingTsz: (v: boolean) => void;
  tsz: number;
  setTsz: (v: number) => void;
  // Kor editor
  editingKor: boolean;
  setEditingKor: (v: boolean) => void;
  kor: number;
  setKor: (v: number) => void;
  // Játékos editor
  editingJátékos: boolean;
  setEditingJátékos: (v: boolean) => void;
  tempJátékos: string;
  setTempJátékos: (v: string) => void;
  setJátékos: (v: string) => void;
}

export function TulajdonsagokPopups({
  data, képzettségek, setKépzettségek,
  promptState, setPromptState, promptValue, setPromptValue, onConfirmPrompt,
  deleteTarget, setDeleteTarget,
  pendingEditIdx, setPendingEditIdx,
  editingNév, setEditingNév, tempNév, setTempNév, setNév,
  editingBecenév, setEditingBecenév, tempBecenév, setTempBecenév, setBecenév,
  editingTsz, setEditingTsz, tsz, setTsz,
  editingKor, setEditingKor, kor, setKor,
  editingJátékos, setEditingJátékos, tempJátékos, setTempJátékos, setJátékos
}: Props) {
  return (<>
    {promptState && createPortal(
      <div className="kep-prompt-overlay">
        <div className="kep-prompt">
          <label>{promptState.alapNév} — alnév:</label>
          <input autoFocus maxLength={20} value={promptValue}
            onChange={e => setPromptValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onConfirmPrompt(); if (e.key === 'Escape') setPromptState(null); }}
          />
          <div className="kep-prompt-btns">
            <button onClick={onConfirmPrompt} disabled={!promptValue.trim()}>OK</button>
            <button onClick={() => setPromptState(null)}>Mégse</button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {deleteTarget && createPortal(
      <div className="kep-prompt-overlay">
        <div className="kep-prompt" style={{ alignItems: 'center' }}>
          <label>{deleteTarget.név}</label>
          <button className="btn-del-confirm he-del-confirm" onClick={() => { setKépzettségek(prev => prev.filter((_, i) => i !== deleteTarget.idx)); setDeleteTarget(null); }}>Képzettség törlése</button>
        </div>
      </div>,
      document.body
    )}

    {pendingEditIdx !== null && createPortal(
      <div className="kep-prompt-overlay">
        <div className="kep-prompt">
          <label>{getDisplayName(képzettségek[pendingEditIdx]?.név ?? '', data.kepzettsegDefs)} — szint:</label>
          <div className="kep-szint-grid">
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
              <button key={n} className={`fort-fok-btn ${képzettségek[pendingEditIdx!]?.szint === n ? 'active' : ''}`}
                onClick={() => { setKépzettségek(prev => prev.map((k, i) => i === pendingEditIdx ? { ...k, szint: n } : k)); setPendingEditIdx(null); }}>{n}</button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )}

    {editingNév && createPortal(
      <div className="kep-prompt-overlay">
        <div className="kep-prompt">
          <label>Karakter neve:</label>
          <input autoFocus maxLength={40} value={tempNév}
            onChange={e => setTempNév(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && tempNév.trim()) { setNév(tempNév.trim()); setEditingNév(false); } if (e.key === 'Escape') setEditingNév(false); }}
          />
          <div className="kep-prompt-btns">
            <button onClick={() => { setNév(tempNév.trim()); setEditingNév(false); }} disabled={!tempNév.trim()}>OK</button>
            <button onClick={() => setEditingNév(false)}>Mégse</button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {editingTsz && createPortal(
      <div className="kep-prompt-overlay">
        <div className="kep-prompt">
          <label>Tapasztalati szint</label>
          <div className="kep-szint-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', maxWidth: `${5 * 36 + 4 * 6}px`, margin: '0 auto' }}>
            {Array.from({ length: data.konstansok.arányok.max_tsz - 2 }, (_, i) => i + 3).map(n => (
              <button key={n} className={`fort-fok-btn ${tsz === n ? 'active' : ''}`} style={{ width: '36px', height: '36px' }} onClick={() => { setTsz(n); setEditingTsz(false); }}>{n}</button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )}

    {editingKor && createPortal(
      <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setEditingKor(false); }}>
        <KorPicker kor={kor} onSelect={v => setKor(v)} />
      </div>,
      document.body
    )}

    {editingJátékos && createPortal(
      <div className="kep-prompt-overlay">
        <div className="kep-prompt">
          <label>Játékos neve</label>
          <input autoFocus maxLength={40} value={tempJátékos}
            onChange={e => setTempJátékos(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setJátékos(tempJátékos); setEditingJátékos(false); } }} />
          <div className="kep-prompt-btns">
            <button onClick={() => { setJátékos(tempJátékos); setEditingJátékos(false); }}>OK</button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {editingBecenév && createPortal(
      <div className="kep-prompt-overlay">
        <div className="kep-prompt">
          <label>Becenév (max 12)</label>
          <input autoFocus maxLength={12} value={tempBecenév}
            onChange={e => setTempBecenév(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setBecenév(tempBecenév.trim()); setEditingBecenév(false); } if (e.key === 'Escape') setEditingBecenév(false); }} />
          <div className="kep-prompt-btns">
            <button onClick={() => { setBecenév(tempBecenév.trim()); setEditingBecenév(false); }}>OK</button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>);
}
