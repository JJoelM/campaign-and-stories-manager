import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { HarnessMode } from '../harness/gemini-driver.js';
import { createThyreniaWebApp } from './app-handler.js';

function main(): void {
  const vaultPath =
    process.env.VAULT_PATH ||
    'G:/Otros ordenadores/Mi PC/Google Drive/Thyrenia';
  const mode = (process.env.HARNESS_MODE as HarnessMode) || 'replay';
  const dbPath =
    process.env.THYRENIA_DB_PATH ||
    path.resolve(process.cwd(), '.runtime', 'thyrenia.sqlite');
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const gmKeyConfigured = Boolean(process.env.GM_ACCESS_KEY);
  const aiGenerationLocked = process.env.THYRENIA_DISABLE_AI !== '0';

  const staticWebDir = path.resolve(process.cwd(), 'dist', 'web');
  const app = createThyreniaWebApp({
    vaultPath,
    mode,
    dbPath,
    aiGenerationLocked,
    staticWebDir,
  });

  const server = http.createServer(app.listener);
  server.listen(port, host, () => {
    console.log('=============================================================');
    console.log(' THYRENIA ENGINE - PLAYER WEB APP & ESTUDIO DEL GM');
    console.log('=============================================================');
    console.log(`URL Local:     http://${host}:${port}`);
    console.log(`Vault Maestro: ${path.resolve(vaultPath)}`);
    console.log(`SQLite Local:  ${path.resolve(dbPath)}`);
    console.log(`Modo Harness:  ${mode.toUpperCase()}`);
    console.log(
      `Generación IA: ${aiGenerationLocked ? 'BLOQUEADA (Modo 100% Manual)' : 'HABILITADA'}`,
    );
    console.log(
      `Clave GM:      ${gmKeyConfigured ? '[CONFIGURADA EN .ENV]' : '[CLAVE DE ACCESO ACTIVA]'}`,
    );
    console.log(
      'Tip ADR-0009:  Para compartir con tus jugadores usa Cloudflare Tunnel:',
    );
    console.log(`               cloudflared tunnel --url http://${host}:${port}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      app.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
