import type { Karakter, PancelPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { HintType } from '../../hooks/useHint';
import { evaluate, buildContext } from '../../engine/reactive';
import { buildPancelLookups } from '../../engine/harc/pancel-calc';
import { árFormátum } from '../formatters';
import { useState, Fragment } from 'react';
import { Ikon } from '../common/Ikon';
import { ListaPicker } from '../picker/ListaPicker';
import { FokPottyok } from './FokPottyok';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  merevvertFok: number;
  onPopup: (popup: string) => void;
  onIdeaTarget: () => void;
  showHint: (msg: string, type?: HintType, duration?: number) => void;
  /** Register a "back to the edit menu" callback before opening a field popup from the menu. */
  onMenüből: (vissza: () => void) => void;
}

/** Evaluate páncél rules via reactive engine */
function calcPancelValues(k: Karakter, data: GameData): { sfé_fizikai: number; sfé_energia: number; mgt: number; ár: number } {
  if (!k.páncél.alap) return { sfé_fizikai: 0, sfé_energia: 0, mgt: 0, ár: 0 };

  const { konstansok } = data;
  const lookupArrays = buildPancelLookups(konstansok);

  const stringCtx = new Map<string, string>();
  stringCtx.set('páncél_alap', k.páncél.alap);
  stringCtx.set('páncél_fémalapanyag', k.páncél.fémalapanyag);
  stringCtx.set('páncél_kidolgozottság', k.páncél.kidolgozottság);
  stringCtx.set('páncél_méret_illeszkedés', k.páncél.méret_illeszkedés);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok, {
    páncél_van: 1,
    páncél_végtagvédettség: k.páncél.végtagvédettség,
    páncél_sisak: k.páncél.sisak ? 1 : 0,
    páncél_idea: k.páncél.idea,
    páncél_rongálódás: k.páncél.rongálódás,
  });

  const computed = evaluate(data.rules, ctx, lookupArrays, stringCtx);

  return {
    sfé_fizikai: computed.get('sfé_fizikai') ?? 0,
    sfé_energia: computed.get('sfé_energia') ?? 0,
    mgt: computed.get('páncél_MGT') ?? 0,
    ár: computed.get('páncél_ár') ?? 0,
  };
}

