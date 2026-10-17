import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';
import { fmtCode } from '../formatters';
import { PickerOverlay } from './PickerOverlay';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  onClose: () => void;
}

type HelyzetDef = GameData['harciHelyzetek'][number];

/**
 * Harci helyzet választó/kapcsoló ablak (toggle): aktív helyzetek ✔-pal (kikapcsolhatóan), a felvehetők
 * engedélyezve, a kizártak (másik aktív helyzet kizár_helyzetek-je / rejtett) halványan letiltva. A
 * session.aktív_helyzetek az EGYETLEN állapot - az Aktív fül és a Támadó dobás popup ugyanazt kapcsolja.
 * ponytail: egy ablak, két belépési pont. A felvétel a kizárás/tiltja_taktikákat/fegyverfogás patch-et
 * is elvégzi (azonos az Aktív fül eredeti addHelyzet logikájával).
 */
export function HelyzetPickerPopup({ data, session, setSession, pushUndo, onClose }: Props) {
  function addHelyzet(h: HelyzetDef) {
    pushUndo(`Helyzet: ${h.név}`, [{ field: 'session', prev: session }]);
    const hDef = data.harciHelyzetek.find(d => d.név === h.név);
    setSession(s => {
      let helyzetek = [...s.aktív_helyzetek, h.név];
      let taktikák = s.aktív_taktikák;
      const kizár = hDef?.kizár_helyzetek ?? [];
      if (kizár.length) {
        const kizártNevek = kizár.map((kid: string) => data.harciHelyzetek.find(d => d.id === kid)?.név).filter(Boolean);
        helyzetek = helyzetek.filter(hh => !kizártNevek.includes(hh));
      }
      if (hDef?.tiltja_taktikákat) taktikák = [];
      const patch: Partial<typeof s> = {};
      if (hDef?.tiltott_fegyverfogások?.includes(s.fegyverfogás)) {
        patch.fegyverfogás = 'egyfegyveres'; patch.kétkezes_harc = false;
        patch.aktív_pajzs = false; patch.aktív_fegyver_bal_index = -1;
      }
      return { ...s, ...patch, aktív_helyzetek: helyzetek, aktív_taktikák: taktikák };
    });
  }

  function removeHelyzet(név: string) {
    pushUndo(`Helyzet−: ${név}`, [{ field: 'session', prev: session }]);
    setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter(h => h !== név) }));
  }

  /** Egy helyzet kizárt-e: valamelyik AKTÍV helyzet kizár_helyzetek-je tiltja (az aktívat magát nem). */
  function kizárt(h: HelyzetDef): boolean {
    if (h.rejtett) return true;
    return session.aktív_helyzetek.some(ah => {
      const ahDef = data.harciHelyzetek.find(d => d.név === ah);
      return ahDef?.kizár_helyzetek?.includes(h.id);
    });
  }

  const groups = [
    { label: 'Pozitív helyzet', cls: 'aktiv-picker-group-pozitív', csoport: 'pozitív' },
    { label: 'Semleges helyzet', cls: 'aktiv-picker-group-semleges', csoport: 'semleges' },
    { label: 'Negatív helyzet', cls: 'aktiv-picker-group-negatív', csoport: 'negatív' },
    { label: 'Távharci helyzet', cls: 'aktiv-picker-group-távharc', csoport: 'távharc' },
  ].map(g => ({ ...g, items: data.harciHelyzetek.filter(h => h.csoport === g.csoport && !h.rejtett) }));

  return (
    <PickerOverlay title="Harci helyzet választó" onClose={onClose}>
      {groups.flatMap(g => g.items.length > 0 ? [
        <div key={g.label} className={`aktiv-picker-group-label ${g.cls}`}>{g.label}</div>,
        ...g.items.sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(h => {
          const aktív = session.aktív_helyzetek.includes(h.név);
          const tiltott = !aktív && kizárt(h);
          return (
            <button type="button" key={h.név}
              className={`aktiv-picker-item ${g.cls}${aktív ? ' aktiv-picker-item-active-accent' : ''}${tiltott ? ' aktiv-picker-item-disabled-inline' : ''}`}
              onClick={() => aktív ? removeHelyzet(h.név) : addHelyzet(h)}>
              <span className="aktiv-picker-item-name">{aktív ? '✔ ' : ''}{h.név}</span>
              <span className="aktiv-picker-item-hatas">{fmtCode(h.infó)}</span>
            </button>
          );
        }),
      ] : [])}
    </PickerOverlay>
  );
}
