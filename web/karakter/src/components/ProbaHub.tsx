import { Ikon } from './common/Ikon';
import { useState, useEffect, useMemo } from 'react';
import type { Karakter, Session, UndoPatch } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { képzKulcs } from '../engine/azonosito';
import { PopupOverlay } from './PopupOverlay';
import { ProbaDispatcher, type ProbaCél } from './ProbaDispatcher';
import { pushDobás } from './harc/DobasPopup';
import { KeDobasPopup } from './harc/KeDobasPopup';
import { buildFortélyFokok } from '../engine/proba/kepzettseg-proba-calc';
import { getDisplayName } from './tulajdonsagok/helpers';
import { felszerelésMax, felszerelésTerhelés, felszerelésHátrány } from '../engine/felszereles';
import './ProbaHub.css';
import { fortélyBónuszokTulajdonságonként, fortélyBónuszokKépzettségenként, próbaEnyhítésekKépzettségenként } from '../engine/proba/proba-forrasok';

/** Die-type label next to a section header (same look as the Képzettség row roll button). */
function KockaChip({ kocka }: { kocka: number }) {
  return <span className="kocka-chip"><Ikon név="kocka" méret={15} />k{kocka}</span>;
}

interface Props {
  data: GameData;
  karakter: Karakter;
  /** Csak Játék módban (és nem verzió-nézetben) látszik a FAB. */
  aktív: boolean;
  /** A KÉ dobás popup (Harci helyzet kapszula, előzmény) a session-t írja. */
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  /** TÉ / Manőver chip: switch to the target tab + open the roll popup there; CÉ: switch tab + flash the CÉ-SP-VÉ box (resolved by App). */
  onHarciDobás: (cél: 'támadó' | 'célzó' | 'manőver') => void;
}

/**
 * Lebegő 🎲 próba-hub (Játék mód): bárhonnan indítható Tulajdonság- / Képzettségpróba.
 * A FAB fixen lebeg; ha BÁRMILYEN overlay/popup nyitva van (`.kep-prompt-overlay` a body-ban),
 * elrejtőzik. A próba-adatokat a karakterből itt állítjuk össze (ugyanaz a logika, mint a
 * TulajdonsagokScreen - l. a memók; a próba-ablakok maguk a meglévő popup-komponensek).
 */
