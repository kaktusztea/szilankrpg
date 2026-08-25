import { useState } from 'react';
import type { Fortely } from '../../engine/types';
import type { FortelySummary } from '../../engine/data-loader';
import { OverlayPortal } from '../overlays/OverlayPortal';
import { FortelyDetails } from '../FortelyDetails';
import { MdLink } from '../MdLink';
import { EGYEDI_FORTELY_SENTINEL, MAX_AZONOS_FORTÉLY } from '../../ui-constants';
import { isFreeTextPicker, RUNTIME_PICKER_TYPES } from '../SpecPicker';

interface Props {
  available: FortelySummary[];
  csoport: string;
  slotok: Fortely[];
  tsz: number;
  fortélyok: Fortely[];
  fegyverNevek: string[];
  nyelvtanulásSzint: number;
  onAdd: (név: string) => void;
  onClose: () => void;
}

export function FortelyPickerOverlay({ available, csoport, slotok, tsz, fortélyok, fegyverNevek, nyelvtanulásSzint, onAdd, onClose }: Props) {
  const [expandedNév, setExpandedNév] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);

  function handlePick(név: string) {
    onClose();
    onAdd(név);
  }

  function toggleAll() {
    if (allExpanded) {
      setExpandedNév(null);
      setAllExpanded(false);
    } else {
      setAllExpanded(true);
    }
  }

  function toggleItem(név: string) {
    if (allExpanded) {
      // collapse all, then open only this one (if it was open → close all)
      setAllExpanded(false);
      setExpandedNév(null); // effectively closes all
    } else {
      setExpandedNév(prev => prev === név ? null : név);
    }
  }

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="fort-picker-popup" onClick={e => e.stopPropagation()}>
        <div className="fort-picker-header">
          <label>+ Új fortély</label>
          <button type="button" className={`fort-picker-expand-all${allExpanded ? ' fort-picker-dot-active' : ''}`} aria-label="Összes lenyitása" onClick={toggleAll}>▾</button>
          <button type="button" className="aktiv-picker-close" aria-label="Bezárás" onClick={onClose}>✕</button>
        </div>
        <div className="fort-picker-list">
          {available.map(d => {
            const disabled = isOptionDisabled(d, fortélyok, fegyverNevek, nyelvtanulásSzint);
            const suffix = buildSuffix(d, csoport, slotok, tsz, fortélyok, nyelvtanulásSzint);
            const hasDetails = !!(d.leírás || d.fokok.some(f => f.fok >= 1 && f.hatás?.length) || d.kiterjeszti_normál.length || d.kiterjeszti_erős.length);
            const isExpanded = expandedNév === d.név || (allExpanded && hasDetails);

            return (
              <div key={d.név} className={`fort-picker-item-wrap${disabled ? ' fort-picker-disabled' : ''}`}>
                <div className="fort-picker-item-top" onClick={() => !disabled && handlePick(d.név)}>
                  <span className="fort-picker-item-name">
                    {d.név} <span className="fort-picker-item-maxfok">({d.maxfok})</span>
                    {suffix && <span className="fort-picker-item-suffix">{suffix}</span>}
                  </span>
                  {d.md_fájl && <span className="md-link-wrap" onClick={e => e.stopPropagation()}><MdLink mdFájl={d.md_fájl} /></span>}
                  {hasDetails && (
                    <button
                      className={`fort-picker-dot${isExpanded ? ' fort-picker-dot-active' : ''}`}
                      onClick={e => { e.stopPropagation(); toggleItem(d.név); }}
                      aria-label="Részletek"
                    >▾</button>
                  )}
                </div>
                {isExpanded && (
                  <FortelyDetails def={d} />
                )}
              </div>
            );
          })}
          {csoport === 'szabad' && (
            <div className="fort-picker-item-wrap">
              <div className="fort-picker-item-top" onClick={() => handlePick(EGYEDI_FORTELY_SENTINEL)}>
                <span className="fort-picker-item-name">⭐ Egyedi fortély</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </OverlayPortal>
  );
}

// --- Pure helpers ---

function buildSuffix(
  d: FortelySummary, csoport: string, slotok: Fortely[],
  tsz: number, fortélyok: Fortely[], nyelvtanulásSzint: number,
): string {
  const parts: string[] = [];

  if (csoport === 'szabad') {
    const maradt = Math.max(0, tsz - slotok.filter(s => !s.kiérdemelt).length);
    if (maradt > 0) parts.push(`●${maradt}`);
  } else if (d.ingyenes_perszint > 0) {
    const ingyenesDb = Math.floor((tsz + 1) / d.ingyenes_perszint);
    const maradt = Math.max(0, ingyenesDb - fortélyok.filter(f => f.név === d.név && !f.kiérdemelt).length);
    if (maradt > 0) parts.push(`●${maradt}`);
  } else if (d.kp_perfok < 0) {
    parts.push(`🎁${Array.from({ length: d.maxfok }, (_, i) => Math.abs(d.kp_perfok) * (i + 1)).join('-')}KP`);
  }

  if (d.név === 'Nyelvismeret') {
    const maradt = calcNyelvMaradt(fortélyok, nyelvtanulásSzint);
    if (maradt > 0) parts.push(`●${maradt}`);
  }

  return parts.join(' ');
}

function calcNyelvMaradt(fortélyok: Fortely[], nyelvtanulásSzint: number): number {
  const keret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
  const used = fortélyok.filter(f => f.név === 'Nyelvismeret' && !f.kiérdemelt).reduce((s, f) => s + f.fok, 0)
    + fortélyok.filter(f => f.név === 'Nyelvismeret' && f.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
  return keret - used;
}

function isOptionDisabled(
  d: FortelySummary, fortélyok: Fortely[], fegyverNevek: string[], nyelvtanulásSzint: number,
): boolean {
  if (isFreeTextPicker(d, RUNTIME_PICKER_TYPES) && fortélyok.filter(f => f.név === d.név).length >= MAX_AZONOS_FORTÉLY) return true;
  if (d.többszörös_típus === 'fegyver') {
    return fegyverNevek.length === 0 || fegyverNevek.every(n => fortélyok.some(f => f.név === d.név && f.spec_elem === n));
  }
  if (d.név === 'Nyelvismeret') return calcNyelvMaradt(fortélyok, nyelvtanulásSzint) <= 0;
  return false;
}
