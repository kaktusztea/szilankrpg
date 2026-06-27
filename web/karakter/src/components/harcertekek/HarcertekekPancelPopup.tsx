interface Props {
  popup: string;
  páncél: { alap: string; fémalapanyag: string; kidolgozottság: string; méret_illeszkedés: string; végtagvédettség: number; rongálódás: number };
  struktúrák: { struktúra: string; fém?: boolean }[];
  fémalapanyagok: { anyag: string }[];
  merevvertFok: number;
  onUpdate: (patch: Record<string, unknown>) => void;
  onMerevvert: (fok: number) => void;
}

export function PancelPopup({ popup, páncél, struktúrák, fémalapanyagok, merevvertFok, onUpdate, onMerevvert }: Props) {
  return (
    <div className="kep-prompt-overlay">
      <div className="kep-prompt">
        <div className="he-column-layout">
          {popup === 'struktúra' && <>
            <button className={`fort-fok-btn he-picker-btn-wide ${!páncél.alap ? 'active' : ''}`} onClick={() => onUpdate({ alap: '', fémalapanyag: '' })}>— nincs —</button>
            {struktúrák.map(s => (
              <button key={s.struktúra} className={`fort-fok-btn he-picker-btn-wide ${páncél.alap === s.struktúra ? 'active' : ''}`} onClick={() => onUpdate({ alap: s.struktúra, fémalapanyag: '' })}>{s.struktúra}</button>
            ))}
          </>}
          {popup === 'fémalapanyag' && <>
            <button className={`fort-fok-btn he-picker-btn ${!páncél.fémalapanyag ? 'active' : ''}`} onClick={() => onUpdate({ fémalapanyag: '' })}>acél (alap)</button>
            {fémalapanyagok.map(a => (
              <button key={a.anyag} className={`fort-fok-btn he-picker-btn ${páncél.fémalapanyag === a.anyag ? 'active' : ''}`} onClick={() => onUpdate({ fémalapanyag: a.anyag })}>{a.anyag}</button>
            ))}
          </>}
          {popup === 'kidolgozottság' && ['pocsék', 'átlagos', 'mestermunka'].map(v => (
            <button key={v} className={`fort-fok-btn he-picker-btn ${páncél.kidolgozottság === v ? 'active' : ''}`} onClick={() => onUpdate({ kidolgozottság: v })}>{v}</button>
          ))}
          {popup === 'méret' && ['passzol', 'nem passzol', 'borzalmas'].map(v => (
            <button key={v} className={`fort-fok-btn he-picker-btn-wide ${páncél.méret_illeszkedés === v ? 'active' : ''}`} onClick={() => onUpdate({ méret_illeszkedés: v })}>{v}</button>
          ))}
          {popup === 'végtagvédettség' && (
            <div className="fort-fok-radios">
              {[0, 1, 2, 3, 4].map(n => <button key={n} className={`fort-fok-btn ${páncél.végtagvédettség === n ? 'active' : ''}`} onClick={() => onUpdate({ végtagvédettség: n })}>{n}</button>)}
            </div>
          )}
          {popup === 'rongálódás' && (
            <div className="fort-fok-radios">
              {[0, 1, 2, 3, 4, 5].map(n => <button key={n} className={`fort-fok-btn ${páncél.rongálódás === n ? 'active' : ''}`} onClick={() => onUpdate({ rongálódás: n })}>{n}</button>)}
            </div>
          )}
          {popup === 'merevvért' && (
            <div className="fort-fok-radios">
              {[0, 1, 2, 3].map(n => <button key={n} className={`fort-fok-btn ${merevvertFok === n ? 'active' : ''}`} onClick={() => onMerevvert(n)}>{n}</button>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
