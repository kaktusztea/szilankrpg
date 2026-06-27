/**
 * HarcCalc — re-exports from modularized files.
 * Kept for backward compatibility of existing imports.
 */

export type { FegyverResult, HarcComputed } from './types';
export { calcTaktikaMods } from './taktika-calc';
export { buildPancelLookups, calcFogas as calcFogás, calcFtEnyhites as calcFtEnyhítés } from './pancel-calc';
export { buildFegyverRows, calcFegyverResults, applyFegyverOverrides, calcKetkezes as calcKétkezes } from './fegyver-calc';
export { calcFortelyMods } from '../../engine/fortely-mods';
