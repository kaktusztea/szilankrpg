// ============================================================
// Szilánk webapp telepítési konfiguráció - FORK ESETÉN EZT ÍRD ÁT.
//
// Ha a repót forkolod és a SAJÁT GitHub Pages oldaladon hostolod,
// elég ezt az egy fájlt módosítanod. A share URL és a QR kód futásidőben
// a böngésző window.location-jéből épül, azokat nem kell állítani.
// ============================================================

/** GitHub felhasználónév (a fork tulajdonosa). */
export const GITHUB_USER = 'kaktusztea';

/** Repo neve - EGYBEN a GitHub Pages base path is (https://<user>.github.io/<REPO_NAME>/). */
export const REPO_NAME = 'szilankrpg';

/** Az az ág, amelyről a GitHub a md fájlokat / segédletet szolgálja ki. */
export const REPO_BRANCH = 'master';

// --- Származtatott értékek (ne ezeket írd át) ---

/** Vite base path (vezető + záró perjellel). */
export const BASE_PATH = `/${REPO_NAME}/`;

/** Repo gyökér a GitHubon, fájl-megtekintéshez (blob). Záró perjellel. */
export const REPO_BLOB_BASE = `https://github.com/${GITHUB_USER}/${REPO_NAME}/blob/${REPO_BRANCH}/`;

/** Repo gyökér a GitHubon, nyers fájl letöltéshez (raw). Záró perjellel. */
export const REPO_RAW_BASE = `https://github.com/${GITHUB_USER}/${REPO_NAME}/raw/${REPO_BRANCH}/`;
