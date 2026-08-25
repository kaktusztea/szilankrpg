import { useState } from 'react';
import type { KepzettsegRowProps } from './types';
import { KepzettsegDetails } from '../KepzettsegDetails';
import { GridPickerPopup } from './popups';
import { MdLink } from '../MdLink';
import { KepzettsegProbaPopup } from './KepzettsegProbaPopup';
import { DELETE_BTN_TAP_ZONE_PX, SZINT_VALUES } from '../../ui-constants';

export function KepzettsegRow({
  slot, gameMode, onSzintChange, onRemove,
  kiterjesztesek, infoOpen, onInfoToggle,
  displayName, findDef, overLimit, warning, fortélyFokok, tulajdonságok, képzettségek, aktívStátuszok, statuszDefs, próbaEnyhítések
}: KepzettsegRowProps) {
  const [szintEditing, setSzintEditing] = useState(false);
  const [showProba, setShowProba] = useState(false);

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (gameMode) { onInfoToggle(); return; }
    const delBtn = e.currentTarget.querySelector('.item-delete') as HTMLElement | null;
    if (delBtn) {
      const btnRect = delBtn.getBoundingClientRect();
      if (e.clientX >= btnRect.left - DELETE_BTN_TAP_ZONE_PX) return;
    }
    setSzintEditing(true);
  }

  const def = findDef(slot.név);
  const kit = kiterjesztesek[slot.név] || [];

  return (
    <div className="kep-row-wrapper">
      <div className="item-row" data-kep={slot.név} onClick={handleTap}>
        <span className={`kep-név${overLimit || warning ? ' kep-over' : ''}`}>{displayName}</span>
        {gameMode && infoOpen && (
          <span className="kep-header-actions" onClick={e => e.stopPropagation()}>
            <button className="kep-proba-dice-btn" title="Képzettségpróba dobás" onClick={() => setShowProba(true)}>🎲</button>
          </span>
        )}
        <span className="kep-right">
          {def?.md_fájl && <span className="md-link-wrap" onClick={e => e.stopPropagation()}><MdLink mdFájl={def.md_fájl} /></span>}
          {!gameMode && (
            <button className="item-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`kep-szint${slot.szint === 0 ? ' kep-szint-zero' : slot.szint >= 9 ? ' kep-szint-high' : ''}${overLimit ? ' kep-over' : ''}`}>
            {slot.szint}
          </span>
        </span>
      </div>

      {gameMode && infoOpen && def && (
        <KepzettsegDetails def={def} kit={kit} fortélyFokok={fortélyFokok} />
      )}

      {showProba && def && (
        <KepzettsegProbaPopup
          képzettségNév={def.név}
          képzettségCsoport={def.csoport}
          szint={slot.szint}
          tulajdonságok={tulajdonságok}
          kiterjesztesek={kit}
          fortélyFokok={fortélyFokok}
          képzettségek={képzettségek}
          aktívStátuszok={aktívStátuszok}
          statuszDefs={statuszDefs}
          módosítóTáblák={def.helyzetfüggő_módosítók || []}
          próbaEnyhítések={próbaEnyhítések}
          szerepjátékosMódosító={def.szerepjátékos_módosító || false}
          onClose={() => setShowProba(false)}
        />
      )}

      {szintEditing && (
        <GridPickerPopup
          label={`${displayName} — szint:`}
          values={SZINT_VALUES}
          current={slot.szint}
          onSelect={n => { onSzintChange(n); setSzintEditing(false); }}
          onCancel={() => setSzintEditing(false)}
        />
      )}
    </div>
  );
}
