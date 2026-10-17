import { useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, AktívTaktika } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';
import { PickerOverlay } from './PickerOverlay';
import { TaktikaPickerList } from './TaktikaPickerList';
import { TaktikaFokPicker } from './TaktikaFokPicker';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  onClose: () => void;
}

/**
 * Taktika választó/kapcsoló ablak (toggle): aktív taktikák ✔-pal, kikapcsolhatóan; a felvehetők
 * engedélyezve, a kizártak (kombó/megkötés/helyzet-tiltás) halványan letiltva. A session.aktív_taktikák
 * az EGYETLEN állapot - így az Aktív fül és a Támadó dobás popup ugyanazt kapcsolja, ugyanazzal a kizáró
 * logikával (isTaktikaAllowed a TaktikaPickerList-ben). ponytail: egy ablak, két belépési pont.
 */
export function TaktikaPickerPopup({ data, karakter, session, setSession, pushUndo, onClose }: Props) {
  const [fokválasztó, setFokválasztó] = useState<string | null>(null);

  function addTaktika(név: string) {
    const def = data.taktikak.find(t => t.név === név);
    if (!def) return;
    pushUndo(`Taktika: ${név}`, [{ field: 'session', prev: session }]);
    const entry: AktívTaktika = { név, fok: def.fokozatos ? 1 : undefined };
    setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, entry] }));
  }

  function removeTaktika(név: string) {
    pushUndo(`Taktika−: ${név}`, [{ field: 'session', prev: session }]);
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.filter(t => t.név !== név) }));
  }

  function handleFokSelect(fok: number, isNew: boolean) {
    if (!fokválasztó) return;
    if (!isNew) {
      pushUndo(`Taktika: ${fokválasztó} fok→${fok}`, [{ field: 'session', prev: session }]);
      setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.map(t => t.név === fokválasztó ? { ...t, fok } : t) }));
    } else {
      pushUndo(`Taktika: ${fokválasztó}`, [{ field: 'session', prev: session }]);
      setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, { név: fokválasztó!, fok }] }));
    }
    setFokválasztó(null);
  }

  return (
    <PickerOverlay title={fokválasztó ? `${fokválasztó} - fok választó` : 'Taktika választó'} onClose={onClose}>
      {fokválasztó
        ? <TaktikaFokPicker fokválasztó={fokválasztó} data={data} karakter={karakter} session={session} onSelect={handleFokSelect} />
        : <TaktikaPickerList data={data} karakter={karakter} session={session}
            onAddSimple={addTaktika}
            onFokválasztó={setFokválasztó}
            onRemove={removeTaktika} />
      }
    </PickerOverlay>
  );
}
