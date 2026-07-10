import type { TavharcProps } from './types';
import { getAlkalmatlanInfo, calcÚjratöltésEnyhítés } from './helpers';
import { TavharcFegyverCard } from './TavharcFegyverCard';
import { MAX_FEGYVER_DARAB } from '../../ui-constants';

interface Props extends TavharcProps {
  idea: number;
  onMfTarget: (idx: number) => void;
  onDeleteTarget: (idx: number) => void;
  onIdeaPopup: () => void;
}

export function TavharcFegyverLista({ data, karakter, session, setSession, setKarakter, idea, onMfTarget, onDeleteTarget, onIdeaPopup }: Props) {
  const k = karakter;
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const újratöltésEnyhítés = calcÚjratöltésEnyhítés(session, k);
  const tfIdx = session.aktív_távfegyver_index;

  const alkalmatlan = getAlkalmatlanInfo(k, data);
  const felvett = new Set(k.távfegyverek.map(tf => tf.alap.toLowerCase()));
  const hasMágikus = k.távfegyverek.some(tf => data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tf.alap.toLowerCase())?.Kategória === 'mágikus');
  const felvehető = data.tavfegyverek.filter(d => !felvett.has(d.Fegyver.toLowerCase()) && !d.Fegyver.startsWith('🔆') && !(hasMágikus && d.Kategória === 'mágikus'));

  function addTávfegyver(alap: string) {
    setKarakter(prev => {
      if (!prev) return prev;
      const távfegyverek = [...prev.távfegyverek, { alap }];
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
          idea={idea}
          gyorsaság={gyorsaság}
          újratöltésEnyhítés={újratöltésEnyhítés}
          onSelect={() => setSession(s => ({ ...s, aktív_távfegyver_index: i }))}
          onMfTarget={() => onMfTarget(i)}
          onDeleteTarget={() => onDeleteTarget(i)}
          onIdeaPopup={onIdeaPopup}
        />
      ))}

      {k.távfegyverek.length < MAX_FEGYVER_DARAB && (
      <select className="he-add-select" value="" onChange={e => { if (e.target.value) addTávfegyver(e.target.value); }}>
        <option value="">+ Új távfegyver...</option>
        {felvehető.map(f => <option key={f.Fegyver} value={f.Fegyver}>{f.Fegyver}</option>)}
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
