import type { GameData } from '../../engine/data-loader';
import { képzettségSzint, képzettségNév, TÁVOLSÁGI_HARCMODOR_ID } from '../../engine/azonosito';
import type { Karakter } from '../../engine/types';

// Távharc Mesterfegyver logika (fok + követelmény-ellenőrzés/-szöveg).
// Kiemelve a tavharc/helpers.ts-ből (2026-09-30 refaktor, modularizáció).
// Megj.: a harcertekek/helpers.ts-nek külön getMfFok-ja van (más szignatúra) - szándékosan nem összevonva.

export function getMfFok(k: Karakter, alap: string): number {
  return k.fortélyok.find(f => f.id === 'mesterfegyver' && f.elem === alap)?.fok ?? 0;
}

export function mfKövetelményHiba(k: Karakter, data: GameData, alap: string): boolean {
  const fok = getMfFok(k, alap);
  if (fok === 0) return false;
  const fokDef = data.fortelySummaries.find(d => d.id === 'mesterfegyver')?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return false;
  const harcmodor = data.tavfegyverek.find(tf => tf.név.toLowerCase() === alap.toLowerCase())?.harcmodor;
  for (const kov of fokDef.követelmények) {
    if (kov.típus === 'képzettség') {
      const refek = harcmodor ? [`${TÁVOLSÁGI_HARCMODOR_ID}/${harcmodor.toLowerCase()}`] : (Array.isArray(kov.név) ? kov.név : [kov.név]);
      if (!refek.some(r => képzettségSzint(k.képzettségek, r) >= kov.érték)) return true;
    }
  }
  return false;
}

export function mfKövetelményText(k: Karakter, data: GameData, alap: string): string {
  const fok = getMfFok(k, alap);
  if (fok === 0) return '';
  const fokDef = data.fortelySummaries.find(d => d.id === 'mesterfegyver')?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return '';
  const harcmodor = data.tavfegyverek.find(tf => tf.név.toLowerCase() === alap.toLowerCase())?.harcmodor;
  const kov = fokDef.követelmények[0];
  if (kov.típus !== 'képzettség') return '';
  const név = harcmodor ?? (Array.isArray(kov.név) ? kov.név : [kov.név]).map(r => képzettségNév(r, data)).join(' / ');
  return `⚠ ${név} ≥ ${kov.érték}`;
}
