import { useState } from 'react';
import type { Karakter, FegyverPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';
import { elsődlegesMód } from '../harc/fegyver-calc';
import { ideaDelta } from '../harc/shared';
import { FegyverChip } from './HarcertekekFegyverChip';
import { fegyverÁr } from './fegyver-ar-calc';
import { árFormátum } from '../formatters';
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
  onBecenévTarget: (idx: number) => void;
  onDeleteTarget: (idx: number) => void;
}

export function FegyverekSection({ data, karakter: k, setKarakter, gameMode, onIdeaTarget, onMfTarget, onAnyagTarget, onBecenévTarget, onDeleteTarget }: Props) {
  const { konstansok } = data;
  const [pickerOpen, setPickerOpen] = useState(false);

  function addFegyver(alap: string) {
    setKarakter(prev => {
      if (!prev) return prev;
      const fd = lookupFegyver(data.fegyverek, alap);
      // Felvételkor a gyári anyagról indulunk (bot→fa, kard→acél). A fém-rész anyag a fém-osztályú
      // fegyvereknél hangolható; a fa/kő nem-fém anyag fix.
      const defaultAnyag = fd?.alapanyag ?? (konstansok.fegyver_anyagok as string[])[0] ?? '';
      const ideaDefault = fd?.idea_default ?? 0;
      return { ...prev, fegyverek: [...prev.fegyverek, { alap, név: '', anyag: defaultAnyag, idea: ideaDefault, felszerelésben: true }] };
    });
  }

  function toggleFelszerelésben(idx: number) {
    setKarakter(prev => prev ? {
      ...prev,
      fegyverek: prev.fegyverek.map((f, i) => i === idx ? { ...f, felszerelésben: f.felszerelésben === false } : f),
    } : prev);
  }

  const felvettFegyverek = new Set(k.fegyverek.map(fp => fp.alap.toLowerCase()));
  const pickerSource: PickerSource = {
    type: 'grouped',
    label: '+ Új fegyver:',
    groups: buildFegyverGroups(data, f => f.név, felvettFegyverek),
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
          onBecenévTarget={onBecenévTarget}
          onDeleteTarget={onDeleteTarget}
          onToggleFelszerelésben={toggleFelszerelésben}
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

function FegyverCard({ index, fegyver, data, karakter, konstansok, onIdeaTarget, onMfTarget, onAnyagTarget, onBecenévTarget, onDeleteTarget, onToggleFelszerelésben }: {
  index: number;
  fegyver: FegyverPeldany;
  data: GameData;
  karakter: Karakter;
  konstansok: GameData['konstansok'];
  onIdeaTarget: (idx: number) => void;
  onMfTarget: (idx: number) => void;
  onAnyagTarget: (idx: number) => void;
  onBecenévTarget: (idx: number) => void;
  onDeleteTarget: (idx: number) => void;
  onToggleFelszerelésben: (idx: number) => void;
}) {
  const fd = lookupFegyver(data.fegyverek, fegyver.alap);
  const mfFok = getMfFok(data, karakter, fegyver.alap);
  const hasError = mfKövetelményHiba(data, karakter, fegyver.alap);
  const errorText = mfKövetelményText(data, karakter, fegyver.alap);
  // Fém-e a fegyver? A gyári alapanyag a fém-enumban (fegyver_anyagok) van-e. Nem-fém (fa/kő) anyaga
  // nem hangolható (egy fabotot nem csinálsz mithrillből) → az anyag chip tiltott, az ár a gyári anyaggal számol.
  const fém = fd ? (konstansok.fegyver_anyagok as string[]).includes(fd.alapanyag) : true;

  return (
    <div className="he-fegyver-card">
      <div className="he-fegyver-header">
        <strong>{fegyver.alap.replace(/ \(1K\)$| 1K$/, '')}</strong>
        <button className="item-delete" onClick={() => onDeleteTarget(index)}>✕</button>
      </div>
      {fd && (() => {
        // Nem-fém fegyver (fa/kő) anyaga fix (a chip tiltja) → az ár is a gyári anyaggal számol,
        // nem a példány `anyag`-jával (ami régi localStorage-ban tévesen acél lehet).
        const árAnyag = fém ? fegyver.anyag : fd.alapanyag;
        const árÉrték = fegyverÁr(fd.ár_alap, árAnyag, fegyver.idea, konstansok);
        return <FegyverChip fd={elsődlegesMód(fd)} mfFok={mfFok} ideaHatás={ideaDelta(fegyver.idea, fd.idea_default, data.fegyverIdeaTabla)} konstansok={konstansok} ár={árÉrték == null ? undefined : árFormátum(árÉrték)} />;
      })()}
      <div className="he-fegyver-fields">
        <button
          className={`he-field-btn he-field-fortely${hasError ? ' he-error' : ''}`}
          onClick={() => onMfTarget(index)}
        >
          MF fok: <strong>{mfFok}</strong>
          {hasError && <span className="he-mf-error">{errorText}</span>}
        </button>
        <button className="he-field-btn" onClick={() => onIdeaTarget(index)}>Idea: <strong>{fegyver.idea}</strong></button>
        <button
          className={`he-field-btn${fém ? '' : ' he-field-disabled'}`}
          disabled={!fém}
          onClick={() => fém && onAnyagTarget(index)}
        >
          {fém ? <>Anyag: <strong>{fegyver.anyag}</strong></> : <span className="he-strike">Anyag</span>}
        </button>
        <button className="he-field-btn" onClick={() => onBecenévTarget(index)}>Becenév: <strong>{fegyver.név || '-'}</strong></button>
        <button
          className={`he-field-btn${fegyver.felszerelésben === false ? ' he-field-off' : ''}`}
          onClick={() => onToggleFelszerelésben(index)}
        >
          Felszerelésben: <strong>{fegyver.felszerelésben === false ? 'nem' : 'igen'}</strong>
        </button>
      </div>
    </div>
  );
}