export function PancelSection({ data, karakter: k, setKarakter, merevvertFok, onPopup, onIdeaTarget, showHint, onMenüből }: Props) {
  const { konstansok } = data;
  const struktúrák = konstansok.páncél_struktúrák;
  const aktStruktúra = struktúrák.find(s => s.struktúra === k.páncél.alap);
  const hasAlap = !!k.páncél.alap;
  const [szerkNyitva, setSzerkNyitva] = useState(false);

  const { sfé_fizikai, sfé_energia, mgt, ár } = calcPancelValues(k, data);
  const fémalapanyag = k.páncél.fémalapanyag || konstansok.páncél_fémalapanyagok[0]?.anyag || '';
  const ideaSzerkeszthető = !!aktStruktúra?.idea_plusz_minusz;

  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  // "Páncél viselve": the same session flag as the Harc fül toggle (karakter.session.aktív_páncél), so they stay in sync
  const viselve = hasAlap && k.session.aktív_páncél;
  function toggleViselve() {
    setKarakter(prev => prev ? { ...prev, session: { ...prev.session, aktív_páncél: !prev.session.aktív_páncél } } : prev);
  }

  function mgtBontás() {
    const erő = k.tulajdonságok.erő;
    const nyers = mgt + erő;
    const erőTag = erő > 0 ? `- ${erő} (Erő bónusz)` : erő < 0 ? `+ ${-erő} (Erő büntetés)` : '';
    showHint(`MGT: ${mgt} = ${nyers}(páncél)${erőTag ? ' ' + erőTag : ''}`, 'info', 2000);
  }

  const merevvért = <FokPottyok név="Merevvért fok" fok={merevvertFok} max={MAX_FORTÉLY_FOK} onClick={() => onPopup('merevvért')} />;
  // Subtitle: metal (metal armour only) · craftsmanship · fit · Idea. A fit with an MGT penalty
  // ("nem passzol" / "borzalmas") is highlighted in the same faded orange as Rongálódás.
  const rosszMéret = ((konstansok.páncél_méret_illeszkedés as { fokozat: string; mgt: number }[])
    .find(m => m.fokozat === k.páncél.méret_illeszkedés)?.mgt ?? 0) > 0;
  const alcímRészek = [
    aktStruktúra?.fém ? fémalapanyag : null,
    k.páncél.kidolgozottság,
    rosszMéret ? <span className="he-stat-figyel">{k.páncél.méret_illeszkedés}</span> : k.páncél.méret_illeszkedés,
    `Idea ${k.páncél.idea}`,
  ].filter(Boolean);
  const alcím = alcímRészek.map((r, i) => <Fragment key={i}>{i > 0 && ' · '}{r}</Fragment>);

  return (
    <section className="he-section">
      <h3>Páncél</h3>
      {/* Compact card like the weapon cards: title + Merevvért dots, subtitle, Sisak toggle + edit menu, 2-line stats */}
      <div className={`he-fegyver-card${hasAlap && !viselve ? ' he-fegyver-card-ki' : ''}`}>
        <div className="he-fegyver-header">
          <div className="he-fegyver-cim">
            <div className={`he-fegyver-nev${hasAlap ? '' : ' he-nincs'}`}>{hasAlap ? k.páncél.alap : 'Nincs páncél'}{merevvért}</div>
            {hasAlap && <div className="he-fegyver-alcim">{alcím}</div>}
          </div>
          {hasAlap && (
            <div className="he-fegyver-ikonok">
              <button type="button" className={`he-ikon-btn he-felsz-btn${viselve ? ' on' : ''}`} aria-pressed={viselve}
                title={viselve ? 'Páncél viselve: igen' : 'Páncél viselve: nem'} aria-label="Páncél viselve"
                onClick={toggleViselve}><Ikon név="viselve" /></button>
              <button type="button" className="he-ikon-btn" title="Szerkesztés" aria-label="Szerkesztés" onClick={() => setSzerkNyitva(true)}><Ikon név="szerkeszt" /></button>
            </div>
          )}
        </div>
        {hasAlap ? (
          <div className="he-stat-sor">
            <div className="he-stat-fo">
              SFÉ <b>{sfé_fizikai}F</b><span className="he-stat-sep"> / </span><b>{sfé_energia}E</b>
              <span className="he-stat-sep"> · </span>
              <button type="button" className="he-stat-bontas" onClick={mgtBontás}>MGT</button> <b>{mgt}</b>
            </div>
            <div>
              <button type="button" className="he-stat-gomb" onClick={() => onPopup('végtagvédettség')}>Végtag <b>{k.páncél.végtagvédettség}</b></button>
              {/* Sisak indicator (green = yes), tappable toggle */}
              <span className="he-stat-sep"> · </span>
              <button type="button" className={`he-stat-sisak${k.páncél.sisak ? ' on' : ''}`} aria-pressed={!!k.páncél.sisak}
                title={k.páncél.sisak ? 'Sisak: igen' : 'Sisak: nem'} aria-label="Sisak"
                onClick={() => updatePancel({ sisak: !k.páncél.sisak })}><Ikon név="sisak" /></button>
              <span className="he-stat-sep"> · </span>Ár <b>{árFormátum(ár)}x</b>
            </div>
            {/* Own line, only when damaged */}
            {k.páncél.rongálódás > 0 && (
              <div><button type="button" className="he-stat-bontas he-stat-figyel" onClick={() => onPopup('rongálódás')}>Rongálódás <b>{k.páncél.rongálódás}</b></button></div>
            )}
          </div>
        ) : (
          <button type="button" className="he-add-select" onClick={() => onPopup('struktúra')}>+ Páncél választása...</button>
        )}
      </div>
      {szerkNyitva && (
        <ListaPicker title={k.páncél.alap} onClose={() => setSzerkNyitva(false)}
          opciók={[
            { érték: 'struktúra', név: 'Struktúra', infó: k.páncél.alap },
            ...(aktStruktúra?.fém ? [{ érték: 'fémalapanyag', név: 'Fémalapanyag', infó: fémalapanyag }] : []),
            { érték: 'kidolgozottság', név: 'Kidolgozottság', infó: k.páncél.kidolgozottság },
            { érték: 'méret', név: 'Méret', infó: k.páncél.méret_illeszkedés },
            { érték: 'idea', név: 'Idea', infó: String(k.páncél.idea), disabled: !ideaSzerkeszthető, megjegyzés: ideaSzerkeszthető ? undefined : 'ennél a struktúránál nem állítható' },
            { érték: 'végtagvédettség', név: 'Végtagvédettség', infó: String(k.páncél.végtagvédettség) },
            { érték: 'sisak', név: 'Sisak', infó: k.páncél.sisak ? 'igen' : 'nem' },
            { érték: 'rongálódás', név: 'Rongálódás', infó: String(k.páncél.rongálódás) },
          ]}
          onVálaszt={mező => {
            // Sisak: plain toggle, no sub-popup (so no "back to menu" registration)
            if (mező === 'sisak') { updatePancel({ sisak: !k.páncél.sisak }); return; }
            onMenüből(() => setSzerkNyitva(true));
            if (mező === 'idea') onIdeaTarget(); else onPopup(mező);
          }} />
      )}
    </section>
  );
}
