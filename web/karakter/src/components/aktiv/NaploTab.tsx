import type { Karakter } from '../../engine/types';
import { CheckpointSection } from './CheckpointSection';
import { NaploSection } from './NaploSection';
import './NaploTab.css';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  onViewCheckpoint?: (id: string) => void;
}

/** Verziók + Napló accordionok (OverlayScreenOverlay tartalma). */
export function NaploTab({ karakter, setKarakter, onViewCheckpoint }: Props) {
  return (
    <div className="screen naplo-screen">
      <CheckpointSection karakter={karakter} setKarakter={setKarakter} onViewCheckpoint={onViewCheckpoint} />
      <NaploSection karakter={karakter} setKarakter={setKarakter} />
    </div>
  );
}
