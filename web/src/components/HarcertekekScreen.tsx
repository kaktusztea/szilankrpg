import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { HmSection, HarciKepzettsegekSection, FegyverekSection, PancelSection, PajzsSection, Popups } from './harcertekek';
import { useHint, usePopupState, useKarakterMutators } from './harcertekek/hooks';
import './HarcertekekScreen.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  gameMode: boolean;
}

export function HarcertekekScreen({ data, karakter, setKarakter, képzettségek, setKépzettségek, gameMode }: Props) {
  const { hint, showHint } = useHint();

  const popup = usePopupState((név) => {
    const kp = képzettségek.find(k => k.név === név);
    if (kp && kp.szint === 0) setKépzettségek(prev => prev.filter(k => k.név !== név));
  });

  const mutators = useKarakterMutators(data, setKarakter);

  const merevvertFok = karakter.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0;
  const pajzsFok = karakter.fortélyok.find(f => f.név === 'Pajzshasználat')?.fok ?? 0;

  return (
    <div className="screen harcertekek-screen" style={gameMode ? { pointerEvents: 'none' } : undefined}>
      <h2>🛡️ Harcértékek</h2>

      <HmSection data={data} karakter={karakter} setKarakter={setKarakter} gameMode={gameMode} />

      <HarciKepzettsegekSection
        data={data} karakter={karakter} képzettségek={képzettségek} setKépzettségek={setKépzettségek}
        gameMode={gameMode} onDeleteKepz={popup.setDeleteKepzTarget} onKepzSzint={popup.setKepzSzintTarget}
      />

      <FegyverekSection
        data={data} karakter={karakter} setKarakter={setKarakter} gameMode={gameMode}
        onIdeaTarget={idx => popup.setIdeaTarget({ type: 'fegyver', idx })}
        onMfTarget={popup.setMfTarget} onAnyagTarget={popup.setAnyagTarget} onDeleteTarget={popup.setDeleteTarget}
      />

      <PancelSection
        data={data} karakter={karakter} setKarakter={setKarakter}
        merevvertFok={merevvertFok}
        onPopup={popup.setPancelPopup}
        onIdeaTarget={() => popup.setIdeaTarget({ type: 'páncél', idx: 0 })}
      />

      <PajzsSection
        data={data} karakter={karakter} pajzsFok={pajzsFok}
        onPajzsPopup={popup.setPajzsPopup} showHint={showHint}
      />

      <Popups
        data={data} karakter={karakter} képzettségek={képzettségek} state={popup.state}
        onClose={popup.close}
        updateFegyver={mutators.updateFegyver} updatePancel={mutators.updatePancel}
        setMfFok={mutators.setMfFok} setMerevvertFok={mutators.setMerevvertFok}
        setPajzsFok={mutators.setPajzsFok} updatePajzs={mutators.updatePajzs}
        removeFegyver={mutators.removeFegyver} setKépzettségek={setKépzettségek}
      />

      {hint && <div className="he-hint">{hint}</div>}
    </div>
  );
}
