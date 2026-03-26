import { ipcMain } from 'electron';
import { eq, and, lte, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { recurringTemplates, transactions, accounts } from '../database/schema';
import type {
  RecurringTemplate,
  CreateRecurringTemplateData,
  UpdateRecurringTemplateData,
} from '../../shared/types/models';

function toRecurringDTO(row: typeof recurringTemplates.$inferSelect): RecurringTemplate {
  return {
    id: row.id,
    accountId: row.accountId,
    categoryId: row.categoryId,
    amount: row.amount,
    type: row.type as RecurringTemplate['type'],
    description: row.description,
    payee: row.payee ?? null,
    amountType: (row.amountType ?? 'fixed') as RecurringTemplate['amountType'],
    frequency: row.frequency as RecurringTemplate['frequency'],
    startDate: row.startDate,
    endDate: row.endDate,
    nextDueDate: row.nextDueDate,
    isActive: row.isActive === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function advanceDate(date: string, frequency: string): string {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

function recalculateAccountBalance(db: AppDatabase, accountId: string) {
  const result = db
    .select({
      balance: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.accountId, accountId))
    .get();

  db.update(accounts)
    .set({ balance: result?.balance ?? 0, updatedAt: Date.now() })
    .where(eq(accounts.id, accountId))
    .run();
}

export function generateDueRecurring(db: AppDatabase): number {
  const today = new Date().toISOString().split('T')[0];
  const dueTemplates = db
    .select()
    .from(recurringTemplates)
    .where(
      and(
        eq(recurringTemplates.isActive, 1),
        lte(recurringTemplates.nextDueDate, today),
      ),
    )
    .all();

  let generated = 0;
  const affectedAccounts = new Set<string>();

  for (const template of dueTemplates) {
    if (template.amountType === 'variable') continue;

    let currentDueDate = template.nextDueDate!;

    while (currentDueDate <= today) {
      const now = Date.now();
      db.insert(transactions)
        .values({
          id: uuid(),
          accountId: template.accountId,
          categoryId: template.categoryId,
          amount: template.amount,
          type: template.type,
          description: template.description,
          payee: template.payee,
          date: currentDueDate,
          notes: null,
          tags: null,
          currency: null,
          baseAmount: null,
          receiptPath: null,
          isRecurring: 1,
          recurringTemplateId: template.id,
          createdAt: now,
          updatedAt: now,
          syncVersion: 0,
        })
        .run();

      generated++;
      affectedAccounts.add(template.accountId);
      currentDueDate = advanceDate(currentDueDate, template.frequency);
    }

    const updateValues: Record<string, unknown> = {
      nextDueDate: currentDueDate,
      updatedAt: Date.now(),
    };

    if (template.endDate && currentDueDate > template.endDate) {
      updateValues.isActive = 0;
    }

    db.update(recurringTemplates)
      .set(updateValues)
      .where(eq(recurringTemplates.id, template.id))
      .run();
  }

  for (const accountId of affectedAccounts) {
    recalculateAccountBalance(db, accountId);
  }

  return generated;
}

export function registerRecurringHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.RECURRING_LIST, async () => {
    const rows = db.select().from(recurringTemplates).all();
    return rows.map(toRecurringDTO);
  });

  ipcMain.handle(
    IPC_CHANNELS.RECURRING_CREATE,
    async (_event, data: CreateRecurringTemplateData) => {
      const now = Date.now();
      const id = uuid();

      db.insert(recurringTemplates)
        .values({
          id,
          accountId: data.accountId,
          categoryId: data.categoryId ?? null,
          amount: data.amount,
          type: data.type,
          description: data.description ?? null,
          payee: data.payee ?? null,
          amountType: data.amountType ?? 'fixed',
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate ?? null,
          nextDueDate: data.startDate,
          isActive: 1,
          createdAt: now,
          updatedAt: now,
          syncVersion: 0,
        })
        .run();

      const row = db.select().from(recurringTemplates).where(eq(recurringTemplates.id, id)).get();
      if (!row) throw new Error('Failed to create recurring template');
      return toRecurringDTO(row);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.RECURRING_UPDATE,
    async (_event, id: string, data: UpdateRecurringTemplateData) => {
      const now = Date.now();
      const updateValues: Record<string, unknown> = { updatedAt: now };

      if (data.accountId !== undefined) updateValues.accountId = data.accountId;
      if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
      if (data.amount !== undefined) updateValues.amount = data.amount;
      if (data.type !== undefined) updateValues.type = data.type;
      if (data.description !== undefined) updateValues.description = data.description;
      if (data.payee !== undefined) updateValues.payee = data.payee;
      if (data.amountType !== undefined) updateValues.amountType = data.amountType;
      if (data.frequency !== undefined) updateValues.frequency = data.frequency;
      if (data.startDate !== undefined) updateValues.startDate = data.startDate;
      if (data.endDate !== undefined) updateValues.endDate = data.endDate;
      if (data.isActive !== undefined) updateValues.isActive = data.isActive ? 1 : 0;

      db.update(recurringTemplates).set(updateValues).where(eq(recurringTemplates.id, id)).run();

      const row = db.select().from(recurringTemplates).where(eq(recurringTemplates.id, id)).get();
      if (!row) throw new Error('Recurring template not found');
      return toRecurringDTO(row);
    },
  );

  ipcMain.handle(IPC_CHANNELS.RECURRING_DELETE, async (_event, id: string) => {
    db.delete(recurringTemplates).where(eq(recurringTemplates.id, id)).run();
  });

  ipcMain.handle(IPC_CHANNELS.RECURRING_GENERATE, async () => {
    return generateDueRecurring(db);
  });
}
