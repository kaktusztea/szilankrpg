import { useState, useEffect, useMemo } from 'react';
import type { Karakter } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import type { PróbaEnyhítés } from '../engine/data-types';
import { képzKulcs } from '../engine/azonosito';
import { PopupOverlay } from './PopupOverlay';
import { ProbaDispatcher, type ProbaCél } from './ProbaDispatcher';
import { buildFortélyFokok } from './tulajdonsagok/kepzettseg-proba-calc';
import { getDisplayName } from './tulajdonsagok/helpers';
import { fortélyPróbaBónuszok } from '../engine/effekt';
import { felszerelésMax, felszerelésTerhelés, felszerelésHátrány } from '../engine/felszereles';
import './ProbaHub.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  /** Csak Játék módban (és nem verzió-nézetben) látszik a FAB. */
  aktív: boolean;
}

/**
 * Lebegő 🎲 próba-hub (Játék mód): bárhonnan indítható Tulajdonság- / Képzettségpróba.
 * A FAB fixen lebeg; ha BÁRMILYEN overlay/popup nyitva van (`.kep-prompt-overlay` a body-ban),
 * elrejtőzik. A próba-adatokat a karakterből itt állítjuk össze (ugyanaz a logika, mint a
 * TulajdonsagokScreen - l. a memók; a próba-ablakok maguk a meglévő popup-komponensek).
 */
export function ProbaHub({ data, karakter, aktív }: Props) {
  const [hubNyitva, setHubNyitva] = useState(false);
  const [cél, setCél] = useState<ProbaCél | null>(null);
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

  const fortélyBónuszByTul = useMemo(() => {
    const result: Record<string, { érték: number; leírás: string }[]> = {};
    for (const kulcs of Object.keys(karakter.tulajdonságok)) {
      const érzék = kulcs === 'érzékenység';
      const b = fortélyPróbaBónuszok(karakter, data, érzék ? ['tulajdonságpróba', 'érzék_próba'] : ['tulajdonságpróba'],
        a => a === `tulajdonság:${kulcs}` || (érzék && a.startsWith('érzék:')));
      if (b.length) result[kulcs] = b;
    }
    return result;
  }, [karakter, data]);

  const fortélyBónuszByKép = useMemo(() => {
    const result: Record<string, { érték: number; leírás: string }[]> = {};
    for (const kp of karakter.képzettségek) {
      const b = fortélyPróbaBónuszok(karakter, data, ['képzettségpróba'], a => a === `képzettség:${képzKulcs(kp)}`);
      if (b.length) result[képzKulcs(kp)] = b;
    }
    return result;
  }, [karakter, data]);

  const próbaEnyhítésekByKép = useMemo(() => {
    const result: Record<string, PróbaEnyhítés[]> = {};
    for (const kf of karakter.fortélyok) {
      const def = data.fortelySummaries.find(d => d.id === kf.id);
      if (!def) continue;
      const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
      const pe_lista = fokDef?.próba_enyhítések;
      if (!pe_lista || !pe_lista.length) continue;
      for (const pe of pe_lista) (result[pe.képzettség] ??= []).push({ ...pe, fortély: def.név });
    }
    return result;
  }, [karakter.fortélyok, data.fortelySummaries]);

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
          onClick={() => setHubNyitva(true)}
        >🎲</button>
      )}

      {hubNyitva && !cél && (
        <PopupOverlay onClose={() => setHubNyitva(false)} className="kep-prompt proba-hub-popup">
          <h3 className="proba-hub-header">Tulajdonságpróba</h3>
          <div className="proba-hub-grid">
            {tulajdonságok.map(t => (
              <button key={t} className="proba-hub-chip proba-hub-chip-tul" onClick={() => setCél({ típus: 'tulajdonság', kulcs: t })}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <h3 className="proba-hub-header">Képzettségpróba</h3>
          <div className="proba-hub-grid proba-hub-grid-2">
            <button className="proba-hub-chip proba-hub-chip-kepzetlen" onClick={() => setCél({ típus: 'képzetlen' })}>
              Képzetlenül
            </button>
            {karakter.képzettségek
              .map((kp, idx) => ({ kp, idx, név: getDisplayName(képzKulcs(kp), data.kepzettsegDefs) }))
              .sort((a, b) => a.név.localeCompare(b.név, 'hu'))
              .map(({ kp, idx, név }) => (
                <button key={képzKulcs(kp) + idx} className="proba-hub-chip proba-hub-chip-kep" onClick={() => setCél({ típus: 'képzettség', idx })}>
                  {név}
                </button>
              ))}
          </div>
        </PopupOverlay>
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
