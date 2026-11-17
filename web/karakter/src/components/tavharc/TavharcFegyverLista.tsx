import type { TavharcProps } from './types';
import { getAlkalmatlanInfo, calcÚjratöltésEnyhítés } from './helpers';
import { TavharcFegyverCard } from './TavharcFegyverCard';
import { MAX_FEGYVER_DARAB } from '../../ui-constants';
import { lookupTávfegyver } from '../../engine/lookup';
import { useState } from 'react';
import { Ikon } from '../common/Ikon';
import { SpecPicker, type PickerSource, type PickerItem } from '../SpecPicker';
import { FokPottyok } from '../common/FokPottyok';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';
import { távfegyverStatok } from './TavharcFegyverCard';

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
    lookupTávfegyver(data.tavfegyverek, alap)?.kategória === 'mágikus';

  const [pickerOpen, setPickerOpen] = useState(false);

  // Add-weapon picker (like the Harcértékek one): grouped by harcmodor; each row shows the stats the weapon
  // WOULD have once taken (CÉ / Támadás / SP incl. MF bonuses, same calc as the card) + the MF fok dots.
  function pickerSource(): PickerSource {
    const csoportok = new Map<string, PickerItem[]>();
    for (const f of felvehető) {
      const próba = { ...k, távfegyverek: [...k.távfegyverek, { alap: f.név, idea: f.idea_default ?? 0 }] };
      const st = távfegyverStatok(próba, data, session, próba.távfegyverek.length - 1, gyorsaság, újratöltésEnyhítés);
      const arr = csoportok.get(f.harcmodor) ?? [];
      arr.push({
        value: f.név, label: f.név,
        info: `CÉ: ${st.bontás.cé}, Támadás: ${st.tám}, SP: ${st.spÉrték}`,
        nevUtán: <FokPottyok név="MF fok" fok={st.mf} max={MAX_FORTÉLY_FOK} hiba={st.mf > 0 && st.hasError} />,
      });
      csoportok.set(f.harcmodor, arr);
    }
    return { type: 'grouped', label: 'Új távfegyver', groups: [...csoportok].map(([label, items]) => ({ label, items })) };
  }

  function addTávfegyver(alap: string) {
    const ideaDefault = lookupTávfegyver(data.tavfegyverek, alap)?.idea_default ?? 0;
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
      <h3 className="he-section-cim">
        Távfegyverek
        {k.távfegyverek.length < MAX_FEGYVER_DARAB && (
          <span className="csoport-uj">
            <button type="button" className="csoport-uj-btn" title="Új távfegyver" aria-label="Új távfegyver" onClick={() => setPickerOpen(true)}><Ikon név="új" /></button>
          </span>
        )}
      </h3>
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
      {pickerOpen && (
        <SpecPicker
          source={pickerSource()}
          onSelect={alap => { addTávfegyver(alap); setPickerOpen(false); }}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </section>
  );
}
