
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import './HatterekScreen.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string) => void;
  gameMode: boolean;
  onNavigate?: (tab: string) => void;
}

export function HatterekScreen({ data, karakter, setKarakter, pushUndo, gameMode, onNavigate }: Props) {

  function handleTap(item: string, típus: 'leíró' | 'karma') {
    if (gameMode) return;
    if (típus === 'leíró') {
      const has = karakter.hátterek.leíró.includes(item);
      pushUndo(`Háttér: ${item} ${has ? '❌' : '✓'}`);
      setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, leíró: has ? prev.hátterek.leíró.filter(h => h !== item) : [...prev.hátterek.leíró, item] } } : prev);
    } else {
      const has = karakter.hátterek.karma.includes(item);
      pushUndo(`Karma: ${item} ${has ? '❌' : '✓'}`);
      setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, karma: has ? prev.hátterek.karma.filter(h => h !== item) : [...prev.hátterek.karma, item] } } : prev);
    }
  }

  return (
    <div className="screen hatterek-screen">
      <h2>🟡 Hátterek</h2>

      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Faj háttér</span>
        <div className="hatter-cloud">
          <span className="hatter-tag active" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('tulajdonsagok')}>{karakter.hátterek.faj || '— nincs —'}</span>
        </div>
      </div>

      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Leíró hátterek</span>
        {data.hatterek.leíró_hátterek.map(cat => (
          <div key={cat.kategória} className="hatter-cloud-cat">
            <span className="hatter-cat-label">{cat.kategória}</span>
            <div className="hatter-cloud">
              {[...cat.elemek].sort((a, b) => {
                const aAct = karakter.hátterek.leíró.includes(a) ? 0 : 1;
                const bAct = karakter.hátterek.leíró.includes(b) ? 0 : 1;
                return aAct - bAct || a.localeCompare(b, 'hu');
              }).map(item => (
                <span key={item} className={`hatter-tag ${karakter.hátterek.leíró.includes(item) ? 'active' : ''}`} onClick={() => handleTap(item, 'leíró')}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hatter-cloud-section">
        <span className="hatter-cloud-title">Karma hátterek</span>
        <div className="hatter-cloud">
          {[...data.hatterek.karma_hátterek].sort((a, b) => {
            const aAct = karakter.hátterek.karma.includes(a) ? 0 : 1;
            const bAct = karakter.hátterek.karma.includes(b) ? 0 : 1;
            return aAct - bAct || a.localeCompare(b, 'hu');
          }).map(item => (
            <span key={item} className={`hatter-tag karma ${karakter.hátterek.karma.includes(item) ? 'active' : ''}`} onClick={() => handleTap(item, 'karma')}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
