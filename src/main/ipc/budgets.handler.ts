import { ipcMain } from 'electron';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { budgets, budgetLines, categories, transactions } from '../database/schema';
import type {
  Budget,
  BudgetWithLines,
  BudgetLineWithActual,
  CreateBudgetData,
  UpdateBudgetLineData,
} from '../../shared/types/models';

function toBudgetDTO(row: typeof budgets.$inferSelect): Budget {
  return {
    id: row.id,
    name: row.name,
    month: row.month ?? null,
    periodType: row.periodType as Budget['periodType'],
    startDate: row.startDate,
    amount: row.amount,
    isActive: row.isActive === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getBudgetWithLines(db: AppDatabase, budgetId: string, month: string): BudgetWithLines | null {
  const budgetRow = db.select().from(budgets).where(eq(budgets.id, budgetId)).get();
  if (!budgetRow) return null;

  const startDate = `${month}-01`;
  const [year, mon] = month.split('-').map(Number);
  const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

  const lines = db
    .select({
      id: budgetLines.id,
      budgetId: budgetLines.budgetId,
      categoryId: budgetLines.categoryId,
      amount: budgetLines.amount,
      rolloverEnabled: budgetLines.rolloverEnabled,
      sortOrder: budgetLines.sortOrder,
      createdAt: budgetLines.createdAt,
      updatedAt: budgetLines.updatedAt,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(budgetLines)
    .leftJoin(categories, eq(budgetLines.categoryId, categories.id))
    .where(eq(budgetLines.budgetId, budgetId))
    .all();

  const linesWithActual: BudgetLineWithActual[] = lines.map((line) => {
    const spentResult = db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.categoryId, line.categoryId),
          eq(transactions.type, 'expense'),
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} < ${nextMonth}`,
        ),
      )
      .get();

    const spent = spentResult?.total ?? 0;

    return {
      id: line.id,
      budgetId: line.budgetId,
      categoryId: line.categoryId,
      amount: line.amount,
      rolloverEnabled: line.rolloverEnabled === 1,
      sortOrder: line.sortOrder,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
      categoryName: line.categoryName ?? 'Unknown',
      categoryIcon: line.categoryIcon ?? null,
      categoryColor: line.categoryColor ?? null,
      spent,
      remaining: line.amount - spent,
    };
  });

  return {
    ...toBudgetDTO(budgetRow),
    lines: linesWithActual,
  };
}

function getPreviousMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  if (mon === 1) return `${year - 1}-12`;
  return `${year}-${String(mon - 1).padStart(2, '0')}`;
}

function calculateRolloverForMonth(
  db: AppDatabase,
  month: string,
): Record<string, number> {
  const prevMonth = getPreviousMonth(month);
  const prevBudget = db.select().from(budgets).where(eq(budgets.month, prevMonth)).get();
  if (!prevBudget) return {};

  const prevStartDate = `${prevMonth}-01`;
  const [pYear, pMon] = prevMonth.split('-').map(Number);
  const prevNextMonth = pMon === 12
    ? `${pYear + 1}-01-01`
    : `${pYear}-${String(pMon + 1).padStart(2, '0')}-01`;

  const lines = db
    .select()
    .from(budgetLines)
    .where(
      and(
        eq(budgetLines.budgetId, prevBudget.id),
        eq(budgetLines.rolloverEnabled, 1),
      ),
    )
    .all();

  const rollovers: Record<string, number> = {};

  for (const line of lines) {
    const spentResult = db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.categoryId, line.categoryId),
          eq(transactions.type, 'expense'),
          sql`${transactions.date} >= ${prevStartDate}`,
          sql`${transactions.date} < ${prevNextMonth}`,
        ),
      )
      .get();

    const spent = spentResult?.total ?? 0;
    const surplus = line.amount - spent;
    if (surplus > 0) {
      rollovers[line.categoryId] = Math.round(surplus * 100) / 100;
    }
  }

  return rollovers;
}

export function registerBudgetsHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.BUDGETS_LIST, async (_event, month?: string) => {
    if (month) {
      const rows = db.select().from(budgets).where(eq(budgets.month, month)).all();
      return rows.map(toBudgetDTO);
    }
    const rows = db.select().from(budgets).all();
    return rows.map(toBudgetDTO);
  });

  ipcMain.handle(IPC_CHANNELS.BUDGETS_GET, async (_event, month: string) => {
    const budgetRow = db
      .select()
      .from(budgets)
      .where(eq(budgets.month, month))
      .get();

    if (!budgetRow) return null;
    return getBudgetWithLines(db, budgetRow.id, month);
  });

  ipcMain.handle(
    IPC_CHANNELS.BUDGETS_CREATE,
    async (_event, data: CreateBudgetData) => {
      const now = Date.now();
      const budgetId = uuid();
      const totalAmount = data.lines.reduce((sum, line) => sum + line.amount, 0);

      db.insert(budgets)
        .values({
          id: budgetId,
          name: data.name,
          month: data.month,
          periodType: 'monthly',
          startDate: `${data.month}-01`,
          amount: totalAmount,
          isActive: 1,
          createdAt: now,
          updatedAt: now,
          syncVersion: 0,
        })
        .run();

      for (const line of data.lines) {
        db.insert(budgetLines)
          .values({
            id: uuid(),
            budgetId,
            categoryId: line.categoryId,
            amount: line.amount,
            rolloverEnabled: line.rolloverEnabled ? 1 : 0,
            sortOrder: 0,
            createdAt: now,
            updatedAt: now,
            syncVersion: 0,
          })
          .run();
      }

      return getBudgetWithLines(db, budgetId, data.month)!;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.BUDGETS_UPDATE,
    async (_event, id: string, data: Partial<CreateBudgetData>) => {
      const existing = db.select().from(budgets).where(eq(budgets.id, id)).get();
      if (!existing) throw new Error('Budget not found');

      const now = Date.now();

      if (data.name) {
        db.update(budgets).set({ name: data.name, updatedAt: now }).where(eq(budgets.id, id)).run();
      }

      if (data.lines) {
        // Delete existing lines and recreate
        db.delete(budgetLines).where(eq(budgetLines.budgetId, id)).run();

        const totalAmount = data.lines.reduce((sum, line) => sum + line.amount, 0);
        db.update(budgets).set({ amount: totalAmount, updatedAt: now }).where(eq(budgets.id, id)).run();

        for (const line of data.lines) {
          db.insert(budgetLines)
            .values({
              id: uuid(),
              budgetId: id,
              categoryId: line.categoryId,
              amount: line.amount,
              rolloverEnabled: line.rolloverEnabled ? 1 : 0,
              sortOrder: 0,
              createdAt: now,
              updatedAt: now,
              syncVersion: 0,
            })
            .run();
        }
      }

      const month = existing.month ?? data.month ?? '';
      return getBudgetWithLines(db, id, month)!;
    },
  );

  ipcMain.handle(IPC_CHANNELS.BUDGETS_DELETE, async (_event, id: string) => {
    db.delete(budgetLines).where(eq(budgetLines.budgetId, id)).run();
    db.delete(budgets).where(eq(budgets.id, id)).run();
  });

  // Budget line individual updates
  ipcMain.handle(
    IPC_CHANNELS.BUDGET_LINES_UPDATE,
    async (_event, id: string, data: UpdateBudgetLineData) => {
      const now = Date.now();
      const updateValues: Record<string, unknown> = { updatedAt: now };

      if (data.amount !== undefined) updateValues.amount = data.amount;
      if (data.rolloverEnabled !== undefined) updateValues.rolloverEnabled = data.rolloverEnabled ? 1 : 0;
      if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder;

      db.update(budgetLines).set(updateValues).where(eq(budgetLines.id, id)).run();
    },
  );

  ipcMain.handle(IPC_CHANNELS.BUDGET_LINES_DELETE, async (_event, id: string) => {
    db.delete(budgetLines).where(eq(budgetLines.id, id)).run();
  });

  ipcMain.handle(IPC_CHANNELS.BUDGETS_GET_ROLLOVER, async (_event, month: string) => {
    return calculateRolloverForMonth(db, month);
  });
}
