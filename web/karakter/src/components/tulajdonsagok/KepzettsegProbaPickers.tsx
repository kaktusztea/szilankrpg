import type { KiterjesztesEntry } from '../../engine/data-loader';
import type { ModositoTabla, PróbaEnyhítés } from '../../engine/data-types';
import { PopupOverlay } from '../PopupOverlay';
import { enyhítettSorRészletes } from './kepzettseg-proba-calc';

/** Melyik alpicker van nyitva a Képzettségpróba popupban. */
export type ProbaPickerId = 'kit' | 'szit' | 'info' | null;

interface Props {
  openPicker: ProbaPickerId;
  setOpenPicker: (id: ProbaPickerId) => void;
  resetDobás: () => void;

  // Kiterjesztés picker
  kiterjesztesek: KiterjesztesEntry[];
  selKits: Set<number>;
  setSelKits: React.Dispatch<React.SetStateAction<Set<number>>>;
  kitDotClass: (k: KiterjesztesEntry) => string;
  kitDots: (k: KiterjesztesEntry) => string;

  // Szituációs módosítók
  módosítóTáblák: ModositoTabla[];
  próbaEnyhítések: PróbaEnyhítés[];
  szitMods: Record<string, number>;
  setSzitMods: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  multiMods: Record<string, boolean[]>;
  setMultiMods: React.Dispatch<React.SetStateAction<Record<string, boolean[]>>>;
  szerepjátékosMódosító: boolean;
  szerepjátékosÉrték: number;
  setSzerepjátékosÉrték: (v: number) => void;
  szitModÖsszeg: number;

  // Infó popup
  képzettségNév: string;
  dobásKomment: { line: string }[];
}

/**
 * A Képzettségpróba popup alpickerei: kiterjesztő fortélyok, helyzetfüggő módosítók,
 * és a próbadobás infó szöveg. Külön fájlban, hogy a fő popup a próba folyamatára szűküljön.
 */
