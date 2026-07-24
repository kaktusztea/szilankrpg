import type { GameData } from '../engine/data-loader';
import type { Karakter, Session, Fortely, Tulajdonsagok } from '../engine/types';
import type { UndoPatch } from '../hooks/useUndo';
import type { TabDef } from './TabBar';
import { useUndoWrappedSetters } from '../hooks/useUndoWrappedSetters';
import { makeFieldSetter, makeAnyanyelvSetter, buildFortelyokProps, makeFajSetter } from './karakter-setters';
import { AktivScreen } from './aktiv';
import { HarcScreen } from './harc';
import { TavharcScreen } from './tavharc';
import { TulajdonsagokScreen } from './tulajdonsagok';
import { FortelyokScreen } from './fortelyok';
import { HarcertekekScreen } from './harcertekek';
import { MisztikusScreen } from './misztikus';
import { HatterekScreen } from './hatterek';

export const ALL_TABS: TabDef[] = [
  { id: 'aktiv', label: '✳️', editOnly: false },
  { id: 'harc', label: '🗡️', editOnly: false },
  { id: 'tavharc', label: '🏹', editOnly: false },
  { id: 'harcertekek', label: '🛡️', editOnly: false },
  { id: 'misztikus', label: '✨', editOnly: false },
  { id: 'tulajdonsagok', label: '🔵', editOnly: false },
  { id: 'fortelyok', label: '🟣', editOnly: false },
  { id: 'hatterek', label: '🟡', editOnly: false },
];

interface Props {
  tab: string;
  data: GameData;
  gameMode: boolean;
  setActiveTab: (i: number) => void;
  tulajdonságok: Tulajdonsagok;
  setTulajdonságok: React.Dispatch<React.SetStateAction<Tulajdonsagok>>;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
}

export function TabContent({ tab, data, gameMode, setActiveTab, tulajdonságok,
  képzettségek, fortélyok, setFortélyok, session, setSession,
  karakter, setKarakter, pushUndo }: Props) {

  const { setTulajdonságokUndo, setKépzettségekUndo, setFortélyokUndo } = useUndoWrappedSetters({ karakter, setKarakter, pushUndo });

  switch (tab) {
    case 'aktiv': return <AktivScreen data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} />;
    case 'harc': return <HarcScreen data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} onNavigate={(id) => {
      const idx = ALL_TABS.findIndex(t => t.id === id);
      if (idx >= 0) setActiveTab(idx);
    }} />;
    case 'tavharc': return <TavharcScreen data={data} karakter={karakter} session={session} setSession={setSession} setKarakter={setKarakter} pushUndo={pushUndo} képzettségek={képzettségek} setKépzettségek={setKépzettségekUndo} gameMode={gameMode} />;
    case 'tulajdonsagok': {
      const sf = makeFieldSetter(pushUndo, setKarakter);
      const setAnyanyelv = makeAnyanyelvSetter(setKarakter, data.konstansok.közös_nyelv);
      return <TulajdonsagokScreen data={data} gameMode={gameMode} karakter={karakter}
        tulajdonságok={tulajdonságok} setTulajdonságok={setTulajdonságokUndo}
        képzettségek={képzettségek} setKépzettségek={setKépzettségekUndo}
        név={karakter.név} setNév={sf('név', (p, n) => `Név: ${p} → ${n}`)}
        becenév={karakter.becenév} setBecenév={sf('becenév', (_, n) => `Becenév: ${n}`)}
        játékos={karakter.játékos} setJátékos={sf('játékos', (_, n) => `Játékos: ${n}`)}
        tsz={karakter.tsz} setTsz={sf('tsz', (p, n) => `TSz: ${p} → ${n}`)}
        kor={karakter.kor} setKor={sf('kor', (p, n) => `Kor: ${p} → ${n}`)}
        faj={karakter.hátterek.faj} setFaj={makeFajSetter(pushUndo, setKarakter)}
        anyanyelv={karakter.anyanyelv} setAnyanyelv={setAnyanyelv}
      />;
    }
    case 'fortelyok': {
      const { fegyverNevek, távfegyverNevek, nyelvtanulásSzint } = buildFortelyokProps(karakter, data);
      return <FortelyokScreen data={data} gameMode={gameMode}
        fortélyok={fortélyok} setFortélyok={setFortélyokUndo}
        tsz={karakter.tsz} fegyverNevek={fegyverNevek} távfegyverNevek={távfegyverNevek} nyelvtanulásSzint={nyelvtanulásSzint}
        képzettségek={képzettségek}
      />;
    }
    case 'misztikus': return <MisztikusScreen data={data} karakter={karakter} képzettségek={képzettségek} setKépzettségek={setKépzettségekUndo}
      fortélyok={fortélyok} setFortélyok={setFortélyok} gameMode={gameMode} />;
    case 'harcertekek': return <HarcertekekScreen data={data} karakter={karakter}
        setKarakter={setKarakter} pushUndo={pushUndo}
        képzettségek={képzettségek} gameMode={gameMode} setKépzettségek={setKépzettségekUndo} />;
    case 'hatterek': return <HatterekScreen data={data} karakter={karakter}
        setKarakter={setKarakter} pushUndo={pushUndo} gameMode={gameMode}
        onNavigate={tab => { const idx = ALL_TABS.findIndex(t => t.id === tab); if (idx >= 0) setActiveTab(idx); }} />;
    default: return null;
  }
}
