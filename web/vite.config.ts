import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createReadStream, existsSync } from 'fs';
import type { Plugin } from 'vite';

function serveDataPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, '../data');
  return {
    name: 'serve-data',
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
  server: { host: true },
});
