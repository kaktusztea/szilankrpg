import { Ikon } from '../common/Ikon';
import { useState, useEffect, useCallback } from 'react';
import type { SebzésRubrika } from '../../engine/types';
import { buildRubrikák, toSebzések, applySeb, applyGyógy } from '../../engine/harc/ep-logic';
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
  onSebzésekChange: (sebzések: SebzésRubrika[], leírás: string) => void;
  gameMode?: boolean;
}

export function EpTable({ ÉP, kategóriák, onSebCountChange, ftEnyhítés = 0, téLevonások, onNavigate, sebzések, onSebzésekChange, gameMode }: Props) {
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
    const label = típus === 'FP' ? `Sebesülés: ${érték} FP` : `Sebesülés: ${érték} ÉP (${típus})`;
    onSebzésekChange(toSebzések(applySeb(rubrikák, típus, érték)), label);
    setShowSebDialog(false);
  }

  function gyógyulás(típusSzűrő: 'FP' | 'ÉP', érték: number) {
    const label = típusSzűrő === 'FP' ? `Gyógyulás: ${érték} FP` : `Gyógyulás: ${érték} ÉP`;
    onSebzésekChange(toSebzések(applyGyógy(rubrikák, típusSzűrő, érték)), label);
    setShowGyógyDialog(false);
  }

  function reset() {
    onSebzésekChange([], 'ÉP reset');
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
        <button className="btn-reset" title="ÉP reset" aria-label="ÉP reset" disabled={!gameMode || kitöltött === 0} onClick={() => setShowResetConfirm(true)}><Ikon név="reset" /></button>
        <button className="btn-seb" disabled={!gameMode || (kitöltött === összRubrika && rubrikák.every(r => r.típus !== 'FP'))} onClick={() => setShowSebDialog(true)}><Ikon név="manőver" /> Seb</button>
        <button className="btn-heal" disabled={!gameMode || kitöltött === 0} onClick={() => setShowGyógyDialog(true)}><Ikon név="gyógy" /> Gyógy</button>
      </div>

      <div className="ep-grid">
        {[0, 1, 2, 3].map(oszlop => (
          <div key={oszlop} className="ep-column">
            <div className="ep-col-header">S{oszlop + 1}</div>
            {Array.from({ length: oszlopMéret }, (_, sor) => {
              const idx = oszlop * oszlopMéret + sor;
              const r = rubrikák[idx];
              const hue = r.sorszám ? (r.sorszám * 17) % 30 : 0;
              const bgColor = r.típus === 'FP' ? `hsl(280, 28%, ${32 + (r.sorszám * 5) % 12}%)`
                            : r.típus ? `hsl(${hue}, 42%, ${33 + (r.sorszám * 3) % 10}%)`
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
          {/* Title + what happens + quiet danger confirm (same look as the VÉ visszaállítás); cancel = tap outside / Escape */}
          <div className="kep-prompt ep-reset-confirm" onClick={e => e.stopPropagation()}>
            <label className="kep-prompt-label-bold">Sebek törlése</label>
            <span className="overlay-desc-dim">Mind a {kitöltött} kitöltött rubrika kiürül. A visszavonás listából visszahozható.</span>
            <button className="btn-halvany-veszely ep-reset-confirm-btn" onClick={reset}><Ikon név="reset" />Törlés</button>
          </div>
        </DialogPortal>
      )}
    </div>
  );
}
