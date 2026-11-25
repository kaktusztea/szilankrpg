import { useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Session } from '../../engine/types';
import type { StatuszEntry } from '../../engine/data-types';
import { PickerOverlay } from '../picker/PickerOverlay';
import { fmtHatás } from '../formatters';
import { eseményDef, státuszDef } from '../../engine/lookup';
import { alkategóriaCímke, státuszKulcs, választhatóAlkategóriák, státuszFelvehető } from '../../engine/statusz';

interface Props {
  data: GameData;
  session: Session;
  onPick: (fullName: string) => void;
  onClose: () => void;
  onNarratív?: () => void;
}

/** Az alkategória-lista csoportosítva: képzettségeknél a képzettség-csoport szerint, egyébként egy csoport. */
function alkategóriaCsoportok(def: StatuszEntry, opciók: string[], data: GameData): { cím: string; elemek: string[] }[] {
  if (def.alkategória_forrás !== 'képzettségek') return [{ cím: 'Alkategória kiválasztása', elemek: opciók }];
  const csoportok = new Map<string, string[]>();
  for (const k of data.kepzettsegDefs) {
    if (!opciók.includes(k.id)) continue;
    (csoportok.get(k.csoport) ?? csoportok.set(k.csoport, []).get(k.csoport)!).push(k.id);
  }
  return [...csoportok].map(([cs, elemek]) => ({ cím: cs.charAt(0).toUpperCase() + cs.slice(1), elemek }));
}

/**
 * Státusz választó (Aktív fül): státusz → (alkategória, ha van: érzék / Tulajdonság / képzettség) → fok.
 * A session-bejegyzés `"<id> (fok)"` / `"<id>: <alkategória> (fok)"` (engine/statusz.ts).
 */
export function StatuszPickerOverlay({ data, session, onPick, onClose, onNarratív }: Props) {
  const [alkVálasztó, setAlkVálasztó] = useState<string | null>(null);                       // státusz-id
  const [fokVálasztó, setFokVálasztó] = useState<{ id: string; alkategória?: string } | null>(null);

  const eseményNév = (id: string) => eseményDef(data, id)?.név ?? id;
  const fokDef = fokVálasztó ? státuszDef(data, fokVálasztó.id) : undefined;
  const cím = fokVálasztó && fokDef
    ? `${fokDef.név}${fokVálasztó.alkategória ? `: ${alkategóriaCímke(fokDef, fokVálasztó.alkategória)}` : ''} - fok választó`
    : 'Státusz választó';

  const kiválaszt = (def: StatuszEntry, alkategória?: string) => {
    if (def.fokok.length === 1) onPick(státuszKulcs({ id: def.id, alkategória, fok: def.fokok[0].fok }));
    else { setFokVálasztó({ id: def.id, ...(alkategória ? { alkategória } : {}) }); setAlkVálasztó(null); }
  };

  return (
    <PickerOverlay title={cím} onClose={onClose}>
      {!fokVálasztó && !alkVálasztó && ['fizikai', 'szellemi', 'mágikus'].map(kat => {
        const items = data.statuszok
          .filter(s => s.kategória === kat && státuszFelvehető(s, session.aktív_státuszok))
          .sort((a, b) => a.név.localeCompare(b.név, 'hu'));
        if (items.length === 0) return null;
        return (
          <div key={kat}>
            <div className="aktiv-picker-category">{kat.charAt(0).toUpperCase() + kat.slice(1)}</div>
            {items.map(s => {
              const isAuto = s.id === 'sérült';   // az ÉP-rubrikák vezérlik (useSérültStátusz)
              return (
                <button type="button" key={s.id} className={`aktiv-picker-item${isAuto ? ' aktiv-picker-disabled' : ''}`} disabled={isAuto} onClick={() => {
                  if (isAuto) return;
                  if (s.alkategóriák?.length) setAlkVálasztó(s.id);
                  else kiválaszt(s);
                }}>
                  <span className="aktiv-picker-item-name">{isAuto ? `${s.név} (auto)` : s.név}</span>
                  <span className="aktiv-picker-item-details">{s.fokok.map(f => `${f.fok}. ${f.alcím}`).join(' • ')}</span>
                </button>
              );
            })}
          </div>
        );
      })}
      {!fokVálasztó && !alkVálasztó && onNarratív && (
        <div>
          <div className="aktiv-picker-category">Narratív</div>
          <button type="button" className="aktiv-picker-item" onClick={onNarratív}>
            <span className="aktiv-picker-item-name">🔆 Narratív Előny/Hátrányok</span>
          </button>
        </div>
      )}
      {alkVálasztó && !fokVálasztó && (() => {
        const def = státuszDef(data, alkVálasztó);
        if (!def) return null;
        return alkategóriaCsoportok(def, választhatóAlkategóriák(def, session.aktív_státuszok), data).map(cs => (
          <div key={cs.cím}>
            <div className="aktiv-picker-category">{cs.cím}</div>
            {cs.elemek.map(a => (
              <button type="button" key={a} className="aktiv-picker-item" onClick={() => kiválaszt(def, a)}>
                <span className="aktiv-picker-item-name">{alkategóriaCímke(def, a)}</span>
              </button>
            ))}
          </div>
        ));
      })()}
      {fokVálasztó && fokDef && fokDef.fokok.map(f => (
        <button type="button" key={f.fok} className="aktiv-picker-item" onClick={() => onPick(státuszKulcs({ ...fokVálasztó, fok: f.fok }))}>
          <span className="aktiv-picker-item-name">{f.alcím} ({f.fok})</span>
          <span className="aktiv-picker-item-hatas">{f.hatások.slice(0, 4)
            .map(h => fmtHatás(h, eseményNév))
            .filter(Boolean).join('; ')}</span>
        </button>
      ))}
    </PickerOverlay>
  );
}
