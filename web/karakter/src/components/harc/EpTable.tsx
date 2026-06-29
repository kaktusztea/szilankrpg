import { useState, useEffect, useCallback } from 'react';
import type { SebzésRubrika } from '../../engine/types';
import { buildRubrikák, toSebzések, applySeb, applyGyógy } from './ep-logic';
import { useEscapeClose } from '../../hooks/useEscapeClose';
import { SebDialog, GyógyDialog } from './EpDialogs';
import { DialogPortal } from './DialogPortal';
import './EpTable.css';

interface Props {
  ÉP: number;
  kategóriák: number;
  onSebCountChange?: (count: number) => void;
  ftEnyhítés?: number;
  téLevonások: number[];
  onNavigate?: () => void;
  sebzések: SebzésRubrika[];
  onSebzésekChange: (sebzések: SebzésRubrika[]) => void;
}

export function EpTable({ ÉP, kategóriák, onSebCountChange, ftEnyhítés = 0, téLevonások, onNavigate, sebzések, onSebzésekChange }: Props) {
  const oszlopMéret = ÉP / kategóriák;
  const összRubrika = ÉP;

  const rubrikák = buildRubrikák(sebzések, összRubrika);

  const [showSebDialog, setShowSebDialog] = useState(false);
  const [showGyógyDialog, setShowGyógyDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasPopup = showSebDialog || showGyógyDialog || showResetConfirm;
  const closeAll = useCallback(() => { setShowSebDialog(false); setShowGyógyDialog(false); setShowResetConfirm(false); }, []);
  useEscapeClose(hasPopup, closeAll);

  function sebesülés(típus: Parameters<typeof applySeb>[1], érték: number) {
    onSebzésekChange(toSebzések(applySeb(rubrikák, típus, érték)));
    setShowSebDialog(false);
  }

  function gyógyulás(típusSzűrő: 'FP' | 'ÉP', érték: number) {
    onSebzésekChange(toSebzések(applyGyógy(rubrikák, típusSzűrő, érték)));
    setShowGyógyDialog(false);
  }

  function reset() {
    onSebzésekChange([]);
    setShowResetConfirm(false);
  }

  const kitöltött = rubrikák.filter(r => r.típus !== '').length;
  const aktKategória = kitöltött === 0 ? 1 : Math.min(4, Math.ceil(kitöltött / oszlopMéret));
  const téLevonásLabels = téLevonások.map(v => v === 0 ? 'TÉ: 0' : `TÉ: ${Math.min(0, v + ftEnyhítés)}`);

  useEffect(() => {
    onSebCountChange?.(kitöltött);
  }, [kitöltött, onSebCountChange]);

  return (
    <div className="ep-table-wrapper">
      <div className="ep-table-header">
        <span><strong>ÉP: <span className="harc-monospace">{ÉP}({ÉP - kitöltött})</span></strong></span>
        <button className="btn-reset btn-reset-sm" disabled={kitöltött === 0} onClick={() => setShowResetConfirm(true)}>⟲</button>
        <button className="btn-seb" disabled={kitöltött === összRubrika && rubrikák.every(r => r.típus !== 'FP')} onClick={() => setShowSebDialog(true)}>⚔️ Seb</button>
        <button className="btn-heal" disabled={kitöltött === 0} onClick={() => setShowGyógyDialog(true)}>💚 Gyógy</button>
      </div>

      <div className="ep-grid">
        {[0, 1, 2, 3].map(oszlop => (
          <div key={oszlop} className="ep-column">
            <div className="ep-col-header">S{oszlop + 1}</div>
            {Array.from({ length: oszlopMéret }, (_, sor) => {
              const idx = oszlop * oszlopMéret + sor;
              const r = rubrikák[idx];
              const hue = r.sorszám ? (r.sorszám * 17) % 30 : 0;
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
              onNavigate();
            }}>{téLevonásLabels[oszlop]}</div>
          </div>
        ))}
      </div>

      {showSebDialog && (
        <DialogPortal onClose={() => setShowSebDialog(false)}>
          <SebDialog onConfirm={sebesülés} />
        </DialogPortal>
      )}
      {showGyógyDialog && (
        <DialogPortal onClose={() => setShowGyógyDialog(false)}>
          <GyógyDialog
            maxÉP={rubrikák.filter(r => r.típus !== '' && r.típus !== 'FP').length}
            maxFP={rubrikák.filter(r => r.típus === 'FP').length}
            onConfirm={gyógyulás}
          />
        </DialogPortal>
      )}
      {showResetConfirm && (
        <DialogPortal onClose={() => setShowResetConfirm(false)}>
          <div className="kep-prompt harc-confirm-center" onClick={e => e.stopPropagation()}>
            <button className="btn-del-confirm kep-prompt-btn-confirm" onClick={reset}>ÉP Reset</button>
          </div>
        </DialogPortal>
      )}
    </div>
  );
}
