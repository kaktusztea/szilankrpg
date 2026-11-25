import { Ikon } from '../common/Ikon';
import { fmtCode } from '../formatters';
import { PickerOverlay } from './PickerOverlay';
import { területIllik, type HarcTerület } from '../../engine/taktika/taktika-helpers';
import { helyzetFelvéve, isHelyzetAvailable } from '../../engine/taktika/helyzet-helpers';
import './picker.css';
import type { SessionProps } from '../session-props';

interface Props extends SessionProps {
  onClose: () => void;
  /** Csak az adott terület helyzetei (Támadó: közelharc, Célzó: távharc); nincs = mind (Aktív fül). */
  terület?: HarcTerület;
}

/**
 * Harci helyzet választó/kapcsoló ablak (toggle): aktív helyzetek ✔-pal (kikapcsolhatóan), a felvehetők
 * engedélyezve, a kizártak (másik aktív helyzet kizár_helyzetek-je / rejtett) halványan letiltva. A
 * session.aktív_helyzetek az EGYETLEN állapot - az Aktív fül és a Támadó dobás popup ugyanazt kapcsolja.
 * ponytail: egy ablak, két belépési pont. A felvétel session-logikája: engine `helyzetFelvéve`.
 */
export function HelyzetPickerPopup({ data, session, setSession, pushUndo, onClose, terület }: Props) {
  function addHelyzet(név: string) {
    pushUndo(`Helyzet: ${név}`, [{ field: 'session', prev: session }]);
    setSession(s => helyzetFelvéve(s, név, data));
  }

  function removeHelyzet(név: string) {
    pushUndo(`Helyzet−: ${név}`, [{ field: 'session', prev: session }]);
    setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter(h => h !== név) }));
  }

  const groups = [
    { label: 'Pozitív helyzet', cls: 'aktiv-picker-group-pozitív', csoport: 'pozitív' },
    { label: 'Semleges helyzet', cls: 'aktiv-picker-group-semleges', csoport: 'semleges' },
    { label: 'Negatív helyzet', cls: 'aktiv-picker-group-negatív', csoport: 'negatív' },
    { label: 'Távharci helyzet', cls: 'aktiv-picker-group-távharc', csoport: 'távharc' },
  ].filter(g => területIllik(g.csoport, terület))
    .map(g => ({ ...g, items: data.harciHelyzetek.filter(h => h.csoport === g.csoport && !h.rejtett) }));

  return (
    <PickerOverlay title={terület === 'távharc' ? 'Távharci helyzet választó' : 'Harci helyzet választó'} onClose={onClose}>
      {groups.flatMap(g => g.items.length > 0 ? [
        <div key={g.label} className={`aktiv-picker-group-label ${g.cls}`}>{g.label}</div>,
        ...g.items.sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(h => {
          const aktív = session.aktív_helyzetek.includes(h.név);
          const tiltott = !aktív && !isHelyzetAvailable(h, session, data);
          return (
            <button type="button" key={h.név}
              className={`aktiv-picker-item ${g.cls}${aktív ? ' aktiv-picker-item-active-accent' : ''}${tiltott ? ' aktiv-picker-item-disabled-inline' : ''}`}
              onClick={() => aktív ? removeHelyzet(h.név) : addHelyzet(h.név)}>
              <span className="aktiv-picker-item-name">{aktív ? <><Ikon név="pipa" /> </> : null}{h.név}</span>
              <span className="aktiv-picker-item-hatas">{fmtCode(h.infó)}</span>
            </button>
          );
        }),
      ] : [])}
    </PickerOverlay>
  );
}
