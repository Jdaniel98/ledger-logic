import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from './database/connection';
import {
  accounts, categories, transactions, budgets, budgetLines,
  recurringTemplates, savingsGoals, debts, settings,
} from './database/schema';

const SNAPSHOT_VERSION = 1;
const AUTO_EXPORT_DEBOUNCE_MS = 30_000;

interface SnapshotMetadata {
  version: number;
  exportedAt: number;
  appVersion: string;
}

interface Snapshot extends SnapshotMetadata {
  tables: {
    accounts: unknown[];
    categories: unknown[];
    transactions: unknown[];
    budgets: unknown[];
    budgetLines: unknown[];
    recurringTemplates: unknown[];
    savingsGoals: unknown[];
    debts: unknown[];
    settings: unknown[];
  };
}

function getSetting(db: AppDatabase, key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

function setSetting(db: AppDatabase, key: string, value: string) {
  const now = Date.now();
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, key)).run();
  } else {
    db.insert(settings).values({ id: crypto.randomUUID(), key, value, createdAt: now, updatedAt: now }).run();
  }
}

export class SyncService {
  private db: AppDatabase;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  exportSnapshot(folderPath: string): { success: boolean; filePath?: string; error?: string } {
    try {
      const snapshot: Snapshot = {
        version: SNAPSHOT_VERSION,
        exportedAt: Date.now(),
        appVersion: '1.0.0',
        tables: {
          accounts: this.db.select().from(accounts).all(),
          categories: this.db.select().from(categories).all(),
          transactions: this.db.select().from(transactions).all(),
          budgets: this.db.select().from(budgets).all(),
          budgetLines: this.db.select().from(budgetLines).all(),
          recurringTemplates: this.db.select().from(recurringTemplates).all(),
          savingsGoals: this.db.select().from(savingsGoals).all(),
          debts: this.db.select().from(debts).all(),
          settings: this.db.select().from(settings).all(),
        },
      };

      const filePath = path.join(folderPath, 'the-ledger-backup.json');
      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

      setSetting(this.db, 'sync:lastSyncTimestamp', String(snapshot.exportedAt));

      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Export failed' };
    }
  }

  importSnapshot(folderPath: string): { success: boolean; error?: string } {
    try {
      const filePath = path.join(folderPath, 'the-ledger-backup.json');
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'No backup file found in selected folder' };
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const snapshot: Snapshot = JSON.parse(raw);

      if (snapshot.version !== SNAPSHOT_VERSION) {
        return { success: false, error: `Unsupported snapshot version: ${snapshot.version}` };
      }

      // Replace all data in a single transaction
      const rawDb = (this.db as unknown as { _: { session: { client: { exec: (sql: string) => void } } } })._.session.client;

      rawDb.exec('BEGIN TRANSACTION');
      try {
        // Clear existing data (order matters for foreign keys)
        rawDb.exec('DELETE FROM budget_lines');
        rawDb.exec('DELETE FROM budgets');
        rawDb.exec('DELETE FROM transactions');
        rawDb.exec('DELETE FROM recurring_templates');
        rawDb.exec('DELETE FROM savings_goals');
        rawDb.exec('DELETE FROM debts');
        rawDb.exec('DELETE FROM categories');
        rawDb.exec('DELETE FROM accounts');
        rawDb.exec('DELETE FROM settings');

        // Re-insert data
        this.bulkInsert(accounts, snapshot.tables.accounts);
        this.bulkInsert(categories, snapshot.tables.categories);
        this.bulkInsert(transactions, snapshot.tables.transactions);
        this.bulkInsert(budgets, snapshot.tables.budgets);
        this.bulkInsert(budgetLines, snapshot.tables.budgetLines);
        this.bulkInsert(recurringTemplates, snapshot.tables.recurringTemplates);
        this.bulkInsert(savingsGoals, snapshot.tables.savingsGoals);
        this.bulkInsert(debts, snapshot.tables.debts);
        this.bulkInsert(settings, snapshot.tables.settings);

        rawDb.exec('COMMIT');
      } catch (err) {
        rawDb.exec('ROLLBACK');
        throw err;
      }

      setSetting(this.db, 'sync:lastSyncTimestamp', String(Date.now()));

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Import failed' };
    }
  }

  checkForUpdates(folderPath: string): { hasUpdates: boolean; remoteTimestamp?: number } {
    try {
      const filePath = path.join(folderPath, 'the-ledger-backup.json');
      if (!fs.existsSync(filePath)) return { hasUpdates: false };

      const raw = fs.readFileSync(filePath, 'utf-8');
      const snapshot: SnapshotMetadata = JSON.parse(raw);

      const lastSync = getSetting(this.db, 'sync:lastSyncTimestamp');
      const lastSyncTs = lastSync ? parseInt(lastSync, 10) : 0;

      return {
        hasUpdates: snapshot.exportedAt > lastSyncTs,
        remoteTimestamp: snapshot.exportedAt,
      };
    } catch {
      return { hasUpdates: false };
    }
  }

  markDirty() {
    const folderPath = getSetting(this.db, 'syncFolderPath');
    const autoEnabled = getSetting(this.db, 'syncAutoEnabled');
    if (!folderPath || autoEnabled !== 'true') return;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.exportSnapshot(folderPath);
    }, AUTO_EXPORT_DEBOUNCE_MS);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bulkInsert(table: any, rows: unknown[]) {
    if (!rows || rows.length === 0) return;
    for (const row of rows) {
      this.db.insert(table).values(row as Record<string, unknown>).run();
    }
  }
}

let syncServiceInstance: SyncService | null = null;

export function getSyncService(): SyncService | null {
  return syncServiceInstance;
}

export function initSyncService(db: AppDatabase): SyncService {
  syncServiceInstance = new SyncService(db);
  return syncServiceInstance;
}
