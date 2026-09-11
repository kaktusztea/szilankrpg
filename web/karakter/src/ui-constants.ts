/** UI layout constants (not game-rule values — those live in konstansok.yaml) */

export const MAX_FORTÉLY_FOK = 3;
// ponytail: a konstansok.arányok.képzettség_max_szint (=15) UI-oldali másolata. A picker
// grid modul-szintű konstanst vár, a data layer async töltődik → nem köthető be triviálisan.
// Ceiling: ha a yaml értéke változik, ezt kézzel kell követni. Upgrade: data-driven grid.
export const MAX_KÉPZETTSÉG_SZINT = 15;
export const SZINT_VALUES = Array.from({ length: MAX_KÉPZETTSÉG_SZINT }, (_, i) => i + 1);
export const MAX_KARAKTER_DB = 16;
export const MAX_NÉV = 40;
export const MAX_BECENÉV = 12;
/** Max tárolt NJK (jk === false) karakter — az NJK switcher sáv is ennyit mutat. */
export const MAX_NJK_DB = 10;
export const MAX_TÁVOLSÁG_MÉTER = 500;
export const MAX_KOR = 2000;
export const DEFAULT_KOR = 25;
export const UNDO_MAX = 6;
export const HINT_DURATION_MS = 2000;
export const TOAST_DURATION_MS = 2500;
export const FEEDBACK_TIMEOUT_MS = 8000;
export const VÉ_FLASH_MS = 1000;
export const MAX_FEGYVER_DARAB = 10;
export const MAX_AZONOS_HÁTTÉR = 10;
export const MAX_AZONOS_FORTÉLY = 10;
export const MAX_AZONOS_KÉPZETTSÉG = 10;
export const MAX_CHECKPOINTS = 20;
export const MAX_CHECKPOINT_NÉV = 20;
export const MAX_FREETEXT_NÉV = 30;
export const MAX_ELOTORTENET_MEZŐ = 200;
export const EGYEDI_FORTELY_SENTINEL = '__egyedi__';
export const MAX_EGYEDI_FORTELY_NÉV = 20;
export const DELETE_BTN_TAP_ZONE_PX = 25;
export const PRÓBA_IMMUNITÁS_KÜSZÖB = 999;
