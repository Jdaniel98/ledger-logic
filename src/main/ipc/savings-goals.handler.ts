import { ipcMain } from 'electron';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { savingsGoals } from '../database/schema';
import type {
  SavingsGoal,
  CreateSavingsGoalData,
  UpdateSavingsGoalData,
} from '../../shared/types/models';

function toDTO(row: typeof savingsGoals.$inferSelect): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    targetDate: row.targetDate ?? null,
    accountId: row.accountId ?? null,
    icon: row.icon ?? null,
    color: row.color ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function registerSavingsGoalsHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.SAVINGS_GOALS_LIST, async () => {
    const rows = db
      .select()
      .from(savingsGoals)
      .orderBy(desc(savingsGoals.createdAt))
      .all();
    return rows.map(toDTO);
  });

  ipcMain.handle(
    IPC_CHANNELS.SAVINGS_GOALS_CREATE,
    async (_event, data: CreateSavingsGoalData) => {
      const now = Date.now();
      const id = uuid();

      db.insert(savingsGoals)
        .values({
          id,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: 0,
          targetDate: data.targetDate ?? null,
          accountId: data.accountId ?? null,
          icon: data.icon ?? null,
          color: data.color ?? null,
          createdAt: now,
          updatedAt: now,
          syncVersion: 0,
        })
        .run();

      const row = db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
      if (!row) throw new Error('Failed to create savings goal');
      return toDTO(row);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SAVINGS_GOALS_UPDATE,
    async (_event, id: string, data: UpdateSavingsGoalData) => {
      const existing = db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
      if (!existing) throw new Error('Savings goal not found');

      const now = Date.now();
      const updateValues: Record<string, unknown> = { updatedAt: now };

      if (data.name !== undefined) updateValues.name = data.name;
      if (data.targetAmount !== undefined) updateValues.targetAmount = data.targetAmount;
      if (data.currentAmount !== undefined) updateValues.currentAmount = data.currentAmount;
      if (data.targetDate !== undefined) updateValues.targetDate = data.targetDate;
      if (data.accountId !== undefined) updateValues.accountId = data.accountId;
      if (data.icon !== undefined) updateValues.icon = data.icon;
      if (data.color !== undefined) updateValues.color = data.color;

      db.update(savingsGoals).set(updateValues).where(eq(savingsGoals.id, id)).run();

      const row = db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
      if (!row) throw new Error('Savings goal not found');
      return toDTO(row);
    },
  );

  ipcMain.handle(IPC_CHANNELS.SAVINGS_GOALS_DELETE, async (_event, id: string) => {
    const existing = db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
    if (!existing) throw new Error('Savings goal not found');
    db.delete(savingsGoals).where(eq(savingsGoals.id, id)).run();
  });
}
