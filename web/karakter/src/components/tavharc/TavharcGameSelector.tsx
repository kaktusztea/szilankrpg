import type { Session } from '../../engine/types';
import type { VirtuálisFegyver } from './types';

interface Props {
  összesFegyver: VirtuálisFegyver[];
  tfIdx: number;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  mfFok: number;
  idea: number;
  isMágikus?: boolean;
}

export function TavharcGameSelector({ összesFegyver, tfIdx, setSession, mfFok, idea, isMágikus }: Props) {
  if (összesFegyver.length === 0) return null;

  return (
    <div className="th-row th-controls">
      <select className="field-select th-select" value={tfIdx} onChange={e => setSession(s => ({ ...s, aktív_távfegyver_index: parseInt(e.target.value) }))}>
        {összesFegyver.map((tf, i) => <option key={i} value={i}>{tf.locked ? '🔆 ' : ''}{tf.alap}</option>)}
      </select>
      <span className="th-badge">MF: {mfFok}</span>
      {!isMágikus && <span className="th-badge">Idea: {idea >= 0 ? '+' : ''}{idea}</span>}
    </div>
  );
}
