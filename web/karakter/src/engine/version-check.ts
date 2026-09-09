import { APP_VERSION } from '../version';

/**
 * Elavult HTML felismerése és gyógyítása.
 *
 * A GitHub Pages `Cache-Control: max-age=600`-at ad az `index.html`-re, és ez nem
 * konfigurálható. Ha a böngésző cache-elt HTML-t szolgál ki, az a RÉGI (hash-elt nevű)
 * JS bundle-t tölti be — az app régi verziója fut, holott új van kint. Ezt úgy vesszük
 * észre, hogy a szerver `metadata.json`-jának verzióját (no-store kéréssel) a bundle-be
 * sütött verzióhoz mérjük, és eltérés esetén egyszeri, cache-kerülő újratöltést kérünk.
 */

/** sessionStorage kulcs: melyik verzióra töltöttünk már újra (loop védelem). */
const RELOAD_KEY = 'szilank_reload_version';
/** Ennyi ideig várunk a verzió-ellenőrzésre; utána mountolunk (offline/lassú háló). */
const CHECK_TIMEOUT_MS = 1000;

/**
 * Kell-e újratölteni? Tiszta döntési logika (a hálózat és a location a hívóban van).
 * Csak akkor, ha a szerver verziója ismert, eltér a futótól, és erre a verzióra még
 * nem próbáltunk újratölteni ebben a böngésző-fülben.
 */
export function shouldReload(
  serverVersion: string | undefined,
  appVersion: string,
  lastTriedVersion: string | null,
): boolean {
  if (!serverVersion || serverVersion === appVersion) return false;
  return lastTriedVersion !== serverVersion;
}

/** Az újratöltés cél URL-je: cache-kerülő `?v=`, a `#hash` (megosztott karakter) megőrzésével. */
export function buildReloadUrl(
  loc: { origin: string; pathname: string; hash: string },
  version: string,
): string {
  return `${loc.origin}${loc.pathname}?v=${encodeURIComponent(version)}${loc.hash}`;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>(resolve => setTimeout(() => resolve(null), ms))]);
}

/** A `?v=` cache-buster eltávolítása a címsorból (a megosztott linkek maradjanak tiszták). */
export function cleanVersionParam(): void {
  if (!window.location.search) return;
  history.replaceState(null, '', window.location.pathname + window.location.hash);
}

/**
 * Verzió-ellenőrzés indításkor. `true`, ha újratöltés indult — ilyenkor a hívó NE
 * mountolja az appot (különben az URL-es karakter import kétszer futna le).
 * Hálózati hiba, timeout vagy tiltott sessionStorage esetén csendben `false`.
 */
export async function reloadIfStale(): Promise<boolean> {
  try {
    const res = await withTimeout(
      fetch(`${import.meta.env.BASE_URL}metadata.json`, { cache: 'no-store' }),
      CHECK_TIMEOUT_MS,
    );
    if (!res?.ok) return false;

    const { version } = await res.json() as { version?: string };
    let lastTried: string | null = null;
    try { lastTried = sessionStorage.getItem(RELOAD_KEY); } catch { /* privát mód */ }

    if (!shouldReload(version, APP_VERSION, lastTried)) {
      cleanVersionParam();
      return false;
    }

    try { sessionStorage.setItem(RELOAD_KEY, version!); } catch { /* privát mód */ }
    window.location.replace(buildReloadUrl(window.location, version!));
    return true;
  } catch {
    return false;
  }
}
