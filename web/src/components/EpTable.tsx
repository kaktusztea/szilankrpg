import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './EpTable.css';

type SebTípus = 'S' | 'V' | 'Z' | 'FP' | '';

interface Rubrika {
  típus: SebTípus;
  sorszám: number;
}

interface Props {
  ÉP: number;
  onSebCountChange?: (count: number) => void;
  ftEnyhítés?: number;
  onNavigate?: () => void;
}

export function EpTable({ ÉP, onSebCountChange, ftEnyhítés = 0, onNavigate }: Props) {
  const oszlopMéret = ÉP / 4;
  const összRubrika = ÉP;
  const lastTapFooter = useRef(0);
  const [rubrikák, setRubrikák] = useState<Rubrika[]>(
    Array.from({ length: összRubrika }, () => ({ típus: '', sorszám: 0 }))
  );

  function getNextSorszám(currentRubrikák: Rubrika[]): number {
    // Keressük a legkisebb pozitív egész számot ami nincs használatban
    const usedSorszámok = new Set(currentRubrikák.filter(r => r.típus !== '').map(r => r.sorszám));
    for (let i = 1; ; i++) {
      if (!usedSorszámok.has(i)) return i;
    }
  }
  const [showSebDialog, setShowSebDialog] = useState(false);
  const [showGyógyDialog, setShowGyógyDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!showSebDialog && !showGyógyDialog && !showResetConfirm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setShowSebDialog(false); setShowGyógyDialog(false); setShowResetConfirm(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showSebDialog, showGyógyDialog, showResetConfirm]);

  function sebesülés(típus: SebTípus, érték: number) {
    const újRubrikák = [...rubrikák];
    const újSorszám = getNextSorszám(újRubrikák);
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
    // Hátulról előre töröljük a megadott típusú rubrikákat
    for (let i = újRubrikák.length - 1; i >= 0 && maradék > 0; i--) {
      if (típusSzűrő === 'FP' && újRubrikák[i].típus === 'FP') {
        újRubrikák[i] = { típus: '', sorszám: 0 };
        maradék--;
      } else if (típusSzűrő === 'ÉP' && újRubrikák[i].típus !== '' && újRubrikák[i].típus !== 'FP') {
        újRubrikák[i] = { típus: '', sorszám: 0 };
        maradék--;
      }
    }
    // Compaction: kitöltött rubrikák tömörítése felülre (üres lyukak eltüntetése)
    const filled = újRubrikák.filter(r => r.típus !== '');
    for (let i = 0; i < újRubrikák.length; i++) {
      újRubrikák[i] = i < filled.length ? filled[i] : { típus: '', sorszám: 0 };
    }
    setRubrikák(újRubrikák);
    setShowGyógyDialog(false);
  }

  function reset() {
    setRubrikák(Array.from({ length: összRubrika }, () => ({ típus: '', sorszám: 0 })));
  }

  // Aktuális sebesülés kategória
  const kitöltött = rubrikák.filter(r => r.típus !== '').length;
  const aktKategória = kitöltött === 0 ? 1 : Math.min(4, Math.ceil(kitöltött / oszlopMéret));
  const téLevonások = [0, -3, -6, -9].map(v => v === 0 ? 'TÉ: 0' : `TÉ: ${Math.min(0, v + ftEnyhítés)}`);

  useEffect(() => {
    onSebCountChange?.(kitöltött);
  }, [kitöltött, onSebCountChange]);

  return (
    <div className="ep-table-wrapper">
      <div className="ep-table-header">
        <span><strong>ÉP: {ÉP}({ÉP - kitöltött})</strong></span>
        <button className="btn-reset" style={{ fontSize: '15px' }} disabled={kitöltött === 0} onClick={() => setShowResetConfirm(true)}>⟲</button>
        <button className="btn-seb" onClick={() => setShowSebDialog(true)}>⚔️ Seb</button>
        <button className="btn-heal" disabled={kitöltött === 0} onClick={() => setShowGyógyDialog(true)}>💚 Gyógy</button>
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
            <div className={`ep-col-footer ${aktKategória === oszlop + 1 ? 'active-cat' : ''}`} onClick={() => {
              if (!onNavigate) return;
              const now = Date.now();
              if (now - lastTapFooter.current < 350) { onNavigate(); lastTapFooter.current = 0; }
              else { lastTapFooter.current = now; }
            }}>{téLevonások[oszlop]}</div>
          </div>
        ))}
      </div>


      {showSebDialog && createPortal(
        <div className="kep-prompt-overlay">
          <SebDialog onConfirm={sebesülés} onCancel={() => setShowSebDialog(false)} />
        </div>,
        document.body
      )}
      {showGyógyDialog && createPortal(
        <div className="kep-prompt-overlay">
          <GyógyDialog
            maxÉP={rubrikák.filter(r => r.típus !== '' && r.típus !== 'FP').length}
            maxFP={rubrikák.filter(r => r.típus === 'FP').length}
            onConfirm={gyógyulás}
            onCancel={() => setShowGyógyDialog(false)}
          />
        </div>,
        document.body
      )}
      {showResetConfirm && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="btn-del-confirm" style={{ fontSize: '16px', padding: '6px 14px' }} onClick={() => { reset(); setShowResetConfirm(false); }}>ÉP Reset</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function SebDialog({ onConfirm, onCancel: _onCancel }: { onConfirm: (t: SebTípus, v: number) => void; onCancel: () => void }) {
  const [típus, setTípus] = useState<SebTípus | ''>('');
  const [érték, setÉrték] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (típus && érték) {
      onConfirm(típus as SebTípus, érték);
    }
  }, [típus, érték]);

  return (
    <div className="kep-prompt">
      <label>Sebesülés</label>
      <div className="ep-dialog-row">
        {(['S', 'V', 'Z', 'FP'] as SebTípus[]).map(t => (
          <button key={t} className={`fort-fok-btn ${típus === t ? 'active' : ''}`} onClick={() => setTípus(t)}>{t}</button>
        ))}
      </div>
      <div className="kep-szint-grid">
        {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
          <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => setÉrték(n)}>{n}</button>
        ))}
      </div>
      {!expanded && <div className="ep-expand-btn" onClick={() => setExpanded(true)}>▾</div>}
      {expanded && (
        <div className="kep-szint-grid">
          {Array.from({ length: 25 }, (_, i) => i + 16).map(n => (
            <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => setÉrték(n)}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function GyógyDialog({ maxÉP, maxFP, onConfirm, onCancel: _onCancel }: { maxÉP: number; maxFP: number; onConfirm: (t: 'FP' | 'ÉP', v: number) => void; onCancel: () => void }) {
  const autoType = maxÉP > 0 && maxFP === 0 ? 'ÉP' : maxFP > 0 && maxÉP === 0 ? 'FP' : '';
  const [típus, setTípus] = useState<'FP' | 'ÉP' | ''>(autoType);
  const [érték, setÉrték] = useState<number | null>(null);
  const max = típus === 'ÉP' ? maxÉP : típus === 'FP' ? maxFP : 0;

  useEffect(() => {
    if (típus && érték) {
      onConfirm(típus as 'FP' | 'ÉP', érték);
    }
  }, [típus, érték]);

  return (
    <div className="kep-prompt">
      <label>Gyógyulás</label>
      <div className="ep-dialog-row">
        <button disabled={maxÉP === 0} className={`fort-fok-btn ${típus === 'ÉP' ? 'active' : ''}`} onClick={() => { setTípus('ÉP'); setÉrték(null); }}>ÉP</button>
        <button disabled={maxFP === 0} className={`fort-fok-btn ${típus === 'FP' ? 'active' : ''}`} onClick={() => { setTípus('FP'); setÉrték(null); }}>FP</button>
      </div>
      {típus && (
        <div className="kep-szint-grid">
          {Array.from({ length: max }, (_, i) => i + 1).map(n => (
            <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => setÉrték(n)}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}
