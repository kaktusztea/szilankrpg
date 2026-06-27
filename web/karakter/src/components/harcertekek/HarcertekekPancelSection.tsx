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

export function PancelSection({ data, karakter: k, setKarakter, merevvertFok, onPopup, onIdeaTarget }: Props) {
  const { konstansok } = data;
  const struktúrák = konstansok.páncél_struktúrák;
  const aktStruktúra = struktúrák.find(s => s.struktúra === k.páncél.alap);
  const hasAlap = !!k.páncél.alap;

  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  return (
    <section className="he-section">
      <h3>Páncél</h3>
      <div className="he-fegyver-fields">
        <button className="he-field-btn" onClick={() => onPopup('struktúra')}>Struktúra: <strong>{k.páncél.alap || '—'}</strong></button>
        <button className="he-field-btn he-field-fortely" onClick={() => onPopup('merevvért')}>Merevvért fok: <strong>{merevvertFok}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={onIdeaTarget}>Idea: <strong>{k.páncél.idea}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('kidolgozottság')}>Kidolgozottság: <strong>{k.páncél.kidolgozottság}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => updatePancel({ sisak: !k.páncél.sisak })}>Sisak: <strong>{k.páncél.sisak ? 'igen' : 'nem'}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('végtagvédettség')}>Végtagvédettség: <strong>{k.páncél.végtagvédettség}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('méret')}>Méret: <strong>{k.páncél.méret_illeszkedés}</strong></button>
        <button className={`he-field-btn${!hasAlap ? ' he-field-disabled' : ''}`} disabled={!hasAlap} onClick={() => onPopup('rongálódás')}>Rongálódás: <strong>{k.páncél.rongálódás}</strong></button>
        {aktStruktúra?.fém && (
          <button className="he-field-btn" onClick={() => onPopup('fémalapanyag')}>Fémalapanyag: <strong>{k.páncél.fémalapanyag || 'acél'}</strong></button>
        )}
      </div>
    </section>
  );
}