export function ProbaHub({ data, karakter, aktív, session, setSession, pushUndo, onHarciDobás }: Props) {
  const [hubNyitva, setHubNyitva] = useState(false);
  const [cél, setCél] = useState<ProbaCél | null>(null);
  // KÉ dobás helyben (nem vált fület): ugyanaz a popup, mint a Harc fülön.
  const [kéDobás, setKéDobás] = useState(false);
  // Van-e nyitott overlay a body-ban (bármilyen popup/menü) - ekkor a FAB elrejtőzik.
  const [overlayNyitva, setOverlayNyitva] = useState(false);

  useEffect(() => {
    if (!aktív) return;
    const figyel = () => setOverlayNyitva(document.querySelector('.kep-prompt-overlay') !== null);
    figyel();
    const mo = new MutationObserver(figyel);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [aktív]);

  // --- Próba-adatok összeállítása (a TulajdonsagokScreen logikájával egyezően) ---
  const fortélyFokok = useMemo(() => buildFortélyFokok(karakter.fortélyok), [karakter.fortélyok]);
  const felszHátrány = useMemo(
    () => felszerelésHátrány(felszerelésTerhelés(karakter, data), felszerelésMax(karakter, data), data),
    [karakter, data],
  );
  const négáltKulcsok = useMemo(() => new Set(karakter.kiterjesztés_negálva ?? []), [karakter.kiterjesztés_negálva]);
  const többszörösNevek = useMemo(
    () => new Set(data.fortelySummaries.filter(d => d.többszörös_típus !== '').map(d => d.id)),
    [data.fortelySummaries],
  );

  const fortélyBónuszByTul = useMemo(() => fortélyBónuszokTulajdonságonként(karakter, data), [karakter, data]);

  const fortélyBónuszByKép = useMemo(() => fortélyBónuszokKépzettségenként(karakter, data), [karakter, data]);

  const próbaEnyhítésekByKép = useMemo(() => próbaEnyhítésekKépzettségenként(karakter.fortélyok, data), [karakter.fortélyok, data]);

  // Skill chips: the taken skills; for an NJK (GM mode) also every rollable skill not taken (untrained roll).
  const képzettségChipek = useMemo(() => {
    const ki: { kulcs: string; név: string; cél: ProbaCél }[] = karakter.képzettségek.map((kp, idx) => ({
      kulcs: képzKulcs(kp) + '#' + idx, név: getDisplayName(képzKulcs(kp), data.kepzettsegDefs), cél: { típus: 'képzettség', idx },
    }));
    if (!karakter.jk) {
      const felvett = new Set(karakter.képzettségek.map(kp => kp.id));
      for (const d of data.kepzettsegDefs) {
        if (felvett.has(d.id) || (d.próba !== 'dobható' && d.próba !== 'ellenpróba')) continue;
        ki.push({ kulcs: d.id, név: d.név, cél: { típus: 'képzetlen_képzettség', kulcs: d.id } });
      }
    }
    return ki.sort((a, b) => a.név.localeCompare(b.név, 'hu'));
  }, [karakter.képzettségek, karakter.jk, data.kepzettsegDefs]);

  if (!aktív) return null;

  // A FAB elrejtőzik, ha nyitva van bármi (a hub popup is `.kep-prompt-overlay`, így saját magát is rejti).
  const fabLátszik = !overlayNyitva;
  const tulajdonságok = Object.keys(karakter.tulajdonságok);

  return (
    <>
      {fabLátszik && (
        <button
          className="proba-fab"
          title="Próbadobás"
          aria-label="Próbadobás indítása"
          onPointerDown={e => e.preventDefault()}
          onClick={() => setHubNyitva(true)}
        >🎲</button>
      )}

      {hubNyitva && !cél && (
        <PopupOverlay onClose={() => setHubNyitva(false)} className="kep-prompt proba-hub-popup" overlayClassName="proba-hub-overlay">
          <button type="button" className="kep-proba-close-btn proba-hub-close-btn" onClick={() => setHubNyitva(false)} title="Bezárás" aria-label="Bezárás"><Ikon név="bezár" /></button>
          {/* Combat rolls are k20 (dice.ts rollK20 - not a konstans) */}
          <h3 className="proba-hub-header">Harci dobás <KockaChip kocka={20} /></h3>
          <div className="proba-hub-grid proba-hub-grid-4">
            <button className="proba-hub-chip proba-hub-chip-harc" onClick={() => {
              setKéDobás(true);
              setHubNyitva(false);
            }}>KÉ</button>
            <button className="proba-hub-chip proba-hub-chip-harc" title="Támadó dobás (Harc fül)" aria-label="Támadó dobás" onClick={() => { setHubNyitva(false); onHarciDobás('támadó'); }}>TÉ</button>
            <button className="proba-hub-chip proba-hub-chip-harc" title="Célzó dobás (Távharc fül)" aria-label="Célzó dobás" onClick={() => { setHubNyitva(false); onHarciDobás('célzó'); }}>CÉ</button>
            <button className="proba-hub-chip proba-hub-chip-harc proba-hub-chip-manover" title="Manőver (Harc fül)" aria-label="Manőver" onClick={() => { setHubNyitva(false); onHarciDobás('manőver'); }}>Manőver</button>
          </div>

          <h3 className="proba-hub-header">Tulajdonságpróba <KockaChip kocka={data.konstansok.próba.tulajdonság.kocka} /></h3>
          {/* Column-major (3 columns), same item order: down the first column, then the next one */}
          <div className="proba-hub-grid proba-hub-grid-oszlopos"
            style={{ '--proba-hub-sorok': Math.ceil(tulajdonságok.length / 3) } as React.CSSProperties}>
            {tulajdonságok.map(t => (
              <button key={t} className="proba-hub-chip proba-hub-chip-tul" onClick={() => setCél({ típus: 'tulajdonság', kulcs: t })}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <h3 className="proba-hub-header">Képzettségpróba <KockaChip kocka={data.konstansok.próba.képzettség.kocka} /></h3>
          {/* Column-major order: the ABC list runs down the left column, then continues at the top of the right one */}
          <div className="proba-hub-grid proba-hub-grid-2 proba-hub-grid-oszlopos"
            style={{ '--proba-hub-sorok': Math.ceil((képzettségChipek.length + 1) / 2) } as React.CSSProperties}>
            <button className="proba-hub-chip proba-hub-chip-kepzetlen" onClick={() => setCél({ típus: 'képzetlen' })}>
              Képzetlenül
            </button>
            {képzettségChipek.map(c => (
              <button key={c.kulcs} className={`proba-hub-chip proba-hub-chip-kep${c.cél.típus === 'képzetlen_képzettség' ? ' proba-hub-chip-nincs' : ''}`}
                title={c.cél.típus === 'képzetlen_képzettség' ? 'Nincs felvéve: képzetlen próba' : undefined}
                onClick={() => setCél(c.cél)}>
                {c.név}
              </button>
            ))}
          </div>
        </PopupOverlay>
      )}

      {kéDobás && (
        <KeDobasPopup data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
          onClose={eredmény => {
            setKéDobás(false);
            if (eredmény != null) setSession(prev => ({ ...prev, ké_dobások: pushDobás(prev.ké_dobások ?? [], eredmény) }));
          }} />
      )}

      {cél && (
        <ProbaDispatcher
          cél={cél}
          data={data}
          karakter={karakter}
          fortélyFokok={fortélyFokok}
          felszHátrány={felszHátrány}
          négáltKulcsok={négáltKulcsok}
          többszörösNevek={többszörösNevek}
          fortélyBónuszByTul={fortélyBónuszByTul}
          fortélyBónuszByKép={fortélyBónuszByKép}
          próbaEnyhítésekByKép={próbaEnyhítésekByKép}
          onClose={() => { setCél(null); setHubNyitva(false); }}
        />
      )}
    </>
  );
}
