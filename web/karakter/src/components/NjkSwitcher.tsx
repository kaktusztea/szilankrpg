import { useState } from 'react';
import type { Karakter } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import type { SlotEntry } from '../hooks/slot-utils';
import { readSlots, loadSlotKarakter } from '../hooks/slot-utils';
import { njkSlots, életerőStat, type ÉleterőStat } from '../hooks/njk-slots';
import { useLongPress } from '../hooks/useLongPress';
import { getKmJelölés, writeKmJelölés, readKmJelölések, választSzínt } from '../hooks/km-jelolesek';
import { KM_JEL_SZÍNEK } from '../ui-constants';
import { KmJelolesPicker } from './KmJelolesPicker';
import { KmJegyzetPopup } from './KmJegyzetPopup';

interface Props {
  /** Az aktív karakter — a persistált slot-metaadat frissítése (autosave) előtt is
   *  ez az autoritatív állapota (jk, becenév, név, sebzések), hogy a sáv azonnal helyes legyen. */
  aktív: Karakter;
  data: GameData;
  onLoad: (karakter: Karakter, undo: any[]) => void;
}

/**
 * KM eszköz: fix sáv a Header alatt NJK karakter aktív állapotában.
 * Boxok (becenév vagy név) — katt = váltás arra az NJK-ra.
 * Minden box háttere egy fakó Életerő csík (arány + szín), a név után stat:
 * "maradék/max (Skat)". Ha nem férnek egy sorba, új sáv nyílik.
 */
export function NjkSwitcher({ aktív, data, onLoad }: Props) {
  // Az aktív karakter friss állapotát ráolvassuk a persistált slotokra: a JK/NJK váltás
  // React-state-ben azonnal megvan, a slot-metaadatot viszont az autosave csak később írja.
  const slots = mergeAktív(readSlots(), aktív);
  const njkok = njkSlots(slots);

  // KM jelölés popupok: melyik NJK-hoz nyílt betű-picker ill. jegyzet.
  const [pickerUid, setPickerUid] = useState<string | null>(null);
  const [jegyzetUid, setJegyzetUid] = useState<string | null>(null);
  // A jelölés-írások után re-render, hogy a chipek frissüljenek (localStorage nem reaktív).
  const [, rerender] = useState(0);

  const váltás = (uid: string) => {
    if (uid === aktív.uid) return;
    const loaded = loadSlotKarakter(uid);
    if (loaded) onLoad(loaded.karakter, loaded.undo);
  };
  const { pressProps } = useLongPress<string>(setPickerUid, váltás);

  if (njkok.length === 0) return null;

  const pickerNjk = njkok.find(s => s.uid === pickerUid);
  const jegyzetNjk = njkok.find(s => s.uid === jegyzetUid);
  const jegyzetJel = jegyzetUid ? getKmJelölés(jegyzetUid) : null;

  return (
    <div className="njk-bar">
      {njkok.map(s => {
        // Az aktív NJK-nál a LIVE karaktert használjuk (friss ÉP/sebzések), a többinél a tárolt.
        const kar = s.uid === aktív.uid ? aktív : loadSlotKarakter(s.uid)?.karakter ?? null;
        const stat = kar ? életerőStat(kar, data) : null;
        const jel = getKmJelölés(s.uid);
        return (
          <button
            key={s.uid}
            className={`njk-box${s.uid === aktív.uid ? ' njk-box-active' : ''}`}
            style={stat ? { '--ep-arány': stat.arány, '--ep-szín': epSzín(stat.arány) } as React.CSSProperties : undefined}
            {...pressProps(s.uid)}
          >
            {jel?.betű && (
              <span
                className="njk-jel"
                style={{ '--jel-szín': jel.szín } as React.CSSProperties}
                title={jel.jegyzet || 'Jegyzet írása'}
                // Betű-karika tap: jegyzet popup. A pointer eseményeket elnyeljük, hogy a chip
                // long-press/váltás logikája (pressProps) ne induljon el a betűn.
                onPointerDown={e => e.stopPropagation()}
                onPointerUp={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setJegyzetUid(s.uid); }}
              >
                {jel.betű}
              </span>
            )}
            <span className="njk-box-név">{s.név}</span>
            {stat && <span className="njk-box-stat">{statLabel(stat)}</span>}
          </button>
        );
      })}

      {pickerNjk && (
        <KmJelolesPicker
          aktuális={getKmJelölés(pickerNjk.uid)?.betű ?? ''}
          név={pickerNjk.név}
          színÉrte={betű => {
            const tár = readKmJelölések();
            delete tár[pickerNjk.uid];
            return választSzínt(betű, tár, KM_JEL_SZÍNEK);
          }}
          onClose={() => setPickerUid(null)}
          onPick={betű => {
            const jel = getKmJelölés(pickerNjk.uid);
            if (!betű) {
              // „Nincs jelölés" → betű törlése (jegyzet is elvész, a szín értelmét veszti).
              writeKmJelölés(pickerNjk.uid, { betű: '', szín: '', jegyzet: '' });
            } else {
              // A szín FELVÉTELKOR dől el a már használt színek alapján. A szerkesztett NJK
              // saját bejegyzését kizárjuk, hogy betűváltáskor újra szabadon választhasson.
              const tár = readKmJelölések();
              delete tár[pickerNjk.uid];
              const szín = választSzínt(betű, tár, KM_JEL_SZÍNEK);
              writeKmJelölés(pickerNjk.uid, { betű, szín, jegyzet: jel?.jegyzet ?? '' });
            }
            setPickerUid(null);
            rerender(n => n + 1);
          }}
        />
      )}

      {jegyzetNjk && jegyzetJel?.betű && (
        <KmJegyzetPopup
          betű={jegyzetJel.betű}
          szín={jegyzetJel.szín}
          név={jegyzetNjk.név}
          jegyzet={jegyzetJel.jegyzet}
          onClose={() => setJegyzetUid(null)}
          onSave={jegyzet => {
            writeKmJelölés(jegyzetNjk.uid, { betű: jegyzetJel.betű, szín: jegyzetJel.szín, jegyzet });
            rerender(n => n + 1);
          }}
        />
      )}
    </div>
  );
}

