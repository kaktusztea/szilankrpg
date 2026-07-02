import type { Karakter, PancelPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { evaluate, buildContext } from '../../engine/reactive';
import { buildPancelLookups } from '../harc/pancel-calc';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  merevvertFok: number;
  onPopup: (popup: string) => void;
  onIdeaTarget: () => void;
}

/** Evaluate páncél rules via reactive engine */
function calcPancelValues(k: Karakter, data: GameData): { sfé_fizikai: number; sfé_energia: number; mgt: number } {
  if (!k.páncél.alap) return { sfé_fizikai: 0, sfé_energia: 0, mgt: 0 };

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
  };
}

export function PancelSection({ data, karakter: k, setKarakter, merevvertFok, onPopup, onIdeaTarget }: Props) {
  const { konstansok } = data;
  const struktúrák = konstansok.páncél_struktúrák;
  const aktStruktúra = struktúrák.find((s: any) => s.struktúra === k.páncél.alap);
  const hasAlap = !!k.páncél.alap;

  const { sfé_fizikai, sfé_energia, mgt } = calcPancelValues(k, data);

  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  return (
    <section className="he-section">
      <h3>Páncél</h3>
      {hasAlap && (
        <div className="he-pancel-chips">
          <span className="he-pancel-chip">SFÉ: {sfé_fizikai}/{sfé_energia}</span>
          <span className="he-pancel-chip">MGT: {mgt}</span>
          <button className="he-pancel-chip he-pancel-chip-btn" onClick={() => onPopup('rongálódás')}>Rongálódás: {k.páncél.rongálódás}</button>
        </div>
      )}
      <div className="he-fegyver-fields">
        <button className="he-field-btn" onClick={() => onPopup('struktúra')}>Struktúra: <strong>{k.páncél.alap || '—'}</strong></button>
        <button className="he-field-btn he-field-fortely" onClick={() => onPopup('merevvért')}>Merevvért fok: <strong>{merevvertFok}</strong></button>
        <button className={`he-field-btn${!hasAlap || !aktStruktúra?.idea_plusz_minusz ? ' he-field-disabled' : ''}`} disabled={!hasAlap || !aktStruktúra?.idea_plusz_minusz} onClick={onIdeaTarget}>Idea: <strong>{k.páncél.idea}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('kidolgozottság')}>Kidolgozottság: <strong>{k.páncél.kidolgozottság}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => updatePancel({ sisak: !k.páncél.sisak })}>Sisak: <strong>{k.páncél.sisak ? 'igen' : 'nem'}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('végtagvédettség')}>Végtagvédettség: <strong>{k.páncél.végtagvédettség}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('méret')}>Méret: <strong>{k.páncél.méret_illeszkedés}</strong></button>
        {aktStruktúra?.fém && (
          <button className="he-field-btn" onClick={() => onPopup('fémalapanyag')}>Fémalapanyag: <strong>{k.páncél.fémalapanyag || konstansok.páncél_fémalapanyagok[0]?.anyag || ''}</strong></button>
        )}
      </div>
    </section>
  );
}
