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
    <div className="th-reszletek">
      <div className="th-reszletek-box">
        <strong className="th-reszletek-title">Részletes értékek</strong>
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
        <div className="th-cm-box">
          <span className="th-cm-label">CM</span>
          <div className="th-cm-controls">
            <button className="fort-fok-btn th-cm-btn-size" onClick={() => setKarakter(prev => prev ? { ...prev, CM: Math.max(0, prev.CM - 1) } : prev)}>−</button>
            <strong className="th-cm-value">{CM}</strong>
            <button className="fort-fok-btn th-cm-btn" onClick={() => setKarakter(prev => prev ? { ...prev, CM: Math.min(prev.CM + 1, prev.tsz * konstansok.arányok.max_cm_perszint) } : prev)}>+</button>
          </div>
          <span className="th-cm-max">max: {karakter.tsz * konstansok.arányok.max_cm_perszint}</span>
        </div>
      )}
    </div>
  );
}
