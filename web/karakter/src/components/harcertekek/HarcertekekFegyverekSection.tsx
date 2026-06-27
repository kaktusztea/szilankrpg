import type { Karakter, FegyverPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/helpers';
import { FegyverChip } from './HarcertekekFegyverChip';
import { getMfFok, mfKövetelményHiba, mfKövetelményText, buildFegyverByKat, FEGYVER_KATEGORIAK } from './helpers';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  gameMode: boolean;
  onIdeaTarget: (idx: number) => void;
  onMfTarget: (idx: number) => void;
  onAnyagTarget: (idx: number) => void;
  onDeleteTarget: (idx: number) => void;
}

export function FegyverekSection({ data, karakter: k, setKarakter, gameMode, onIdeaTarget, onMfTarget, onAnyagTarget, onDeleteTarget }: Props) {
  const { konstansok } = data;

  function addFegyver(alap: string) {
    setKarakter(prev => {
      if (!prev) return prev;
      return { ...prev, fegyverek: [...prev.fegyverek, { alap, név: '', anyag: 'acél', idea: 0 }] };
    });
  }

  const felvettFegyverek = new Set(k.fegyverek.map(fp => fp.alap.toLowerCase()));
  const fegyverByKat = buildFegyverByKat(data, felvettFegyverek);

  return (
    <section className="he-section">
      <h3>Fegyverek</h3>
      {k.fegyverek.map((f, i) => (
        <FegyverCard
          key={i}
          index={i}
          fegyver={f}
          data={data}
          karakter={k}
          konstansok={konstansok}
          onIdeaTarget={onIdeaTarget}
          onMfTarget={onMfTarget}
          onAnyagTarget={onAnyagTarget}
          onDeleteTarget={onDeleteTarget}
        />
      ))}
      {!gameMode && (
        <select className="he-add-select" value="" onChange={e => { if (e.target.value) addFegyver(e.target.value); }}>
          <option value="">+ Új fegyver...</option>
          {FEGYVER_KATEGORIAK.filter(kat => fegyverByKat.has(kat)).map(kat => (
            <optgroup key={kat} label={kat}>
              {fegyverByKat.get(kat)!.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </optgroup>
          ))}
        </select>
      )}
    </section>
  );
}

// --- FegyverCard ---

function FegyverCard({ index, fegyver, data, karakter, konstansok, onIdeaTarget, onMfTarget, onAnyagTarget, onDeleteTarget }: {
  index: number;
  fegyver: FegyverPeldany;
  data: GameData;
  karakter: Karakter;
  konstansok: GameData['konstansok'];
  onIdeaTarget: (idx: number) => void;
  onMfTarget: (idx: number) => void;
  onAnyagTarget: (idx: number) => void;
  onDeleteTarget: (idx: number) => void;
}) {
  const fd = lookupFegyver(data.fegyverek, fegyver.alap);
  const mfFok = getMfFok(data, karakter, fegyver.alap);
  const hasError = mfKövetelményHiba(data, karakter, fegyver.alap);
  const errorText = mfKövetelményText(data, karakter, fegyver.alap);

  return (
    <div className="he-fegyver-card">
      <div className="he-fegyver-header">
        <strong>{fegyver.alap.replace(/ \(1K\)$| 1K$/, '')}</strong>
        <button className="fort-delete" onClick={() => onDeleteTarget(index)}>✕</button>
      </div>
      {fd && <FegyverChip fd={fd} mfFok={mfFok} idea={fegyver.idea} konstansok={konstansok} />}
      <div className="he-fegyver-fields">
        <button
          className={`he-field-btn he-field-fortely${hasError ? ' he-error' : ''}`}
          onClick={() => onMfTarget(index)}
        >
          MF fok: <strong>{mfFok}</strong>
          {hasError && <span className="he-mf-error">{errorText}</span>}
        </button>
        <button className="he-field-btn" onClick={() => onIdeaTarget(index)}>Idea: <strong>{fegyver.idea}</strong></button>
        <button className="he-field-btn" onClick={() => onAnyagTarget(index)}>Anyag: <strong>{fegyver.anyag}</strong></button>
      </div>
    </div>
  );
}
