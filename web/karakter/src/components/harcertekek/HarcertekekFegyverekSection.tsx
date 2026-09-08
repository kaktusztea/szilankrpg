import { useState } from 'react';
import type { Karakter, FegyverPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';
import { FegyverChip } from './HarcertekekFegyverChip';
import { getMfFok, mfKövetelményHiba, mfKövetelményText } from './helpers';
import { SpecPicker, type PickerSource } from '../SpecPicker';
import { buildFegyverGroups } from '../fegyver-groups';
import { MAX_FEGYVER_DARAB } from '../../ui-constants';

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
  const [pickerOpen, setPickerOpen] = useState(false);

  function addFegyver(alap: string) {
    setKarakter(prev => {
      if (!prev) return prev;
      const defaultAnyag = (konstansok.fegyver_anyagok as string[])[0] ?? '';
      return { ...prev, fegyverek: [...prev.fegyverek, { alap, név: '', anyag: defaultAnyag, idea: 0 }] };
    });
  }

  const felvettFegyverek = new Set(k.fegyverek.map(fp => fp.alap.toLowerCase()));
  const pickerSource: PickerSource = {
    type: 'grouped',
    label: '+ Új fegyver:',
    groups: buildFegyverGroups(data, f => f.Fegyver, felvettFegyverek),
  };

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
      {!gameMode && k.fegyverek.length < MAX_FEGYVER_DARAB && (
        <button className="he-add-select" onClick={() => setPickerOpen(true)}>+ Új fegyver…</button>
      )}
      {pickerOpen && (
        <SpecPicker
          source={pickerSource}
          onSelect={alap => { addFegyver(alap); setPickerOpen(false); }}
          onCancel={() => setPickerOpen(false)}
        />
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
        <button className="item-delete" onClick={() => onDeleteTarget(index)}>✕</button>
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
