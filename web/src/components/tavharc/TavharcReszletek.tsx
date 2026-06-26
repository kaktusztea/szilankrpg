import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

export function TavharcReszletek({ fegyverCÉ, osztó, mfCÉ, idea, fortélyCÉ, harcmodorCÉ, harcmodorNév, harcmodorSzint, önuralom, CM, céAlap, cé, gameMode, karakter, setKarakter, konstansok }: {
  fegyverCÉ: number;
  osztó: number;
  mfCÉ: number;
  idea: number;
  fortélyCÉ: number;
  harcmodorCÉ: number;
  harcmodorNév: string;
  harcmodorSzint: number;
  önuralom: number;
  CM: number;
  céAlap: number;
  cé: number;
  gameMode: boolean;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  konstansok: GameData['konstansok'];
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'stretch' }}>
      <div style={{ flex: 1, padding: '10px', border: '1px dashed #666', borderRadius: '6px', fontSize: '12px', color: '#aaa' }}>
        <strong style={{ color: '#e53935' }}>Részletes értékek</strong>
        <div>Fegyver alap CÉ: {fegyverCÉ}</div>
        <div>Fegyver Osztó: {osztó}</div>
        <div>MF CÉ bónusz: {mfCÉ}</div>
        <div>Idea CÉ bónusz: {idea}</div>
        {fortélyCÉ !== 0 && <div>Célzás CÉ bónusz: +{fortélyCÉ}</div>}
        <div>Harcmodor CÉ bónusz: {harcmodorCÉ} ({harcmodorNév} szint:{harcmodorSzint})</div>
        <div>Tulajdonság (Önuralom): {önuralom}</div>
        <div>CM: {CM}</div>
        <div>CÉ alap: {céAlap}</div>
        <div><strong>Összesen: {cé}</strong></div>
      </div>
      {!gameMode && (
        <div style={{ padding: '10px', border: '1px solid #444', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#aaa' }}>CM</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="fort-fok-btn" style={{ width: '32px', height: '32px' }} onClick={() => setKarakter(prev => prev ? { ...prev, CM: Math.max(0, prev.CM - 1) } : prev)}>−</button>
            <strong style={{ fontSize: '18px' }}>{CM}</strong>
            <button className="fort-fok-btn th-cm-btn" onClick={() => setKarakter(prev => prev ? { ...prev, CM: Math.min(prev.CM + 1, prev.tsz * konstansok.arányok.max_cm_perszint) } : prev)}>+</button>
          </div>
          <span style={{ fontSize: '11px', color: '#888' }}>max: {karakter.tsz * konstansok.arányok.max_cm_perszint}</span>
        </div>
      )}
    </div>
  );
}
