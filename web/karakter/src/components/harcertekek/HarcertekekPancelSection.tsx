import type { Karakter, PancelPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  merevvertFok: number;
  onPopup: (popup: string) => void;
  onIdeaTarget: () => void;
}

/** Compute raw SFÉ (fizikai + energia) from páncél config */
function calcSfé(k: Karakter, konstansok: any): { fizikai: number; energia: number } {
  const struktúra = konstansok.páncél_struktúrák.find((s: any) => s.struktúra === k.páncél.alap);
  if (!struktúra) return { fizikai: 0, energia: 0 };
  const alapanyag = struktúra.fém
    ? konstansok.páncél_fémalapanyagok.find((a: any) => a.anyag === (k.páncél.fémalapanyag || 'acél'))
    : null;
  const sféBónusz = alapanyag ? (typeof alapanyag.sfé_bónusz === 'number' ? alapanyag.sfé_bónusz : 0) : 0;
  const common = sféBónusz + k.páncél.idea - k.páncél.rongálódás;
  return {
    fizikai: struktúra.sfé_fizikai + common,
    energia: struktúra.sfé_energia + common,
  };
}

/** Compute MGT from páncél config */
function calcMgt(k: Karakter, konstansok: any): number {
  const struktúra = konstansok.páncél_struktúrák.find((s: any) => s.struktúra === k.páncél.alap);
  if (!struktúra) return 0;

  // Alapanyag MGT (only for fém)
  const alapanyag = struktúra.fém
    ? konstansok.páncél_fémalapanyagok.find((a: any) => a.anyag === (k.páncél.fémalapanyag || 'acél'))
    : null;
  const alapanyagMgt = alapanyag?.mgt ?? 0;

  // Csatolt tag MGT
  const csatoltDb = k.páncél.végtagvédettség + (k.páncél.sisak ? 1 : 0);
  const csatoltTábla = konstansok.páncél_csatolt_tag_mgt;
  let tagMgtPerDb = 0;
  if (struktúra.merev) {
    tagMgtPerDb = csatoltTábla.merevvért_fém[k.páncél.kidolgozottság] ?? 0;
  } else if (struktúra.fém) {
    tagMgtPerDb = csatoltTábla.hajlékonyvért_fém[k.páncél.kidolgozottság] ?? 0;
  } else {
    tagMgtPerDb = csatoltTábla.hajlékonyvért_nem_fém[k.páncél.kidolgozottság] ?? 0;
  }
  const csatoltMgt = csatoltDb * tagMgtPerDb;

  // Méret MGT
  const méretMap: Record<string, number> = { 'passzol': 0, 'nem passzol': 3, 'borzalmas': 6 };
  const méretMgt = méretMap[k.páncél.méret_illeszkedés] ?? 0;

  return Math.max(0, struktúra.mgt + alapanyagMgt + csatoltMgt + méretMgt - k.tulajdonságok.erő);
}

export function PancelSection({ data, karakter: k, setKarakter, merevvertFok, onPopup, onIdeaTarget }: Props) {
  const { konstansok } = data;
  const struktúrák = konstansok.páncél_struktúrák;
  const aktStruktúra = struktúrák.find((s: any) => s.struktúra === k.páncél.alap);
  const hasAlap = !!k.páncél.alap;

  const sfé = hasAlap ? calcSfé(k, konstansok) : { fizikai: 0, energia: 0 };
  const mgt = hasAlap ? calcMgt(k, konstansok) : 0;

  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  return (
    <section className="he-section">
      <h3>Páncél</h3>
      {hasAlap && (
        <div className="he-pancel-chips">
          <span className="he-pancel-chip">SFÉ: {sfé.fizikai}/{sfé.energia}</span>
          <span className="he-pancel-chip">MGT: {mgt}</span>
          <button className="he-pancel-chip he-pancel-chip-btn" onClick={() => onPopup('rongálódás')}>Rongálódás: {k.páncél.rongálódás}</button>
        </div>
      )}
      <div className="he-fegyver-fields">
        <button className="he-field-btn" onClick={() => onPopup('struktúra')}>Struktúra: <strong>{k.páncél.alap || '—'}</strong></button>
        <button className="he-field-btn he-field-fortely" onClick={() => onPopup('merevvért')}>Merevvért fok: <strong>{merevvertFok}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={onIdeaTarget}>Idea: <strong>{k.páncél.idea}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('kidolgozottság')}>Kidolgozottság: <strong>{k.páncél.kidolgozottság}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => updatePancel({ sisak: !k.páncél.sisak })}>Sisak: <strong>{k.páncél.sisak ? 'igen' : 'nem'}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('végtagvédettség')}>Végtagvédettség: <strong>{k.páncél.végtagvédettség}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('méret')}>Méret: <strong>{k.páncél.méret_illeszkedés}</strong></button>
        {aktStruktúra?.fém && (
          <button className="he-field-btn" onClick={() => onPopup('fémalapanyag')}>Fémalapanyag: <strong>{k.páncél.fémalapanyag || 'acél'}</strong></button>
        )}
      </div>
    </section>
  );
}
