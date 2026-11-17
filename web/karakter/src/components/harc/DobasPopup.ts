import type { TéDobás } from '../../engine/types';

const DOBAS_MAX = 3;

/** Push a new roll result onto the FIFO stack (max 3, newest first). */
export function pushDobás(prev: number[], eredmény: number): number[] {
  return [eredmény, ...prev].slice(0, DOBAS_MAX);
}

/** Push a new TÉ roll (with optional Sebzés SP) onto the FIFO stack (max 3, newest first). */
export function pushTéDobás(prev: TéDobás[], eredmény: TéDobás): TéDobás[] {
  return [eredmény, ...prev].slice(0, DOBAS_MAX);
}