export function KepzettsegProbaPickers({
  openPicker, setOpenPicker, resetDobás,
  kiterjesztesek, selKits, setSelKits, kitDotClass, kitDots,
  módosítóTáblák, próbaEnyhítések, szitMods, setSzitMods, multiMods, setMultiMods,
  szerepjátékosMódosító, szerepjátékosÉrték, setSzerepjátékosÉrték, szitModÖsszeg,
  képzettségNév, dobásKomment,
}: Props) {
  return (
    <>
      {openPicker === 'kit' && (
        <PopupOverlay onClose={() => setOpenPicker(null)}>
          <div className="kep-prompt vallas-picker" onClick={e => e.stopPropagation()}>
            <label className="kep-prompt-label-bold-mb">Kiterjesztő fortélyok</label>
            <div className="kep-prompt-flex-col-list">
              <button className={`he-field-btn${selKits.size === 0 ? ' vallas-active' : ''}`}
                onClick={() => { setSelKits(new Set()); resetDobás(); }}>
                Törzstudás (nincs) ❌
              </button>
              {kiterjesztesek.map((k, i) => {
                const active = selKits.has(i);
                return (
                  <button key={i} className={`he-field-btn${active ? ' vallas-active' : ''}`}
                    onClick={() => { setSelKits(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; }); resetDobás(); }}>
                    {k.fortély} <span className={kitDotClass(k)}>{kitDots(k)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </PopupOverlay>
      )}

      {openPicker === 'szit' && (
        <PopupOverlay onClose={() => { setOpenPicker(null); resetDobás(); }}>
          <div className="kep-prompt kep-proba-szit-popup" onClick={e => e.stopPropagation()}>
            <label className="kep-prompt-label-bold-mb">Helyzetfüggő módosítók</label>
            <div className="kep-proba-szit-body">
              {módosítóTáblák.map(t => (
                <div key={t.kategória} className="kep-proba-szit-cat">
                  <span className="kep-proba-szit-label">{t.kategória}</span>
                  {t.mód === 'chips' ? (
                    <div className="kep-proba-szerepjatekos-chips">
                      {t.sorok.map((s, i) => {
                        const isActive = szitMods[t.kategória] === i;
                        return (
                          <button key={i}
                            className={`fort-fok-btn kep-proba-szerepjatekos-chip${isActive ? ' active' : ''}${s.érték > 0 ? ' kep-proba-szerepjatekos-pos' : ' kep-proba-szerepjatekos-neg'}`}
                            onClick={() => setSzitMods(m => ({ ...m, [t.kategória]: m[t.kategória] === i ? -1 : i }))}>
                            {s.érték > 0 ? `+${s.érték}` : s.érték}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                  <div className="kep-proba-szit-items">
                    {t.sorok.map((s, i) => {
                      // Enyhítés kalkuláció a sorra
                      const { érték: enyhítettÉrték, immunis } = enyhítettSorRészletes(próbaEnyhítések, t.kategória, s);
                      const isMulti = t.mód === 'multi';
                      const isActive = isMulti ? !!(multiMods[t.kategória]?.[i]) : szitMods[t.kategória] === i;
                      const handleClick = isMulti
                        ? () => setMultiMods(m => ({ ...m, [t.kategória]: m[t.kategória].map((v, j) => j === i ? !v : v) }))
                        : () => setSzitMods(m => ({ ...m, [t.kategória]: m[t.kategória] === i ? -1 : i }));
                      return (
                      <button key={i}
                        className={`kep-proba-szit-item${isActive ? ' kep-proba-szit-item-active' : ''}${immunis || enyhítettÉrték !== s.érték ? ' kep-proba-szit-enyhitett' : s.érték > 0 ? ' kep-proba-szit-pos' : s.érték < 0 ? ' kep-proba-szit-neg' : ''}`}
                        onClick={handleClick}>
                        <span className="kep-proba-szit-val">
                          {immunis || enyhítettÉrték !== s.érték
                            ? <><span className="kep-proba-szit-old">{s.érték}</span><span className="kep-proba-szit-arrow">→</span><span className="kep-proba-szit-new">{immunis ? 0 : enyhítettÉrték}</span></>
                            : <>{s.érték > 0 ? '+' : ''}{s.érték}</>}
                        </span>
                        <span className="kep-proba-szit-desc">{s.leírás}</span>
                      </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              ))}
              {szerepjátékosMódosító && (
                <div className="kep-proba-szit-cat">
                  <span className="kep-proba-szit-label">Szerepjátékos módosító</span>
                  <div className="kep-proba-szerepjatekos-chips">
                    {[-3, -2, -1, 1, 2, 3].map(v => (
                      <button key={v}
                        className={`fort-fok-btn kep-proba-szerepjatekos-chip${szerepjátékosÉrték === v ? ' active' : ''}${v > 0 ? ' kep-proba-szerepjatekos-pos' : ' kep-proba-szerepjatekos-neg'}`}
                        onClick={() => setSzerepjátékosÉrték(szerepjátékosÉrték === v ? 0 : v)}>
                        {v > 0 ? `+${v}` : v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {szitModÖsszeg !== 0 && (
              <div className={`kep-proba-szit-sum-footer${szitModÖsszeg > 0 ? ' kep-proba-szit-pos' : ' kep-proba-szit-neg'}`}>
                Összesen: {szitModÖsszeg > 0 ? '+' : ''}{szitModÖsszeg}
              </div>
            )}
          </div>
        </PopupOverlay>
      )}
      {openPicker === 'info' && (
        <PopupOverlay className="kep-prompt kep-proba-info-popup" onClose={() => setOpenPicker(null)}>
          <label className="kep-prompt-label-bold-mb">{képzettségNév} — próbadobás</label>
          <div className="kep-proba-info-body">
            {dobásKomment.map((k, i) => (
              <p key={i} className="kep-proba-info-line">{k.line}</p>
            ))}
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
