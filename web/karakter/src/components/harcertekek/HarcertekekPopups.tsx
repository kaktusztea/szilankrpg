import { useState } from 'react';
import type { Kepzettseg } from '../../engine/types';
import { FORTÉLY_FOK_VALUES } from '../../ui-constants';
import { képzKulcs, fortélyFok } from '../../engine/azonosito';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PopupOverlay } from './PopupOverlay';
import { PancelPopup } from './HarcertekekPancelPopup';
import { FokRadios, ColumnPicker, IdeaGrid, SzintGrid } from './PickerComponents';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { TextInputPopup } from '../tulajdonsagok/popups/TextInputPopup';
import { getMfFok, harciKepzDisplayName } from './helpers';

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
  onClose: (key: keyof PopupState) => void;
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
  data, karakter: k, képzettségek, state, onClose,
  updateFegyver, updatePancel, setMfFok, setMerevvertFok,
  setPajzsFok, updatePajzs, removeFegyver, setKépzettségek,
}: Props) {
  const { ideaTarget, mfTarget, anyagTarget, becenévTarget, pancelPopup, pajzsPopup, deleteTarget, deleteKepzTarget, kepzSzintTarget } = state;
  const { konstansok } = data;

  const pancelIdeaRange = konstansok.páncél_struktúrák
    .find(s => s.struktúra === k.páncél.alap)?.idea_plusz_minusz ?? 0;
  const fegyverIdeaRange = konstansok.fegyver_idea_plusz_minusz;

  return (
    <>
      {ideaTarget && (
        <PopupOverlay onClose={() => onClose('ideaTarget')}>
          <label>Idea érték</label>
          <IdeaGrid
            minIdea={ideaTarget.type === 'fegyver' ? -fegyverIdeaRange : -pancelIdeaRange}
            maxIdea={ideaTarget.type === 'fegyver' ? fegyverIdeaRange : pancelIdeaRange}
            current={ideaTarget.type === 'fegyver' ? k.fegyverek[ideaTarget.idx]?.idea ?? 0 : k.páncél.idea}
            onSelect={n => {
              if (ideaTarget.type === 'fegyver') updateFegyver(ideaTarget.idx, { idea: n });
              else updatePancel({ idea: n });
              onClose('ideaTarget');
            }}
          />
        </PopupOverlay>
      )}

      {mfTarget !== null && (
        <PopupOverlay onClose={() => onClose('mfTarget')}>
          <label>Mesterfegyver fok</label>
          <FokRadios
            values={FORTÉLY_FOK_VALUES}
            current={getMfFok(data, k, k.fegyverek[mfTarget]?.alap ?? '')}
            onSelect={n => { setMfFok(k.fegyverek[mfTarget]?.alap ?? '', n); onClose('mfTarget'); }}
          />
        </PopupOverlay>
      )}

      {anyagTarget !== null && (
        <PopupOverlay onClose={() => onClose('anyagTarget')}>
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
          onMégse={() => onClose('becenévTarget')}
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
          onMerevvert={fok => { setMerevvertFok(fok); onClose('pancelPopup'); }}
        />
      )}

      {pajzsPopup && (
        <PopupOverlay onClose={() => onClose('pajzsPopup')}>
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
        <PopupOverlay onClose={() => {
          const kp = képzettségek.find(k => képzKulcs(k) === kepzSzintTarget);
          if (kp && kp.szint === 0) setKépzettségek(prev => prev.filter(k => képzKulcs(k) !== kepzSzintTarget));
          onClose('kepzSzintTarget');
        }}>
          <SzintGrid
            label={`${harciKepzDisplayName(data, kepzSzintTarget)} - szint:`}
            maxSzint={data.konstansok.arányok.képzettség_max_szint}
            current={képzettségek.find(kp => képzKulcs(kp) === kepzSzintTarget)?.szint ?? 0}
            onSelect={n => {
              setKépzettségek(prev => prev.map(kp => képzKulcs(kp) === kepzSzintTarget ? { ...kp, szint: n } : kp));
              onClose('kepzSzintTarget');
            }}
          />
        </PopupOverlay>
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
