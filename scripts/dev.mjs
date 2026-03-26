#!/usr/bin/env node

/**
 * Development launcher — bypasses electron-forge's broken Vite plugin.
 *
 * 1. Builds main + preload with esbuild JS API (injects MAIN_WINDOW_VITE_DEV_SERVER_URL)
 * 2. Starts Vite dev server for the renderer
 * 3. Launches Electron once the dev server is ready
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VITE_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${VITE_PORT}`;

// ── Helpers ──────────────────────────────────────────────────────────

const SHARED_OPTIONS = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  sourcemap: true,
  define: {
    MAIN_WINDOW_VITE_DEV_SERVER_URL: JSON.stringify(DEV_SERVER_URL),
    MAIN_WINDOW_VITE_NAME: JSON.stringify('main_window'),
  },
  external: [
    'electron',
    'electron-squirrel-startup',
    'better-sqlite3',
  ],
};

async function buildMainAndPreload() {
  await Promise.all([
    esbuild.build({
      ...SHARED_OPTIONS,
      entryPoints: [path.join(ROOT, 'src/main.ts')],
      outfile: path.join(ROOT, '.vite/build/main.js'),
    }),
    esbuild.build({
      ...SHARED_OPTIONS,
      entryPoints: [path.join(ROOT, 'src/preload.ts')],
      outfile: path.join(ROOT, '.vite/build/preload.js'),
    }),
  ]);
}

function waitForPort(port, host = 'localhost', timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const socket = createServer();
      socket.once('error', () => {
        // Port is in use — server is listening
        resolve();
      });
      socket.once('listening', () => {
        socket.close();
        if (Date.now() - start > timeout) {
          reject(new Error(`Timed out waiting for port ${port}`));
        } else {
          setTimeout(tryConnect, 300);
        }
      });
      socket.listen(port, host);
    };
    tryConnect();
  });
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n⚡ Building main + preload...\n');
  await buildMainAndPreload();

  console.log('⚡ Starting Vite dev server...\n');
  const vite = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  console.log('⚡ Waiting for Vite on port', VITE_PORT, '...\n');
  await waitForPort(VITE_PORT);

  console.log('⚡ Launching Electron...\n');
  const electron = spawn('npx', ['electron', '.vite/build/main.js'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  // When Electron exits, kill Vite and exit
  electron.on('close', (code) => {
    vite.kill();
    process.exit(code ?? 0);
  });

  // When this script is killed, clean up children
  const cleanup = () => {
    vite.kill();
    electron.kill();
    process.exit();
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('Dev launcher failed:', err);
  process.exit(1);
});