/** Stat label: "maradék/max (Skat)"; sértetlen (S0) esetén csak "maradék/max". */
function statLabel(stat: ÉleterőStat): string {
  const base = `${stat.maradék}/${stat.max}`;
  return stat.sKategória > 0 ? `${base} (S${stat.sKategória})` : base;
}

/** Fakó ÉP csík szín az arány szerint: zöld → sárga → vörös (alacsony telítettség). */
function epSzín(arány: number): string {
  // hue 120 (zöld) → 0 (vörös); fakó: alacsony szaturáció + sötét háttér.
  const hue = Math.round(120 * Math.max(0, Math.min(1, arány)));
  return `hsl(${hue}, 30%, 30%)`;
}

/** A persistált slotlistába beolvassa az aktív karakter friss jk/becenév/név állapotát. */
export function mergeAktív(slots: SlotEntry[], aktív: Karakter): SlotEntry[] {
  const idx = slots.findIndex(s => s.uid === aktív.uid);
  if (idx >= 0) {
    const copy = slots.slice();
    copy[idx] = { ...copy[idx], jk: aktív.jk, becenév: aktív.becenév, név: aktív.név };
    return copy;
  }
  // Ritka: a slot még nem létezik (autosave nem futott) — az aktív karakterből építjük.
  return [...slots, {
    uid: aktív.uid, id_leíró: aktív.id_leíró, név: aktív.név, becenév: aktív.becenév,
    tsz: aktív.tsz, mentés_dátum: aktív.mentés_dátum, jk: aktív.jk,
  }];
}
