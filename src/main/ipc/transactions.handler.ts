import { ipcMain } from 'electron';
import { eq, and, like, sql, gte, lt, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { transactions, accounts, settings } from '../database/schema';
import { getExchangeRate } from '../services/exchange-rates';
import type {
  Transaction,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  PaginatedResult,
} from '../../shared/types/models';

function toTransactionDTO(row: typeof transactions.$inferSelect): Transaction {
  return {
    id: row.id,
    accountId: row.accountId,
    categoryId: row.categoryId,
    amount: row.amount,
    type: row.type as Transaction['type'],
    description: row.description,
    payee: row.payee ?? null,
    date: row.date,
    notes: row.notes,
    tags: row.tags ? JSON.parse(row.tags) : [],
    currency: row.currency ?? null,
    baseAmount: row.baseAmount ?? null,
    receiptPath: row.receiptPath ?? null,
    isRecurring: row.isRecurring === 1,
    recurringTemplateId: row.recurringTemplateId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function recalculateAccountBalance(db: AppDatabase, accountId: string) {
  const result = db
    .select({
      balance: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.accountId, accountId))
    .get();

  const balance = result?.balance ?? 0;
  db.update(accounts)
    .set({ balance, updatedAt: Date.now() })
    .where(eq(accounts.id, accountId))
    .run();
}

function getBaseCurrency(db: AppDatabase): string {
  const row = db.select().from(settings).where(eq(settings.key, 'baseCurrency')).get();
  return row?.value ?? 'GBP';
}

async function computeBaseAmount(
  db: AppDatabase,
  amount: number,
  transactionCurrency: string | null | undefined,
  accountId: string,
): Promise<number | null> {
  const baseCurrency = getBaseCurrency(db);

  // Determine the transaction's currency: explicit, or fall back to account currency
  let currency = transactionCurrency;
  if (!currency) {
    const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
    currency = account?.currency ?? baseCurrency;
  }

  if (currency === baseCurrency) return amount;

  const rate = await getExchangeRate(db, currency, baseCurrency);
  return Math.round(amount * rate * 100) / 100;
}

export function registerTransactionsHandlers(db: AppDatabase) {
  ipcMain.handle(
    IPC_CHANNELS.TRANSACTIONS_LIST,
    async (_event, filters?: TransactionFilters) => {
      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 50;
      const offset = (page - 1) * pageSize;

      const conditions = [];

      if (filters?.accountId) {
        conditions.push(eq(transactions.accountId, filters.accountId));
      }
      if (filters?.categoryId) {
        conditions.push(eq(transactions.categoryId, filters.categoryId));
      }
      if (filters?.type) {
        conditions.push(eq(transactions.type, filters.type));
      }
      if (filters?.month) {
        // month format: 'YYYY-MM'
        const startDate = `${filters.month}-01`;
        const [year, month] = filters.month.split('-').map(Number);
        const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        conditions.push(gte(transactions.date, startDate));
        conditions.push(lt(transactions.date, nextMonth));
      }
      if (filters?.search) {
        const term = `%${filters.search}%`;
        conditions.push(
          sql`(${transactions.payee} LIKE ${term} OR ${transactions.description} LIKE ${term} OR ${transactions.notes} LIKE ${term})`,
        );
      }
      if (filters?.tags && filters.tags.length > 0) {
        // Match transactions that contain ANY of the specified tags
        const tagConditions = filters.tags.map(
          (tag) => sql`${transactions.tags} LIKE ${'%' + tag + '%'}`,
        );
        conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(transactions)
        .where(whereClause)
        .get();

      const rows = db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(desc(transactions.date), desc(transactions.createdAt))
        .limit(pageSize)
        .offset(offset)
        .all();

      const result: PaginatedResult<Transaction> = {
        data: rows.map(toTransactionDTO),
        total: countResult?.count ?? 0,
        page,
        pageSize,
      };

      return result;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.TRANSACTIONS_CREATE,
    async (_event, data: CreateTransactionData) => {
      const now = Date.now();
      const id = uuid();
      const baseAmount = await computeBaseAmount(db, data.amount, data.currency, data.accountId);

      db.insert(transactions)
        .values({
          id,
          accountId: data.accountId,
          categoryId: data.categoryId ?? null,
          amount: data.amount,
          type: data.type,
          description: data.description ?? null,
          payee: data.payee ?? null,
          date: data.date,
          notes: data.notes ?? null,
          tags: data.tags ? JSON.stringify(data.tags) : null,
          currency: data.currency ?? null,
          baseAmount,
          receiptPath: null,
          isRecurring: 0,
          recurringTemplateId: null,
          createdAt: now,
          updatedAt: now,
          syncVersion: 0,
        })
        .run();

      recalculateAccountBalance(db, data.accountId);

      const row = db.select().from(transactions).where(eq(transactions.id, id)).get();
      if (!row) throw new Error('Failed to create transaction');
      return toTransactionDTO(row);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.TRANSACTIONS_UPDATE,
    async (_event, id: string, data: UpdateTransactionData) => {
      const existing = db.select().from(transactions).where(eq(transactions.id, id)).get();
      if (!existing) throw new Error('Transaction not found');

      const now = Date.now();
      const updateValues: Record<string, unknown> = { updatedAt: now };

      if (data.accountId !== undefined) updateValues.accountId = data.accountId;
      if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
      if (data.amount !== undefined) updateValues.amount = data.amount;
      if (data.type !== undefined) updateValues.type = data.type;
      if (data.description !== undefined) updateValues.description = data.description;
      if (data.payee !== undefined) updateValues.payee = data.payee;
      if (data.date !== undefined) updateValues.date = data.date;
      if (data.notes !== undefined) updateValues.notes = data.notes;
      if (data.tags !== undefined) updateValues.tags = JSON.stringify(data.tags);
      if (data.currency !== undefined) updateValues.currency = data.currency;

      // Recompute baseAmount if amount or currency changed
      if (data.amount !== undefined || data.currency !== undefined || data.accountId !== undefined) {
        const amount = data.amount ?? existing.amount;
        const currency = data.currency !== undefined ? data.currency : existing.currency;
        const accountId = data.accountId ?? existing.accountId;
        updateValues.baseAmount = await computeBaseAmount(db, amount, currency, accountId);
      }

      db.update(transactions).set(updateValues).where(eq(transactions.id, id)).run();

      // Recalculate balance for affected accounts
      recalculateAccountBalance(db, existing.accountId);
      if (data.accountId && data.accountId !== existing.accountId) {
        recalculateAccountBalance(db, data.accountId);
      }

      const row = db.select().from(transactions).where(eq(transactions.id, id)).get();
      if (!row) throw new Error('Transaction not found');
      return toTransactionDTO(row);
    },
  );

  ipcMain.handle(IPC_CHANNELS.TRANSACTIONS_DELETE, async (_event, id: string) => {
    const existing = db.select().from(transactions).where(eq(transactions.id, id)).get();
    if (!existing) throw new Error('Transaction not found');

    db.delete(transactions).where(eq(transactions.id, id)).run();
    recalculateAccountBalance(db, existing.accountId);
  });
}
