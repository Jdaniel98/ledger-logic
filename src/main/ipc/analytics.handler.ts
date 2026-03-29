import { ipcMain } from 'electron';
import { sql, eq } from 'drizzle-orm';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { transactions, categories } from '../database/schema';
import type { SpendingTrend, CategoryBreakdownItem } from '../../shared/types/models';

export function registerAnalyticsHandlers(db: AppDatabase) {
  ipcMain.handle(
    IPC_CHANNELS.ANALYTICS_SPENDING_TRENDS,
    async (_event, months?: number) => {
      const monthCount = months ?? 6;

      // Generate month boundaries for the last N months
      const now = new Date();
      const trends: SpendingTrend[] = [];

      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const startDate = `${monthStr}-01`;
        const nextMonth = month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, '0')}-01`;

        const result = db
          .select({
            income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN COALESCE(base_amount, amount) ELSE 0 END), 0)`,
            expense: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN COALESCE(base_amount, amount) ELSE 0 END), 0)`,
          })
          .from(transactions)
          .where(sql`${transactions.date} >= ${startDate} AND ${transactions.date} < ${nextMonth}`)
          .get();

        trends.push({
          month: monthStr,
          income: result?.income ?? 0,
          expense: result?.expense ?? 0,
        });
      }

      return trends;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.ANALYTICS_CATEGORY_BREAKDOWN,
    async (_event, month: string) => {
      const startDate = `${month}-01`;
      const [year, m] = month.split('-').map(Number);
      const nextMonth = m === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(m + 1).padStart(2, '0')}-01`;

      const rows = db
        .select({
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          categoryColor: categories.color,
          amount: sql<number>`SUM(COALESCE(${transactions.baseAmount}, ${transactions.amount}))`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          sql`${transactions.date} >= ${startDate} AND ${transactions.date} < ${nextMonth} AND ${transactions.type} = 'expense'`,
        )
        .groupBy(transactions.categoryId)
        .orderBy(sql`SUM(COALESCE(${transactions.baseAmount}, ${transactions.amount})) DESC`)
        .all();

      const total = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);

      const breakdown: CategoryBreakdownItem[] = rows.map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName ?? 'Uncategorised',
        categoryColor: r.categoryColor ?? null,
        amount: r.amount ?? 0,
        percentage: total > 0 ? Math.round(((r.amount ?? 0) / total) * 1000) / 10 : 0,
      }));

      return breakdown;
    },
  );
}
