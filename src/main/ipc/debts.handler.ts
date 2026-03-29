import { ipcMain } from 'electron';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { debts } from '../database/schema';
import type {
  Debt,
  CreateDebtData,
  UpdateDebtData,
} from '../../shared/types/models';

function toDTO(row: typeof debts.$inferSelect): Debt {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Debt['type'],
    principal: row.principal,
    balance: row.balance,
    interestRate: row.interestRate,
    minimumPayment: row.minimumPayment,
    dueDate: row.dueDate ?? null,
    accountId: row.accountId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function registerDebtsHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.DEBTS_LIST, async () => {
    const rows = db
      .select()
      .from(debts)
      .orderBy(desc(debts.createdAt))
      .all();
    return rows.map(toDTO);
  });

  ipcMain.handle(
    IPC_CHANNELS.DEBTS_CREATE,
    async (_event, data: CreateDebtData) => {
      const now = Date.now();
      const id = uuid();

      db.insert(debts)
        .values({
          id,
          name: data.name,
          type: data.type,
          principal: data.principal,
          balance: data.balance,
          interestRate: data.interestRate,
          minimumPayment: data.minimumPayment,
          dueDate: data.dueDate ?? null,
          accountId: data.accountId ?? null,
          createdAt: now,
          updatedAt: now,
          syncVersion: 0,
        })
        .run();

      const row = db.select().from(debts).where(eq(debts.id, id)).get();
      if (!row) throw new Error('Failed to create debt');
      return toDTO(row);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.DEBTS_UPDATE,
    async (_event, id: string, data: UpdateDebtData) => {
      const existing = db.select().from(debts).where(eq(debts.id, id)).get();
      if (!existing) throw new Error('Debt not found');

      const now = Date.now();
      const updateValues: Record<string, unknown> = { updatedAt: now };

      if (data.name !== undefined) updateValues.name = data.name;
      if (data.type !== undefined) updateValues.type = data.type;
      if (data.principal !== undefined) updateValues.principal = data.principal;
      if (data.balance !== undefined) updateValues.balance = data.balance;
      if (data.interestRate !== undefined) updateValues.interestRate = data.interestRate;
      if (data.minimumPayment !== undefined) updateValues.minimumPayment = data.minimumPayment;
      if (data.dueDate !== undefined) updateValues.dueDate = data.dueDate;
      if (data.accountId !== undefined) updateValues.accountId = data.accountId;

      db.update(debts).set(updateValues).where(eq(debts.id, id)).run();

      const row = db.select().from(debts).where(eq(debts.id, id)).get();
      if (!row) throw new Error('Debt not found');
      return toDTO(row);
    },
  );

  ipcMain.handle(IPC_CHANNELS.DEBTS_DELETE, async (_event, id: string) => {
    const existing = db.select().from(debts).where(eq(debts.id, id)).get();
    if (!existing) throw new Error('Debt not found');
    db.delete(debts).where(eq(debts.id, id)).run();
  });
}
