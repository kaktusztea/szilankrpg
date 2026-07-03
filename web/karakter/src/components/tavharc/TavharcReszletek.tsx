import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { UndoPatch } from '../../hooks/useUndo';
import type { CÉBontás } from './types';

interface Props {
  bontás: CÉBontás;
  gameMode: boolean;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  konstansok: GameData['konstansok'];
}

export function TavharcReszletek({ bontás, gameMode, karakter, setKarakter, pushUndo, konstansok }: Props) {
  const { fegyverCÉ, osztó, mfCÉ, idea, fortélyCÉ, harcmodorCÉ, harcmodorNév, harcmodorSzint, önuralom, cé, céAlap, isMágikus, mágikusTulajdonságCÉ } = bontás;
  const CM = karakter.CM;

  return (
    <div className="th-reszletek">
      <div className="debug-box th-reszletek-box">
        <strong className="debug-box-title">Részletes értékek</strong>
        <div>Fegyver alap CÉ: {fegyverCÉ}</div>
        <div>Fegyver Osztó: {osztó}</div>
        <div>MF CÉ bónusz: {mfCÉ}</div>
        <div>Idea CÉ bónusz: {idea}</div>
        {fortélyCÉ !== 0 && <div>Célzás CÉ bónusz: +{fortélyCÉ}</div>}
        <div>Harcmodor CÉ bónusz: {harcmodorCÉ} ({harcmodorNév} szint:{harcmodorSzint})</div>
        {isMágikus
          ? <div>TSz + Gyo + Int: {mágikusTulajdonságCÉ}</div>
          : <><div>Tulajdonság (Önuralom): {önuralom}</div><div>CM: {CM}</div></>
        }
        <div>CÉ alap: {céAlap}</div>
        <div><strong>Összesen: {cé}</strong></div>
      </div>
      {!gameMode && (
        <div className="th-cm-box">
          <span className="th-cm-label">CM</span>
          <div className="th-cm-controls">
            <button className="fort-fok-btn th-cm-btn-size" onClick={() => { pushUndo(`CM: ${CM} → ${CM - 1}`, [{ field: 'CM', prev: CM }], Math.max(0, CM - 1)); setKarakter(prev => prev ? { ...prev, CM: Math.max(0, prev.CM - 1) } : prev); }}>−</button>
            <strong className="th-cm-value">{CM}</strong>
            <button className="fort-fok-btn th-cm-btn-size" onClick={() => { pushUndo(`CM: ${CM} → ${CM + 1}`, [{ field: 'CM', prev: CM }], CM + 1); setKarakter(prev => prev ? { ...prev, CM: Math.min(prev.CM + 1, prev.tsz * konstansok.arányok.max_cm_perszint) } : prev); }}>+</button>
          </div>
          <span className="th-cm-max">max: {karakter.tsz * konstansok.arányok.max_cm_perszint}</span>
        </div>
      )}
    </div>
  );
}
