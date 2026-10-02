// ============================================================
// Szilánk webapp telepítési konfiguráció.
//
// GitHub Actions deploy esetén a user + repo nevet a futtatókörnyezet
// AUTOMATIKUSAN adja (GITHUB_REPOSITORY env) - fork esetén ehhez NEM kell
// semmit átírni. Az alábbi literálok a FALLBACK-ek lokális dev / kézi
// buildhez, ahol nincs env. A branch mindig innen jön (nem env-ből), mert a
// repo-linkeknek a md fájlok tartós ágára kell mutatniuk.
//
// A share URL és a QR kód futásidőben a böngésző window.location-jéből épül,
// azokat nem kell állítani.
// ============================================================

// GITHUB_REPOSITORY = "user/repo" (csak GitHub Actions build-időben; böngészőben
// nincs process, ezért a typeof guard). Ha hiányzik → literál fallback.
const envRepo =
  typeof process !== 'undefined' ? process.env?.GITHUB_REPOSITORY : undefined;
const [envUser, envName] = envRepo ? envRepo.split('/') : [];

/** GitHub felhasználónév (a fork tulajdonosa). Fallback, ha nincs GITHUB_REPOSITORY env. */
export const GITHUB_USER = envUser || 'kaktusztea';

/** Repo neve - EGYBEN a GitHub Pages base path is (https://<user>.github.io/<REPO_NAME>/).
 *  Fallback, ha nincs GITHUB_REPOSITORY env. */
export const REPO_NAME = envName || 'szilankrpg';

/** Az az ág, amelyről a GitHub a md fájlokat / segédletet szolgálja ki.
 *  Mindig innen (nem env-ből) - a repo-linkeknek a tartós ágra kell mutatniuk. */
export const REPO_BRANCH = 'master';

// --- Származtatott értékek (ne ezeket írd át) ---

/** Vite base path (vezető + záró perjellel). */
export const BASE_PATH = `/${REPO_NAME}/`;

/** Repo gyökér a GitHubon, fájl-megtekintéshez (blob). Záró perjellel. */
export const REPO_BLOB_BASE = `https://github.com/${GITHUB_USER}/${REPO_NAME}/blob/${REPO_BRANCH}/`;

/** Repo gyökér a GitHubon, nyers fájl letöltéshez (raw). Záró perjellel. */
export const REPO_RAW_BASE = `https://github.com/${GITHUB_USER}/${REPO_NAME}/raw/${REPO_BRANCH}/`;
