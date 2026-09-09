/**
 * A build-time besütött app verzió (`ÉV.ÉVNAPJA.napibuild`, lásd scripts/generate_metadata.py).
 * A `__APP_VERSION__` egy Vite `define`, ami teszt környezetben nincs beállítva — ezért a fallback.
 */
export const APP_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
