import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { reloadIfStale } from './engine/version-check';

/**
 * Indulás: előbb megnézzük, nem elavult HTML-t szolgált-e ki a böngésző cache-e.
 * Ha igen, újratöltés indul — ilyenkor nem mountolunk, hogy az URL-es karakter
 * import ne fusson le kétszer (az két slotot hozna létre).
 */
async function start() {
  if (await reloadIfStale()) return;

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

start();
