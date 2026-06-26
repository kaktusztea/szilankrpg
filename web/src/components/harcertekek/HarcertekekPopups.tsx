import { createPortal } from 'react-dom';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PancelPopup } from './HarcertekekPancelPopup';
import { getMfFok, harciKepzDisplayName } from './helpers';

interface PopupState {
  ideaTarget: { type: 'fegyver' | 'páncél'; idx: number } | null;
  mfTarget: number | null;
  anyagTarget: number | null;
  pancelPopup: string | null;
  pajzsPopup: string | null;
  deleteTarget: number | null;
  deleteKepzTarget: string | null;
  kepzSzintTarget: string | null;
}

interface Props {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
  state: PopupState;
  onClose: (key: keyof PopupState) => void;
  updateFegyver: (idx: number, patch: { idea?: number; anyag?: string }) => void;
  updatePancel: (patch: Record<string, unknown>) => void;
  setMfFok: (fegyverAlap: string, fok: number) => void;
  setMerevvertFok: (fok: number) => void;
  setPajzsFok: (fok: number) => void;
  updatePajzs: (patch: { méret?: string }) => void;
  removeFegyver: (idx: number) => void;
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
}

export function Popups({
  data, karakter: k, képzettségek, state, onClose,
  updateFegyver, updatePancel, setMfFok, setMerevvertFok,
  setPajzsFok, updatePajzs, removeFegyver, setKépzettségek,
}: Props) {
  const { ideaTarget, mfTarget, anyagTarget, pancelPopup, pajzsPopup, deleteTarget, deleteKepzTarget, kepzSzintTarget } = state;
  const { konstansok } = data;

  const ideaMin = ideaTarget?.type === 'fegyver' ? -5 : -4;
  const ideaMax = ideaTarget?.type === 'fegyver' ? 5 : 4;

  return (
    <>
      {/* Idea popup */}
      {ideaTarget && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Idea érték</label>
            {(() => {
              const current = ideaTarget.type === 'fegyver' ? k.fegyverek[ideaTarget.idx]?.idea : k.páncél.idea;
              const selectIdea = (n: number) => {
                if (ideaTarget.type === 'fegyver') updateFegyver(ideaTarget.idx, { idea: n });
                else updatePancel({ idea: n });
                onClose('ideaTarget');
              };
              const btn = (n: number) => (
                <button key={n} className={`fort-fok-btn he-idea-cell ${current === n ? 'active' : ''}`} onClick={() => selectIdea(n)}>
                  {n > 0 ? `+${n}` : n}
                </button>
              );
              return (
                <div className="he-idea-grid">
                  <div className="he-idea-row">{Array.from({ length: -ideaMin }, (_, i) => ideaMin + i).map(btn)}</div>
                  <div className="he-idea-row">{btn(0)}</div>
                  <div className="he-idea-row">{Array.from({ length: ideaMax }, (_, i) => i + 1).map(btn)}</div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* MF fok popup */}
      {mfTarget !== null && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Mesterfegyver fok</label>
            <div className="fort-fok-radios">
              {[0, 1, 2, 3].map(n => (
                <button key={n} className={`fort-fok-btn ${getMfFok(data, k, k.fegyverek[mfTarget]?.alap ?? '') === n ? 'active' : ''}`} onClick={() => { setMfFok(k.fegyverek[mfTarget]?.alap ?? '', n); onClose('mfTarget'); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Anyag popup */}
      {anyagTarget !== null && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <div className="he-column-layout">
              {(konstansok.fegyver_anyagok as string[]).map((a: string) => (
                <button key={a} className={`fort-fok-btn he-picker-btn ${k.fegyverek[anyagTarget]?.anyag === a ? 'active' : ''}`} onClick={() => { updateFegyver(anyagTarget, { anyag: a }); onClose('anyagTarget'); }}>{a}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Páncél popup */}
      {pancelPopup && createPortal(
        <PancelPopup
          popup={pancelPopup}
          páncél={k.páncél}
          struktúrák={konstansok.páncél_struktúrák}
          fémalapanyagok={konstansok.páncél_fémalapanyagok}
          merevvertFok={k.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0}
          onUpdate={(patch) => { updatePancel(patch); onClose('pancelPopup'); }}
          onMerevvert={(fok) => { setMerevvertFok(fok); onClose('pancelPopup'); }}
        />,
        document.body
      )}

      {/* Pajzs popup */}
      {pajzsPopup && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <div className="he-column-layout">
              {pajzsPopup === 'méret' && <>
                <button className={`fort-fok-btn he-picker-btn-wide ${!k.pajzs.méret ? 'active' : ''}`} onClick={() => { updatePajzs({ méret: '' }); onClose('pajzsPopup'); }}>— nincs —</button>
                {['kis', 'közepes', 'nagy'].map(v => (
                  <button key={v} className={`fort-fok-btn he-picker-btn-wide ${k.pajzs.méret === v ? 'active' : ''}`} onClick={() => { updatePajzs({ méret: v }); onClose('pajzsPopup'); }}>{v}</button>
                ))}
              </>}
              {pajzsPopup === 'pajzshasználat' && (
                <div className="fort-fok-radios">
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} className={`fort-fok-btn ${(k.fortélyok.find(f => f.név === 'Pajzshasználat')?.fok ?? 0) === n ? 'active' : ''}`} onClick={() => { setPajzsFok(n); onClose('pajzsPopup'); }}>{n}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete fegyver */}
      {deleteTarget !== null && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt kep-prompt-align-center kep-prompt-gap-12">
            <label className="kep-prompt-label-bold">{k.fegyverek[deleteTarget]?.alap.replace(/ \(1K\)$| 1K$/, '')}</label>
            <button className="btn-del-confirm he-del-confirm" onClick={() => { removeFegyver(deleteTarget); onClose('deleteTarget'); }}>Fegyver törlése</button>
          </div>
        </div>,
        document.body
      )}

      {/* Delete képzettség */}
      {deleteKepzTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onClose('deleteKepzTarget'); }}>
          <div className="kep-prompt kep-prompt-align-center kep-prompt-gap-12">
            <label className="kep-prompt-label-bold">{harciKepzDisplayName(data, deleteKepzTarget)}</label>
            <button className="btn-del-confirm he-del-confirm" onClick={() => { setKépzettségek(prev => prev.filter(kp => kp.név !== deleteKepzTarget)); onClose('deleteKepzTarget'); }}>Képzettség törlése</button>
          </div>
        </div>,
        document.body
      )}

      {/* Képzettség szint választó */}
      {kepzSzintTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => {
          if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) {
            const kp = képzettségek.find(k => k.név === kepzSzintTarget);
            if (kp && kp.szint === 0) setKépzettségek(prev => prev.filter(k => k.név !== kepzSzintTarget));
            onClose('kepzSzintTarget');
          }
        }}>
          <div className="kep-prompt">
            <label>{harciKepzDisplayName(data, kepzSzintTarget)} — szint:</label>
            <div className="kep-szint-grid">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                <button key={n} className={`fort-fok-btn ${(képzettségek.find(kp => kp.név === kepzSzintTarget)?.szint ?? 0) === n ? 'active' : ''}`} onClick={() => {
                  setKépzettségek(prev => prev.map(kp => kp.név === kepzSzintTarget ? { ...kp, szint: n } : kp));
                  onClose('kepzSzintTarget');
                }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
