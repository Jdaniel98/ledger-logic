import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';

const DB_NAME = 'ledger.db';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabase() {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), DB_NAME);
  const sqlite = new Database(dbPath);

  // Performance and safety pragmas
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  db = drizzle(sqlite, { schema });
  return db;
}

export type AppDatabase = ReturnType<typeof getDatabase>;
