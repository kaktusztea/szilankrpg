import { useState } from 'react';
import type { Fortely } from '../../engine/types';
import type { FortelySummary } from '../../engine/data-loader';
import { OverlayPortal } from '../overlays/OverlayPortal';
import { EGYEDI_FORTELY_SENTINEL } from '../../ui-constants';
import { isFreeTextPicker, RUNTIME_PICKER_TYPES } from '../SpecPicker';
import { MAX_AZONOS_FORTÉLY } from '../../ui-constants';

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

  function handlePick(név: string) {
    onClose();
    onAdd(név);
  }

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="fort-picker-popup" onClick={e => e.stopPropagation()}>
        <div className="fort-picker-header">
          <label>+ Új fortély</label>
          <button type="button" className="aktiv-picker-close" aria-label="Bezárás" onClick={onClose}>✕</button>
        </div>
        <div className="fort-picker-list">
          {available.map(d => {
            const disabled = isOptionDisabled(d, fortélyok, fegyverNevek, nyelvtanulásSzint);
            const suffix = buildSuffix(d, csoport, slotok, tsz, fortélyok, nyelvtanulásSzint);
            const desc = getDescription(d);
            const isExpanded = expandedNév === d.név;
            const hatásLines = getHatásLines(d);

            return (
              <div key={d.név} className={`fort-picker-item-wrap${disabled ? ' fort-picker-disabled' : ''}`}>
                <div className="fort-picker-item-top" onClick={() => !disabled && handlePick(d.név)}>
                  <span className="fort-picker-item-name">
                    {d.név} <span className="fort-picker-item-maxfok">({d.maxfok})</span>
                    {suffix && <span className="fort-picker-item-suffix">{suffix}</span>}
                  </span>
                  {(desc || hatásLines.length > 0) && (
                    <button
                      className={`fort-picker-dot${isExpanded ? ' fort-picker-dot-active' : ''}`}
                      onClick={e => { e.stopPropagation(); setExpandedNév(isExpanded ? null : d.név); }}
                      aria-label="Részletek"
                    >●</button>
                  )}
                </div>
                {isExpanded && (
                  <div className="fort-picker-details" onClick={() => setExpandedNév(null)}>
                    {desc && <div className="fort-picker-details-desc">{desc}</div>}
                    {hatásLines.map((line, i) => (
                      <div key={i} className="fort-picker-details-line">
                        {line.prefix && <span className="fort-picker-details-fok">{line.prefix}</span>}
                        {line.prefix ? ' ' : ''}{line.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {csoport === 'szabad' && (
            <div className="fort-picker-item-wrap">
              <div className="fort-picker-item-top" onClick={() => handlePick(EGYEDI_FORTELY_SENTINEL)}>
                <div className="fort-picker-item-content">
                  <span className="fort-picker-item-name">⭐ Egyedi fortély</span>
                  <span className="fort-picker-item-desc">Saját, egyedi fortély létrehozása</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </OverlayPortal>
  );
}

/** Short description: leírás, or first hatás text as fallback */
function getDescription(d: FortelySummary): string {
  if (d.leírás) return d.leírás;
  const firstFok = d.fokok.find(f => f.fok >= 1) ?? d.fokok[0];
  if (firstFok?.hatás?.[0]) return firstFok.hatás[0];
  return '';
}

/** Build detailed hatás lines for accordion (per fok) */
function getHatásLines(d: FortelySummary): { prefix: string; text: string }[] {
  const lines: { prefix: string; text: string }[] = [];
  for (const fokDef of d.fokok) {
    if (fokDef.fok === 0) continue; // skip alapeset
    if (!fokDef.hatás?.length) continue;
    const prefix = d.maxfok > 1 ? `${fokDef.fok}. fok:` : '';
    lines.push({ prefix, text: fokDef.hatás.join(' ') });
  }
  return lines;
}

function buildSuffix(
  d: FortelySummary,
  csoport: string,
  slotok: Fortely[],
  tsz: number,
  fortélyok: Fortely[],
  nyelvtanulásSzint: number,
): string {
  const parts: string[] = [];

  if (csoport === 'szabad') {
    const nonKierdemelt = slotok.filter(s => !s.kiérdemelt).length;
    const maradtIngyenes = Math.max(0, tsz - nonKierdemelt);
    if (maradtIngyenes > 0) parts.push(`●${maradtIngyenes}`);
  } else if (d.ingyenes_perszint > 0) {
    const ingyenesDb = Math.floor((tsz + 1) / d.ingyenes_perszint);
    const felvettDb = fortélyok.filter(f => f.név === d.név && !f.kiérdemelt).length;
    const maradtIngyenes = Math.max(0, ingyenesDb - felvettDb);
    if (maradtIngyenes > 0) parts.push(`●${maradtIngyenes}`);
  } else if (d.kp_perfok < 0) {
    const vals = Array.from({ length: d.maxfok }, (_, i) => Math.abs(d.kp_perfok) * (i + 1));
    parts.push(`🎁${vals.join('-')}KP`);
  }

  if (d.név === 'Nyelvismeret') {
    const keret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
    const used = fortélyok.filter(f => f.név === 'Nyelvismeret' && !f.kiérdemelt).reduce((s, f) => s + f.fok, 0)
      + fortélyok.filter(f => f.név === 'Nyelvismeret' && f.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
    const maradt = keret - used;
    if (maradt > 0) parts.push(`●${maradt}`);
  }

  return parts.join(' ');
}

function isOptionDisabled(
  d: FortelySummary,
  fortélyok: Fortely[],
  fegyverNevek: string[],
  nyelvtanulásSzint: number,
): boolean {
  if (isFreeTextPicker(d, RUNTIME_PICKER_TYPES) && fortélyok.filter(f => f.név === d.név).length >= MAX_AZONOS_FORTÉLY) return true;
  if (d.többszörös_típus === 'fegyver') {
    return fegyverNevek.length === 0 || fegyverNevek.every(n => fortélyok.some(f => f.név === d.név && f.spec_elem === n));
  }
  if (d.név === 'Nyelvismeret') {
    const keret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
    const used = fortélyok.filter(f => f.név === 'Nyelvismeret' && !f.kiérdemelt).reduce((s, f) => s + f.fok, 0)
      + fortélyok.filter(f => f.név === 'Nyelvismeret' && f.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
    return keret - used <= 0;
  }
  return false;
}
