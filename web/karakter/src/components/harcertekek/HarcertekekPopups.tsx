import { useState } from 'react';
import type { Kepzettseg } from '../../engine/types';
import { FORTÉLY_FOK_VALUES } from '../../ui-constants';
import { képzKulcs, fortélyFok } from '../../engine/azonosito';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';
import { PancelPopup } from './HarcertekekPancelPopup';
import { FokRadios, ColumnPicker, IdeaSkala, type IdeaElőnézet } from '../common/PickerComponents';
import { lookupFegyver } from '../../engine/lookup';
import { elsődlegesMód } from '../../engine/harc/fegyver-calc';
import { ideaDelta } from '../../engine/utils';
import { fegyverÁr } from './fegyver-ar-calc';
import { árFormátum } from '../formatters';
import { calcPancelValues } from './HarcertekekPancelSection';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { TextInputPopup } from '../common/TextInputPopup';
import { getMfFok, harciKepzDisplayName } from '../../engine/harc/harcertekek-helpers';
import { HarciKepzettsegSzintPopup } from '../common/HarciKepzettsegSzintPopup';

interface PopupState {
  ideaTarget: { type: 'fegyver' | 'páncél'; idx: number } | null;
  mfTarget: number | null;
  anyagTarget: number | null;
  becenévTarget: number | null;
  pancelPopup: string | null;
  pajzsPopup: string | null;
  deleteTarget: number | null;
  deleteKepzTarget: string | null;
  kepzSzintTarget: string | null;
}

interface Props {
  data: GameData;
  karakter: Karakter;
  képzettségek: Kepzettseg[];
  state: PopupState;
  /** Close after a selection. */
  onClose: (key: keyof PopupState) => void;
  /** Close without a selection (tap outside / Escape / Mégse) - may return to the card's edit menu. */
  onDismiss: (key: keyof PopupState) => void;
  updateFegyver: (idx: number, patch: { idea?: number; anyag?: string; név?: string }) => void;
  updatePancel: (patch: Record<string, unknown>) => void;
  setMfFok: (fegyverAlap: string, fok: number) => void;
  setMerevvertFok: (fok: number) => void;
  setPajzsFok: (fok: number) => void;
  updatePajzs: (patch: { méret?: string }) => void;
  removeFegyver: (idx: number) => void;
  setKépzettségek: React.Dispatch<React.SetStateAction<Kepzettseg[]>>;
}

