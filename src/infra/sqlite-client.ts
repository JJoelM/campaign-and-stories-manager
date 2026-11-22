import { createRequire } from 'node:module';
import type * as NodeSqlite from 'node:sqlite';

const require = createRequire(import.meta.url);
const sqliteRuntime = require('node:sqlite') as typeof NodeSqlite;

export type DatabaseSyncInstance = NodeSqlite.DatabaseSync;
export type StatementSyncInstance = NodeSqlite.StatementSync;

/**
 * Abre una conexión SQLite síncrona usando el módulo nativo `node:sqlite`
 * de forma compatible con ESM, tsx y Vitest/Vite.
 */
export function openSqliteDatabase(
  dbPath = ':memory:',
): DatabaseSyncInstance {
  return new sqliteRuntime.DatabaseSync(dbPath);
}
