import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createReadStream, existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';

/** Check if generated tables are newer than all YAML sources (uses .generated_marker) */
function tablesAreFresh(dataDir: string): boolean {
  const marker = path.join(dataDir, 'tables', '.generated_marker');
  if (!existsSync(marker)) return false;
  const markerMtime = statSync(marker).mtimeMs;

  // Find newest YAML source mtime (recursive)
  const sourcesDir = path.join(dataDir, 'sources');
  function newestYaml(dir: string): number {
    let newest = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) newest = Math.max(newest, newestYaml(full));
      else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
        newest = Math.max(newest, statSync(full).mtimeMs);
    }
    return newest;
  }
  return markerMtime > newestYaml(sourcesDir);
}

function serveDataPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, '../../data');
  const generateScript = path.join(dataDir, 'generate_tables.py');
  const metadataScript = path.resolve(__dirname, 'scripts/generate_metadata.py');
  const metaPath = path.resolve(__dirname, 'public/metadata.json');

  return {
    name: 'serve-data',
    config() {
      // Generate tables + metadata BEFORE define is resolved — skip if already fresh
      if (existsSync(generateScript)) {
        if (tablesAreFresh(dataDir)) {
          console.log('[serve-data] Tables are fresh, skipping generation.');
        } else {
          console.log('[serve-data] Generating tables from YAML sources...');
          execSync(`python3 "${generateScript}"`, { cwd: dataDir, stdio: 'inherit' });
        }
      }
      if (existsSync(metadataScript)) {
        execSync(`python3 "${metadataScript}"`, { cwd: __dirname, stdio: 'inherit' });
      }

      // Read version and inject as define
      let version = '?';
      if (existsSync(metaPath)) {
        try {
          const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
          version = meta.version ?? '?';
        } catch { /* ignore */ }
      }

      return {
        define: {
          __APP_VERSION__: JSON.stringify(version),
        },
      };
    },
    configureServer(server) {
      server.middlewares.use('/szilankrpg/data', (req, res, next) => {
        const filePath = path.join(dataDir, req.url ?? '');
        if (existsSync(filePath)) {
          const ext = path.extname(filePath);
          const mime: Record<string, string> = { '.json': 'application/json', '.yaml': 'text/yaml', '.yml': 'text/yaml' };
          res.setHeader('Content-Type', mime[ext] ?? 'text/plain');
          createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveDataPlugin()],
  base: '/szilankrpg/',
  server: {
    host: true,
    watch: { usePolling: true, interval: 500 },
  },
});
