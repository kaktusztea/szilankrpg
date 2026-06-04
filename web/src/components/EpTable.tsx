import { useState, useEffect } from 'react';
import './EpTable.css';

type SebTípus = 'S' | 'V' | 'Z' | 'FP' | '';

interface Rubrika {
  típus: SebTípus;
  sorszám: number;
}

interface Props {
  ÉP: number;
  onSebCountChange?: (count: number) => void;
}

export function EpTable({ ÉP, onSebCountChange }: Props) {
  const oszlopMéret = ÉP / 4;
  const összRubrika = ÉP;
  const [rubrikák, setRubrikák] = useState<Rubrika[]>(
    Array.from({ length: összRubrika }, () => ({ típus: '', sorszám: 0 }))
  );
  const [sebSorszám, setSebSorszám] = useState(0);
  const [showSebDialog, setShowSebDialog] = useState(false);
  const [showGyógyDialog, setShowGyógyDialog] = useState(false);

  function sebesülés(típus: SebTípus, érték: number) {
    const újSorszám = sebSorszám + 1;
    setSebSorszám(újSorszám);
    const újRubrikák = [...rubrikák];
    let maradék = érték;

    if (típus !== 'FP') {
      // ÉP seb: először felülírja a meglévő FP rubrikákat (fentről lefelé)
      for (let i = 0; i < újRubrikák.length && maradék > 0; i++) {
        if (újRubrikák[i].típus === 'FP') {
          újRubrikák[i] = { típus, sorszám: újSorszám };
          maradék--;
        }
      }
    }

    // Maradék üres rubrikákat tölt
    for (let i = 0; i < újRubrikák.length && maradék > 0; i++) {
      if (újRubrikák[i].típus === '') {
        újRubrikák[i] = { típus, sorszám: újSorszám };
        maradék--;
      }
    }
    setRubrikák(újRubrikák);
    setShowSebDialog(false);
  }

  function gyógyulás(típusSzűrő: 'FP' | 'ÉP', érték: number) {
    const újRubrikák = [...rubrikák];
    let maradék = érték;
    // Hátulról előre töröljük
    for (let i = újRubrikák.length - 1; i >= 0 && maradék > 0; i--) {
      if (típusSzűrő === 'FP' && újRubrikák[i].típus === 'FP') {
        újRubrikák[i] = { típus: '', sorszám: 0 };
        maradék--;
      } else if (típusSzűrő === 'ÉP' && újRubrikák[i].típus !== '' && újRubrikák[i].típus !== 'FP') {
        újRubrikák[i] = { típus: '', sorszám: 0 };
        maradék--;
      }
    }
    setRubrikák(újRubrikák);
    setShowGyógyDialog(false);
  }

  function reset() {
    setRubrikák(Array.from({ length: összRubrika }, () => ({ típus: '', sorszám: 0 })));
    setSebSorszám(0);
  }

  // Aktuális sebesülés kategória
  const kitöltött = rubrikák.filter(r => r.típus !== '').length;
  const aktKategória = kitöltött === 0 ? 1 : Math.min(4, Math.ceil(kitöltött / oszlopMéret));
  const téLevonások = ['TÉ: 0', 'TÉ: -3', 'TÉ: -6', 'TÉ: -9'];

  useEffect(() => {
    onSebCountChange?.(kitöltött);
  }, [kitöltött, onSebCountChange]);

  return (
    <div className="ep-table-wrapper">
      <div className="ep-table-header">
        <span><strong>ÉP: {ÉP}</strong></span>
        <span>Seb: {kitöltött}/{ÉP}</span>
      </div>

      <div className="ep-grid">
        {[0, 1, 2, 3].map(oszlop => (
          <div key={oszlop} className="ep-column">
            <div className="ep-col-header">S{oszlop + 1}</div>
            {Array.from({ length: oszlopMéret }, (_, sor) => {
              const idx = oszlop * oszlopMéret + sor;
              const r = rubrikák[idx];
              const hue = r.sorszám ? (r.sorszám * 17) % 30 : 0; // 0-30 tartomány (piros-narancs)
              const bgColor = r.típus === 'FP' ? `hsl(280, 50%, ${35 + (r.sorszám * 5) % 15}%)` 
                            : r.típus ? `hsl(${hue}, 70%, ${35 + (r.sorszám * 3) % 10}%)`
                            : '';
              return (
                <div key={sor} className={`ep-cell ${r.típus ? 'filled' : ''}`} style={bgColor ? { background: bgColor } : undefined}>
                  {r.típus ? `${r.típus}${r.sorszám}` : ''}
                </div>
              );
            })}
            <div className={`ep-col-footer ${aktKategória === oszlop + 1 ? 'active-cat' : ''}`}>{téLevonások[oszlop]}</div>
          </div>
        ))}
      </div>

      <div className="ep-buttons">
        <button className="btn-seb" onClick={() => setShowSebDialog(true)}>⚔️ Sebesülés</button>
        <button className="btn-heal" disabled={kitöltött === 0} onClick={() => setShowGyógyDialog(true)}>💚 Gyógyulás</button>
        <button className="btn-reset" onClick={reset}>⟲</button>
      </div>

      {showSebDialog && <SebDialog onConfirm={sebesülés} onCancel={() => setShowSebDialog(false)} />}
      {showGyógyDialog && <GyógyDialog
        maxÉP={rubrikák.filter(r => r.típus !== '' && r.típus !== 'FP').length}
        maxFP={rubrikák.filter(r => r.típus === 'FP').length}
        onConfirm={gyógyulás}
        onCancel={() => setShowGyógyDialog(false)}
      />}
    </div>
  );
}

