import type { SebzésRubrika } from '../../engine/types';

export type SebTípus = 'S' | 'V' | 'Z' | 'FP' | '';

export const SEB_TÍPUSOK: SebTípus[] = ['S', 'V', 'Z', 'FP'];
export const SEB_ALAP_MAX = 15;
export const SEB_BŐVÍTETT_MAX = 40;

export interface Rubrika {
  típus: SebTípus;
  sorszám: number;
}

export function buildRubrikák(sebzések: SebzésRubrika[], összRubrika: number): Rubrika[] {
  const rubrikák: Rubrika[] = Array.from({ length: összRubrika }, () => ({ típus: '', sorszám: 0 }));
  for (let i = 0; i < sebzések.length && i < összRubrika; i++) {
    rubrikák[i] = { típus: sebzések[i].típus, sorszám: sebzések[i].sorszám };
  }
  return rubrikák;
}

export function toSebzések(rubrikák: Rubrika[]): SebzésRubrika[] {
  return rubrikák
    .filter(r => r.típus !== '')
    .map(r => ({ típus: r.típus as SebzésRubrika['típus'], sorszám: r.sorszám }));
}

export function getNextSorszám(rubrikák: Rubrika[]): number {
  const used = new Set(rubrikák.filter(r => r.típus !== '').map(r => r.sorszám));
  for (let i = 1; ; i++) { if (!used.has(i)) return i; }
}

export function applySeb(rubrikák: Rubrika[], típus: SebTípus, érték: number): Rubrika[] {
  const result = [...rubrikák];
  const sorszám = getNextSorszám(result);
  let maradék = érték;
  if (típus !== 'FP') {
    for (let i = 0; i < result.length && maradék > 0; i++) {
      if (result[i].típus === 'FP') { result[i] = { típus, sorszám }; maradék--; }
    }
  }
  for (let i = 0; i < result.length && maradék > 0; i++) {
    if (result[i].típus === '') { result[i] = { típus, sorszám }; maradék--; }
  }
  return result;
}

export function applyGyógy(rubrikák: Rubrika[], típusSzűrő: 'FP' | 'ÉP', érték: number): Rubrika[] {
  const result = [...rubrikák];
  let maradék = érték;
  for (let i = result.length - 1; i >= 0 && maradék > 0; i--) {
    if (típusSzűrő === 'FP' && result[i].típus === 'FP') { result[i] = { típus: '', sorszám: 0 }; maradék--; }
    else if (típusSzűrő === 'ÉP' && result[i].típus !== '' && result[i].típus !== 'FP') { result[i] = { típus: '', sorszám: 0 }; maradék--; }
  }
  // Compaction
  const filled = result.filter(r => r.típus !== '');
  for (let i = 0; i < result.length; i++) {
    result[i] = i < filled.length ? filled[i] : { típus: '', sorszám: 0 };
  }
  return result;
}

/** Kiszámolja a Sérült státusz fokát a kitöltött rubrikák alapján. */
export function calcSérültFok(sebCount: number, oszlopMéret: number): number {
  if (sebCount > 3 * oszlopMéret) return 2;
  if (sebCount > 2 * oszlopMéret) return 1;
  return 0;
}
