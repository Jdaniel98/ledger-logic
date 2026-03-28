import { ipcMain, dialog, BrowserWindow } from 'electron';
import { writeFileSync } from 'node:fs';
import { eq, and, sql, gte, lt, desc } from 'drizzle-orm';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { transactions, accounts, categories } from '../database/schema';

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function registerExportHandlers(db: AppDatabase) {
  ipcMain.handle(
    IPC_CHANNELS.EXPORT_TRANSACTIONS_CSV,
    async (_event, filters?: ExportFilters) => {
      const window = BrowserWindow.getFocusedWindow();
      if (!window) return { success: false, error: 'No active window' };

      const result = await dialog.showSaveDialog(window, {
        title: 'Export Transactions',
        defaultPath: `transactions-${new Date().toISOString().split('T')[0]}.csv`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Cancelled' };
      }

      const conditions = [];

      if (filters?.dateFrom) {
        conditions.push(gte(transactions.date, filters.dateFrom));
      }
      if (filters?.dateTo) {
        conditions.push(lt(transactions.date, filters.dateTo));
      }
      if (filters?.accountId) {
        conditions.push(eq(transactions.accountId, filters.accountId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = db
        .select({
          date: transactions.date,
          payee: transactions.payee,
          description: transactions.description,
          categoryName: categories.name,
          accountName: accounts.name,
          type: transactions.type,
          amount: transactions.amount,
          currency: transactions.currency,
          baseAmount: transactions.baseAmount,
          tags: transactions.tags,
          notes: transactions.notes,
        })
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(whereClause)
        .orderBy(desc(transactions.date))
        .all();

      const header = 'Date,Payee,Description,Category,Account,Type,Amount,Currency,Base Amount,Tags,Notes';
      const csvRows = rows.map((row) => {
        const tags = row.tags ? JSON.parse(row.tags).join('; ') : '';
        return [
          row.date ?? '',
          escapeCsvField(row.payee ?? ''),
          escapeCsvField(row.description ?? ''),
          escapeCsvField(row.categoryName ?? ''),
          escapeCsvField(row.accountName ?? ''),
          row.type ?? '',
          String(row.amount ?? 0),
          row.currency ?? '',
          row.baseAmount != null ? String(row.baseAmount) : '',
          escapeCsvField(tags),
          escapeCsvField(row.notes ?? ''),
        ].join(',');
      });

      const csv = [header, ...csvRows].join('\n');

      try {
        writeFileSync(result.filePath, csv, 'utf-8');
        return { success: true, filePath: result.filePath, count: rows.length };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  );
}
