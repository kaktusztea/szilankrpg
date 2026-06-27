import type { GameData } from '../engine/data-loader';
import type { Karakter, Session, Fortely } from '../engine/types';
import type { TabDef } from './TabBar';
import { AktivScreen } from './aktiv';
import { HarcScreen } from './harc';
import { TavharcScreen } from './tavharc';
import { TulajdonsagokScreen } from './tulajdonsagok';
import { FortelyokScreen } from './fortelyok';
import { HarcertekekScreen } from './harcertekek';
import { MisztikusScreen } from './misztikus';
import { HatterekScreen } from './hatterek';
import { lookupFegyver } from '../engine/helpers';
import { describeKepChange } from '../engine/undo-helpers';

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
  tulajdonságok: any;
  setTulajdonságok: any;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string) => void;
}

export function TabContent({ tab, data, gameMode, setActiveTab, tulajdonságok, setTulajdonságok,
  képzettségek, setKépzettségek, fortélyok, setFortélyok, session, setSession,
  karakter, setKarakter, pushUndo }: Props) {
  switch (tab) {
    case 'aktiv': return <AktivScreen data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} />;
    case 'harc': return <HarcScreen data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} onNavigate={(id) => {
      const idx = ALL_TABS.findIndex(t => t.id === id);
      if (idx >= 0) setActiveTab(idx);
    }} />;
    case 'tavharc': return <TavharcScreen data={data} karakter={karakter} session={session} setSession={setSession} setKarakter={setKarakter} gameMode={gameMode} />;
    case 'tulajdonsagok': {
      const setAnyanyelv = (v: string) => setKarakter(prev => {
        if (!prev) return prev;
        const közös = data.konstansok.közös_nyelv;
        const filtered = prev.fortélyok.filter(f => !(f.név === 'Nyelvismeret' && f.kiérdemelt));
        const ingyenesek: Fortely[] = [
          { név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: közös, kiérdemelt: true },
        ];
        if (v && v !== közös) {
          ingyenesek.push({ név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: v, kiérdemelt: true });
        }
        return { ...prev, anyanyelv: v, fortélyok: [...ingyenesek, ...filtered] };
      });
      return <TulajdonsagokScreen data={data} gameMode={gameMode} karakter={karakter}
        tulajdonságok={tulajdonságok} setTulajdonságok={(v: any) => {
          const newVal = typeof v === 'function' ? v(tulajdonságok) : v;
          const tul = tulajdonságok as Record<string, number>;
          const changed = Object.keys(newVal).find(k => newVal[k] !== tul[k]);
          pushUndo(changed ? `${changed}: ${tul[changed!]} → ${newVal[changed!]}` : 'Tulajdonság módosítás');
          setTulajdonságok(v);
        }}
        képzettségek={képzettségek} setKépzettségek={(v: any) => {
          const newVal: {név: string; szint: number}[] = typeof v === 'function' ? v(képzettségek) : v;
          const desc = describeKepChange(képzettségek, newVal);
          if (desc) pushUndo(desc);
          setKépzettségek(v);
        }}
        név={karakter.név} setNév={v => { pushUndo(`Név: ${karakter.név} → ${v}`); setKarakter(prev => prev ? { ...prev, név: v } : prev); }}
        becenév={karakter.becenév} setBecenév={v => { pushUndo(`Becenév: ${v}`); setKarakter(prev => prev ? { ...prev, becenév: v } : prev); }}
        játékos={karakter.játékos} setJátékos={v => { pushUndo(`Játékos: ${v}`); setKarakter(prev => prev ? { ...prev, játékos: v } : prev); }}
        tsz={karakter.tsz} setTsz={v => { pushUndo(`TSz: ${karakter.tsz} → ${v}`); setKarakter(prev => prev ? { ...prev, tsz: v } : prev); }}
        kor={karakter.kor} setKor={v => { pushUndo(`Kor: ${karakter.kor} → ${v}`); setKarakter(prev => prev ? { ...prev, kor: v } : prev); }}
        faj={karakter.hátterek.faj} setFaj={v => { pushUndo(`Faj: ${v}`); setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, faj: v } } : prev); }}
        anyanyelv={karakter.anyanyelv} setAnyanyelv={setAnyanyelv}
      />;
    }
    case 'fortelyok': {
      const fegyverNevek = karakter.fegyverek.map(f => {
        const fd = lookupFegyver(data.fegyverek, f.alap);
        return fd?.Alapnév || f.alap;
      });
      const nyelvtanulásSzint = karakter.képzettségek.find(k => k.név === 'Nyelvtanulás')?.szint ?? 0;
      return <FortelyokScreen data={data} gameMode={gameMode}
        fortélyok={fortélyok} setFortélyok={(v: any) => {
          const newVal: Fortely[] = typeof v === 'function' ? v(fortélyok) : v;
          let desc = '';
          if (newVal.length > fortélyok.length) {
            const added = newVal.find(n => !fortélyok.some(f => f.név === n.név && f.spec_elem === n.spec_elem));
            if (added && added.fok > 0) desc = `Fortély: ${added.név}${added.spec_elem ? ` (${added.spec_elem})` : ""} 0→${added.fok}`;
          } else if (newVal.length < fortélyok.length) {
            const removed = fortélyok.find(f => !newVal.some(n => n.név === f.név && n.spec_elem === f.spec_elem));
            if (removed) desc = `Fortély: ${removed.név}${removed.spec_elem ? ` (${removed.spec_elem})` : ""} ${removed.fok}→0❌`;
          } else {
            const changed = newVal.find((n, i) => n.fok !== fortélyok[i]?.fok);
            if (changed) {
              const old = fortélyok.find(f => f.név === changed.név && f.spec_elem === changed.spec_elem);
              if (old && old.fok !== changed.fok) desc = `Fortély: ${changed.név}${changed.spec_elem ? ` (${changed.spec_elem})` : ""} ${old.fok}→${changed.fok}`;
            }
          }
          if (desc) pushUndo(desc);
          setFortélyok(v);
        }}
        tsz={karakter.tsz} fegyverNevek={fegyverNevek} távfegyverNevek={karakter.távfegyverek.map(tf => tf.alap)} nyelvtanulásSzint={nyelvtanulásSzint}
        képzettségek={képzettségek}
      />;
    }
    case 'misztikus': return <MisztikusScreen data={data} karakter={karakter} képzettségek={képzettségek} setKépzettségek={(v: any) => {
          const newVal: {név: string; szint: number}[] = typeof v === 'function' ? v(képzettségek) : v;
          const desc = describeKepChange(képzettségek, newVal);
          if (desc) pushUndo(desc);
          setKépzettségek(v);
        }} fortélyok={fortélyok} setFortélyok={setFortélyok} gameMode={gameMode} />;
    case 'harcertekek': return <HarcertekekScreen data={data} karakter={karakter}
        setKarakter={(v: any) => { pushUndo('Harcértékek módosítás'); setKarakter(v); }}
        képzettségek={képzettségek} gameMode={gameMode} setKépzettségek={(v: any) => {
          const newVal: {név: string; szint: number}[] = typeof v === 'function' ? v(képzettségek) : v;
          const desc = describeKepChange(képzettségek, newVal);
          if (desc) pushUndo(desc);
          setKépzettségek(v);
        }} />;
    case 'hatterek': return <HatterekScreen data={data} karakter={karakter}
        setKarakter={setKarakter} pushUndo={pushUndo} gameMode={gameMode}
        onNavigate={tab => { const idx = ALL_TABS.findIndex(t => t.id === tab); if (idx >= 0) setActiveTab(idx); }} />;
    default: return null;
  }
}