export function Popups({
  data, karakter: k, képzettségek, state, onClose, onDismiss,
  updateFegyver, updatePancel, setMfFok, setMerevvertFok,
  setPajzsFok, updatePajzs, removeFegyver, setKépzettségek,
}: Props) {
  const { ideaTarget, mfTarget, anyagTarget, becenévTarget, pancelPopup, pajzsPopup, deleteTarget, deleteKepzTarget, kepzSzintTarget } = state;
  const { konstansok } = data;

  const pancelIdeaRange = konstansok.páncél_struktúrák
    .find(s => s.struktúra === k.páncél.alap)?.idea_plusz_minusz ?? 0;
  const fegyverIdeaRange = konstansok.fegyver_idea_plusz_minusz;

  /** Idea popup preview: the card's values with the current Idea (weapon: TÉ/VÉ/SP/Ár, armour: SFÉ/Ár). */
  function ideaElőnézet(): IdeaElőnézet[] {
    if (!ideaTarget) return [];
    if (ideaTarget.type === 'páncél') {
      if (!k.páncél.alap) return [];
      const most = calcPancelValues(k, data);
      const alap = calcPancelValues({ ...k, páncél: { ...k.páncél, idea: 0 } }, data);
      return [
        { címke: 'SFÉ F', érték: String(most.sfé_fizikai), változás: most.sfé_fizikai - alap.sfé_fizikai },
        { címke: 'SFÉ E', érték: String(most.sfé_energia), változás: most.sfé_energia - alap.sfé_energia },
        { címke: 'Ár', érték: `${árFormátum(most.ár)}x` },
      ];
    }
    const fp = k.fegyverek[ideaTarget.idx];
    const fd = fp ? lookupFegyver(data.fegyverek, fp.alap) : undefined;
    if (!fp || !fd) return [];
    const mód = elsődlegesMód(fd);
    const mf = konstansok.mesterfegyver_bónuszok?.find(b => b.fok === getMfFok(data, k, fp.alap)) ?? { TÉ: 0, VÉ: 0, SP: 0 };
    const d = ideaDelta(fp.idea, fd.idea_default, data.fegyverIdeaTabla);
    // Non-metal weapons (wood / stone): the price uses the factory material (same rule as the weapon card)
    const fém = (konstansok.fegyver_anyagok as string[]).includes(fd.alapanyag);
    const ár = fegyverÁr(fd.ár_alap, fém ? fp.anyag : fd.alapanyag, fp.idea, konstansok);
    return [
      { címke: 'TÉ', érték: String(mód.TÉ + mf.TÉ + d.TÉ), változás: d.TÉ },
      { címke: 'VÉ', érték: String(mód.VÉ + mf.VÉ + d.VÉ), változás: d.VÉ },
      { címke: 'SP', érték: String(mód.SP + mf.SP + d.SP), változás: d.SP },
      ...(ár == null ? [] : [{ címke: 'Ár', érték: `${árFormátum(ár)}x` }]),
    ];
  }

  return (
    <>
      {ideaTarget && (
        <PopupOverlay onClose={() => onDismiss('ideaTarget')}>
          <label className="kep-prompt-text-center">Idea érték</label>
          <IdeaSkala
            minIdea={ideaTarget.type === 'fegyver' ? -fegyverIdeaRange : -pancelIdeaRange}
            maxIdea={ideaTarget.type === 'fegyver' ? fegyverIdeaRange : pancelIdeaRange}
            current={ideaTarget.type === 'fegyver' ? k.fegyverek[ideaTarget.idx]?.idea ?? 0 : k.páncél.idea}
            onSelect={n => {
              // Applies immediately; the popup stays open so other values can be tried (preview updates)
              if (ideaTarget.type === 'fegyver') updateFegyver(ideaTarget.idx, { idea: n });
              else updatePancel({ idea: n });
            }}
            onKész={() => onClose('ideaTarget')}
            előnézet={ideaElőnézet()}
          />
        </PopupOverlay>
      )}

      {mfTarget !== null && (
        <PopupOverlay onClose={() => onDismiss('mfTarget')}>
          <label>Mesterfegyver fok</label>
          <FokRadios
            values={FORTÉLY_FOK_VALUES}
            current={getMfFok(data, k, k.fegyverek[mfTarget]?.alap ?? '')}
            onSelect={n => { setMfFok(k.fegyverek[mfTarget]?.alap ?? '', n); onClose('mfTarget'); }}
          />
        </PopupOverlay>
      )}

      {anyagTarget !== null && (
        <PopupOverlay onClose={() => onDismiss('anyagTarget')}>
          <ColumnPicker
            options={(konstansok.fegyver_anyagok as string[]).map(a => ({ value: a, label: a }))}
            current={k.fegyverek[anyagTarget]?.anyag ?? (konstansok.fegyver_anyagok as string[])[0] ?? ''}
            onSelect={a => { updateFegyver(anyagTarget, { anyag: a }); onClose('anyagTarget'); }}
          />
        </PopupOverlay>
      )}

      {becenévTarget !== null && (
        <BecenévPopup
          kezdő={k.fegyverek[becenévTarget]?.név ?? ''}
          onMent={név => { updateFegyver(becenévTarget, { név: név.trim() }); onClose('becenévTarget'); }}
          onMégse={() => onDismiss('becenévTarget')}
        />
      )}

      {pancelPopup && (
        <PancelPopup
          popup={pancelPopup}
          páncél={k.páncél}
          struktúrák={konstansok.páncél_struktúrák}
          fémalapanyagok={konstansok.páncél_fémalapanyagok}
          kidolgozottságOpciók={Object.keys(konstansok.páncél_csatolt_tag_mgt.hajlékonyvért_nem_fém)}
          méretOpciók={(konstansok.páncél_méret_illeszkedés as { fokozat: string; mgt: number }[]).map(m => m.fokozat)}
          merevvertFok={fortélyFok(k.fortélyok, 'merevvértviselet')}
          onUpdate={patch => { updatePancel(patch); onClose('pancelPopup'); }}
          onDismiss={() => onDismiss('pancelPopup')}
          onMerevvert={fok => { setMerevvertFok(fok); onClose('pancelPopup'); }}
        />
      )}

      {pajzsPopup && (
        <PopupOverlay onClose={() => onDismiss('pajzsPopup')}>
          {pajzsPopup === 'méret' && (
            <ColumnPicker
              wide
              options={[
                { value: '', label: '- nincs -' },
                { value: 'kis', label: 'kis' },
                { value: 'közepes', label: 'közepes' },
                { value: 'nagy', label: 'nagy' },
              ]}
              current={k.pajzs.méret}
              onSelect={v => { updatePajzs({ méret: v }); onClose('pajzsPopup'); }}
            />
          )}
          {pajzsPopup === 'pajzshasználat' && (
            <FokRadios
              values={FORTÉLY_FOK_VALUES}
              current={fortélyFok(k.fortélyok, 'pajzshasználat')}
              onSelect={n => { setPajzsFok(n); onClose('pajzsPopup'); }}
            />
          )}
        </PopupOverlay>
      )}

      {deleteTarget !== null && (
        <DeleteConfirmPopup
          label={k.fegyverek[deleteTarget]?.alap.replace(/ \(1K\)$| 1K$/, '') ?? ''}
          buttonText="Fegyver törlése"
          onConfirm={() => { removeFegyver(deleteTarget); onClose('deleteTarget'); }}
          onClose={() => onClose('deleteTarget')}
        />
      )}

      {deleteKepzTarget && (
        <DeleteConfirmPopup
          label={harciKepzDisplayName(data, deleteKepzTarget)}
          buttonText="Képzettség törlése"
          onConfirm={() => { setKépzettségek(prev => prev.filter(kp => képzKulcs(kp) !== deleteKepzTarget)); onClose('deleteKepzTarget'); }}
          onClose={() => onClose('deleteKepzTarget')}
        />
      )}

      {kepzSzintTarget && (
        <HarciKepzettsegSzintPopup data={data} kulcs={kepzSzintTarget} képzettségek={képzettségek} setKépzettségek={setKépzettségek}
          onDone={() => onClose('kepzSzintTarget')} />
      )}
    </>
  );
}

// --- Becenév popup (kontrollált szöveg-input, max 15 karakter) ---
function BecenévPopup({ kezdő, onMent, onMégse }: {
  kezdő: string;
  onMent: (név: string) => void;
  onMégse: () => void;
}) {
  const [szöveg, setSzöveg] = useState(kezdő);
  return (
    <TextInputPopup
      label="Fegyver beceneve (max 15):"
      value={szöveg}
      maxLength={15}
      onChange={setSzöveg}
      onConfirm={() => onMent(szöveg)}
      onCancel={onMégse}
    />
  );
}
