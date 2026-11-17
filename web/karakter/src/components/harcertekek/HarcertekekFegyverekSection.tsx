import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import type { Karakter, FegyverPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { ideaDelta } from '../../engine/utils';
import { elsődlegesMód } from '../../engine/harc/fegyver-calc';
import { FegyverChip } from './HarcertekekFegyverChip';
import { fegyverÁr } from './fegyver-ar-calc';
import { árFormátum } from '../formatters';
import { getMfFok, mfKövetelményHiba, mfKövetelményText } from '../../engine/harc/harcertekek-helpers';
import { SpecPicker, type PickerSource } from '../SpecPicker';
import { buildFegyverGroups } from '../fegyver-groups';
import { MAX_FEGYVER_DARAB } from '../../ui-constants';
import { lookupFegyver } from '../../engine/lookup';
import { ListaPicker } from '../picker/ListaPicker';
import { FokPottyok } from '../common/FokPottyok';
import { SP_NINCS } from '../../engine/data-types';

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
  /** Register a "back to the edit menu" callback before opening a field popup from the menu. */
  onMenüből: (vissza: () => void) => void;
}

export function FegyverekSection({ data, karakter: k, setKarakter, gameMode, onIdeaTarget, onMfTarget, onAnyagTarget, onBecenévTarget, onDeleteTarget, onMenüből }: Props) {
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
    // Base stats of the primary mode next to each name (table values, not character-calculated)
    groups: buildFegyverGroups(data, f => f.név, felvettFegyverek).map(g => ({
      ...g,
      items: g.items.map(it => {
        const fd = lookupFegyver(data.fegyverek, it.value);
        if (!fd) return it;
        const m = elsődlegesMód(fd);
        return { ...it, info: `TÉ: ${m.TÉ}, VÉ: ${m.VÉ}, SP: ${m.SP === SP_NINCS ? '-' : m.SP}, Sebesség: ${m.Sebesség ?? '-'}` };
      }),
    })),
  };

  return (
    <section className="he-section">
      <h3 className="he-section-cim">
        Fegyverek
        {!gameMode && k.fegyverek.length < MAX_FEGYVER_DARAB && (
          <span className="csoport-uj">
            <button type="button" className="csoport-uj-btn" title="Új fegyver" aria-label="Új fegyver" onClick={() => setPickerOpen(true)}><Ikon név="új" /></button>
          </span>
        )}
      </h3>
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
          onMenüből={onMenüből}
        />
      ))}
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

function FegyverCard({ index, fegyver, data, karakter, konstansok, onIdeaTarget, onMfTarget, onAnyagTarget, onBecenévTarget, onDeleteTarget, onToggleFelszerelésben, onMenüből }: {
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
  onMenüből: (vissza: () => void) => void;
}) {
  const fd = lookupFegyver(data.fegyverek, fegyver.alap);
  const mfFok = getMfFok(data, karakter, fegyver.alap);
  const hasError = mfKövetelményHiba(data, karakter, fegyver.alap);
  const errorText = mfKövetelményText(data, karakter, fegyver.alap);
  // Fém-e a fegyver? A gyári alapanyag a fém-enumban (fegyver_anyagok) van-e. Nem-fém (fa/kő) anyaga
  // nem hangolható (egy fabotot nem csinálsz mithrillből) → az anyag chip tiltott, az ár a gyári anyaggal számol.
  const fém = fd ? (konstansok.fegyver_anyagok as string[]).includes(fd.alapanyag) : true;

  const [szerkNyitva, setSzerkNyitva] = useState(false);
  const mfMax = Math.max(0, ...(konstansok.mesterfegyver_bónuszok ?? []).map(b => b.fok));
  const típusNév = fegyver.alap.replace(/ \(1K\)$| 1K$/, '');
  const felszerelésben = fegyver.felszerelésben !== false;
  // Subtitle: weapon type (only if a nickname is the title) · material · Idea
  const alcím = [fegyver.név ? típusNév : null, fém ? fegyver.anyag : null, `Idea ${fegyver.idea}`].filter(Boolean).join(' · ');

  return (
    <div className={`he-fegyver-card${felszerelésben ? '' : ' he-fegyver-card-ki'}`}>
      {/* Compact card: title (nickname or type) + MF badge, subtitle, icon actions; all edits in one menu (pencil) */}
      <div className="he-fegyver-header">
        <div className="he-fegyver-cim">
          <div className="he-fegyver-nev">
            {fegyver.név || típusNév}
            {/* MF fok as purple dots (filled / empty), like the fortély fok dots; red when the MF requirement fails */}
            <FokPottyok név="MF fok" fok={mfFok} max={mfMax} hiba={hasError} onClick={() => onMfTarget(index)} />
          </div>
          <div className="he-fegyver-alcim">{alcím}</div>
          {hasError && <span className="he-mf-error">{errorText}</span>}
        </div>
        <div className="he-fegyver-ikonok">
          <button type="button" className={`he-ikon-btn he-felsz-btn${felszerelésben ? ' on' : ''}`} aria-pressed={felszerelésben}
            title={felszerelésben ? 'Felszerelésben: igen' : 'Felszerelésben: nem'} aria-label="Felszerelésben"
            onClick={() => onToggleFelszerelésben(index)}><Ikon név="csomag" /></button>
          <button type="button" className="he-ikon-btn" title="Szerkesztés" aria-label="Szerkesztés" onClick={() => setSzerkNyitva(true)}><Ikon név="szerkeszt" /></button>
          <button type="button" className="he-ikon-btn" title="Törlés" aria-label="Törlés" onClick={() => onDeleteTarget(index)}><Ikon név="bezár" /></button>
        </div>
      </div>
      {fd && (() => {
        // Nem-fém fegyver (fa/kő) anyaga fix → az ár is a gyári anyaggal számol,
        // nem a példány `anyag`-jával (ami régi localStorage-ban tévesen acél lehet).
        const árAnyag = fém ? fegyver.anyag : fd.alapanyag;
        const árÉrték = fegyverÁr(fd.ár_alap, árAnyag, fegyver.idea, konstansok);
        return <FegyverChip fd={elsődlegesMód(fd)} mfFok={mfFok} ideaHatás={ideaDelta(fegyver.idea, fd.idea_default, data.fegyverIdeaTabla)} konstansok={konstansok} ár={árÉrték == null ? undefined : árFormátum(árÉrték)} />;
      })()}
      {szerkNyitva && (
        <ListaPicker title={fegyver.név || típusNév} onClose={() => setSzerkNyitva(false)}
          opciók={[
            { érték: 'mf', név: 'MF fok', infó: String(mfFok) },
            { érték: 'idea', név: 'Idea', infó: String(fegyver.idea) },
            { érték: 'anyag', név: 'Anyag', infó: fém ? fegyver.anyag : fd?.alapanyag, disabled: !fém, megjegyzés: fém ? undefined : 'nem fém fegyver: nem hangolható' },
            { érték: 'becenév', név: 'Becenév', infó: fegyver.név || '-' },
          ]}
          onVálaszt={mező => {
            onMenüből(() => setSzerkNyitva(true));
            if (mező === 'mf') onMfTarget(index);
            else if (mező === 'idea') onIdeaTarget(index);
            else if (mező === 'anyag') onAnyagTarget(index);
            else onBecenévTarget(index);
          }} />
      )}
    </div>
  );
}
