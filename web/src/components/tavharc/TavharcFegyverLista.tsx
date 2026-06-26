import type { TavharcProps } from './types';
import { getMfFok, mfKövetelményHiba, mfKövetelményText, calcCÉ, calcTámadásLabel, getAlkalmatlanInfo } from './helpers';

export function TavharcFegyverLista({ data, karakter, session, setSession, setKarakter, idea, fortélyCÉ, onMfTarget, onDeleteTarget, onIdeaPopup }: TavharcProps & {
  idea: number;
  fortélyCÉ: number;
  onMfTarget: (idx: number) => void;
  onDeleteTarget: (idx: number) => void;
  onIdeaPopup: () => void;
}) {
  const k = karakter;
  const konstansok = data.konstansok;
  const céAlap = konstansok.harcérték_alap.CÉ;
  const önuralom = k.tulajdonságok.önuralom ?? 0;
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const gyorsÚjratöltésFok = k.fortélyok.find(f => f.név === konstansok.nyílpuska_gyors_újratöltés_fortély)?.fok ?? 0;
  const tfIdx = session.aktív_távfegyver_index;

  const alkalmatlan = getAlkalmatlanInfo(k, data);
  const felvett = new Set(k.távfegyverek.map(tf => tf.alap.toLowerCase()));
  const felvehető = data.tavfegyverek.filter(d => !felvett.has(d.Fegyver.toLowerCase()) && !d.Fegyver.startsWith('🔆'));

  function addTávfegyver(alap: string) {
    setKarakter(prev => {
      if (!prev) return prev;
      const távfegyverek = [...prev.távfegyverek, { alap }];
      const newSession = { ...prev.session, aktív_távfegyver_index: távfegyverek.length - 1 };
      return { ...prev, távfegyverek, session: newSession };
    });
  }

  return (
    <section className="th-section">
      {k.távfegyverek.map((tf, i) => {
        const def = data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tf.alap.toLowerCase());
        const hmNév = def?.Harcmodor ?? 'Hajítás';
        const hmSzint = k.képzettségek.find(kp => kp.név === hmNév)?.szint ?? 0;
        const hmCÉ = data.harcmodorBonusz.find(b => b.szint === hmSzint)?.CÉ ?? -9;
        const fCÉ = parseInt(def?.CÉ ?? '0') || 0;
        const mf = getMfFok(k, tf.alap);
        const mfC = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mf)?.CÉ ?? 0;
        const cardCÉ = calcCÉ({ céAlap, önuralom, CM: k.CM, harcmodorCÉ: hmCÉ, fegyverCÉ: fCÉ, mfCÉ: mfC, idea, fortélyCÉ });
        const sebesség = parseInt(def?.Sebesség ?? '-1') || -1;
        const tám = calcTámadásLabel({ harcmodorSzint: hmSzint, gyorsaság, sebesség, gyorsÚjratöltésFok, konstansok });

        return (
          <div key={i} className={`th-card${i === tfIdx ? ' th-card-active' : ''}`} onClick={() => setSession(s => ({ ...s, aktív_távfegyver_index: i }))}>
            <div className="th-card-header">
              <strong>{tf.alap}</strong>
              <button className="fort-delete" onClick={e => { e.stopPropagation(); onDeleteTarget(i); }}>✕</button>
            </div>
            <div className="th-card-fields">
              <button className="he-field-btn he-field-fortely"
                style={mfKövetelményHiba(k, data, tf.alap) ? { color: '#e53935' } : undefined}
                onClick={e => { e.stopPropagation(); onMfTarget(i); }}>
                MF fok: <strong>{mf}</strong>
                {mfKövetelményHiba(k, data, tf.alap) && <span className="he-mf-error">{mfKövetelményText(k, data, tf.alap)}</span>}
              </button>
              <button className="he-field-btn" onClick={e => { e.stopPropagation(); onIdeaPopup(); }}>Idea: <strong>{idea >= 0 ? '+' : ''}{idea}</strong></button>
              <span className="th-badge">CÉ: {cardCÉ}  ({tám})</span>
            </div>
          </div>
        );
      })}

      <select className="he-add-select" value="" onChange={e => { if (e.target.value) addTávfegyver(e.target.value); }}>
        <option value="">+ Új távfegyver...</option>
        {felvehető.map(f => <option key={f.Fegyver} value={f.Fegyver}>{f.Fegyver}</option>)}
      </select>

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