function SebDialog({ onConfirm, onCancel }: { onConfirm: (t: SebTípus, v: number) => void; onCancel: () => void }) {
  const [típus, setTípus] = useState<SebTípus>('S');
  const [érték, setÉrték] = useState(3);

  return (
    <div className="ep-dialog">
      <h4>Sebesülés</h4>
      <div className="ep-dialog-row">
        <label>Típus:</label>
        {(['S', 'V', 'Z', 'FP'] as SebTípus[]).map(t => (
          <button key={t} className={típus === t ? 'active' : ''} onClick={() => setTípus(t)}>{t}</button>
        ))}
      </div>
      <div className="ep-dialog-row">
        <label>Érték:</label>
        <input type="number" min={1} max={40} value={érték} onChange={e => setÉrték(Number(e.target.value))} />
      </div>
      <div className="ep-dialog-row">
        <button className="btn-confirm" onClick={() => onConfirm(típus, érték)}>OK</button>
        <button onClick={onCancel}>Mégse</button>
      </div>
    </div>
  );
}

function GyógyDialog({ maxÉP, maxFP, onConfirm, onCancel }: { maxÉP: number; maxFP: number; onConfirm: (t: 'FP' | 'ÉP', v: number) => void; onCancel: () => void }) {
  const defaultTípus = maxÉP > 0 ? 'ÉP' : 'FP';
  const [típus, setTípus] = useState<'FP' | 'ÉP'>(defaultTípus);
  const [érték, setÉrték] = useState(1);
  const max = típus === 'ÉP' ? maxÉP : maxFP;

  return (
    <div className="ep-dialog">
      <h4>Gyógyulás</h4>
      <div className="ep-dialog-row">
        <label>Mit:</label>
        <button disabled={maxÉP === 0} className={típus === 'ÉP' ? 'active' : ''} onClick={() => { setTípus('ÉP'); setÉrték(1); }}>ÉP ({maxÉP})</button>
        <button disabled={maxFP === 0} className={típus === 'FP' ? 'active' : ''} onClick={() => { setTípus('FP'); setÉrték(1); }}>FP ({maxFP})</button>
      </div>
      <div className="ep-dialog-row">
        <label>Mennyit:</label>
        <input type="number" min={1} max={max} value={Math.min(érték, max)} onChange={e => setÉrték(Math.min(Number(e.target.value), max))} />
        <span className="dim">/ {max}</span>
      </div>
      <div className="ep-dialog-row">
        <button className="btn-confirm" onClick={() => onConfirm(típus, érték)}>OK</button>
        <button onClick={onCancel}>Mégse</button>
      </div>
    </div>
  );
}
