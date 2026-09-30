import type { TavharcProps } from './types';
import { getAlkalmatlanInfo, calcÚjratöltésEnyhítés } from './helpers';
import { TavharcFegyverCard } from './TavharcFegyverCard';
import { MAX_FEGYVER_DARAB } from '../../ui-constants';

interface Props extends TavharcProps {
  onMfTarget: (idx: number) => void;
  onDeleteTarget: (idx: number) => void;
  onIdeaPopup: (idx: number) => void;
}

export function TavharcFegyverLista({ data, karakter, session, setSession, setKarakter, onMfTarget, onDeleteTarget, onIdeaPopup }: Props) {
  const k = karakter;
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const újratöltésEnyhítés = calcÚjratöltésEnyhítés(session, k);
  const tfIdx = session.aktív_távfegyver_index;

  const alkalmatlan = getAlkalmatlanInfo(k, data);
  const felvett = new Set(k.távfegyverek.map(tf => tf.alap.toLowerCase()));
  // Mágiatáv I–IV kölcsönösen kizáró: a felvett (aktív) verzió a `felvett` szűrő
  // miatt nem jelenik meg, de a másik 3 igen - így lehet fokozatot váltani.
  const felvehető = data.tavfegyverek.filter(d => !felvett.has(d.név.toLowerCase()) && !d.név.startsWith('🔆'));

  const isMágikusDef = (alap: string) =>
    data.tavfegyverek.find(d => d.név.toLowerCase() === alap.toLowerCase())?.kategória === 'mágikus';

  function addTávfegyver(alap: string) {
    const ideaDefault = data.tavfegyverek.find(d => d.név.toLowerCase() === alap.toLowerCase())?.idea_default ?? 0;
    setKarakter(prev => {
      if (!prev) return prev;
      // Mágiatáv: mindig csak 1 a 4-ből - ha már van mágikus, cseréljük (nem új példány).
      if (isMágikusDef(alap)) {
        const existingIdx = prev.távfegyverek.findIndex(tf => isMágikusDef(tf.alap));
        if (existingIdx >= 0) {
          const távfegyverek = prev.távfegyverek.map((tf, i) => i === existingIdx ? { alap, idea: ideaDefault } : tf);
          return { ...prev, távfegyverek, session: { ...prev.session, aktív_távfegyver_index: existingIdx } };
        }
      }
      const távfegyverek = [...prev.távfegyverek, { alap, idea: ideaDefault }];
      return { ...prev, távfegyverek, session: { ...prev.session, aktív_távfegyver_index: távfegyverek.length - 1 } };
    });
  }

  return (
    <section className="th-section">
      {k.távfegyverek.map((_, i) => (
        <TavharcFegyverCard
          key={i}
          index={i}
          isActive={i === tfIdx}
          karakter={k}
          session={session}
          data={data}
          gyorsaság={gyorsaság}
          újratöltésEnyhítés={újratöltésEnyhítés}
          onSelect={() => setSession(s => ({ ...s, aktív_távfegyver_index: i }))}
          onMfTarget={() => onMfTarget(i)}
          onDeleteTarget={() => onDeleteTarget(i)}
          onIdeaPopup={() => onIdeaPopup(i)}
        />
      ))}

      {k.távfegyverek.length < MAX_FEGYVER_DARAB && (
      <select className="he-add-select" value="" onChange={e => { if (e.target.value) addTávfegyver(e.target.value); }}>
        <option value="">+ Új távfegyver...</option>
        {felvehető.map(f => <option key={f.név} value={f.név}>{f.név}</option>)}
      </select>
      )}

      {(alkalmatlan.nevek.length > 0 || alkalmatlan.alkalmiTárgyNév) && (
        <>
          <h3 className="th-hajithato-title">Hajítható fegyverek (fortélyból)</h3>
          {alkalmatlan.nevek.map((név, i) => (
            <div key={`alk-${i}`} className="th-card th-card-dim">
              <div className="th-card-header"><strong>🔆 {név}</strong></div>
              <div className="th-card-fields"><span className="th-badge">CÉ: 0, Osztó: 1</span></div>
            </div>
          ))}
          {alkalmatlan.alkalmiTárgyNév && (
            <div className="th-card th-card-dim">
              <div className="th-card-header"><strong>🔆 {alkalmatlan.alkalmiTárgyNév}</strong></div>
              <div className="th-card-fields">
                <span className="th-badge">CÉ: 0, Osztó: {alkalmatlan.alkalmiTárgyDef?.Osztó ?? 1}</span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
