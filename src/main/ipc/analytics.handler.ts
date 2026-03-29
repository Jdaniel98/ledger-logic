import { ipcMain } from 'electron';
import { sql, eq } from 'drizzle-orm';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { transactions, categories } from '../database/schema';
import type { SpendingTrend, CategoryBreakdownItem, NetWorthPoint, DailySpending } from '../../shared/types/models';

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

  // Net worth over time: cumulative balance up to end of each month
  ipcMain.handle(
    IPC_CHANNELS.ANALYTICS_NET_WORTH,
    async (_event, months?: number) => {
      const monthCount = months ?? 6;
      const now = new Date();
      const points: NetWorthPoint[] = [];

      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // last day of month
        const endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const result = db
          .select({
            balance: sql<number>`COALESCE(
              SUM(CASE WHEN type = 'income' THEN COALESCE(base_amount, amount)
                       WHEN type = 'expense' THEN -COALESCE(base_amount, amount)
                       ELSE 0 END),
              0)`,
          })
          .from(transactions)
          .where(sql`${transactions.date} <= ${endDate}`)
          .get();

        points.push({
          month: monthStr,
          balance: result?.balance ?? 0,
        });
      }

      return points;
    },
  );

  // Daily spending for a given month
  ipcMain.handle(
    IPC_CHANNELS.ANALYTICS_DAILY_SPENDING,
    async (_event, month: string) => {
      const startDate = `${month}-01`;
      const [year, m] = month.split('-').map(Number);
      const nextMonth = m === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(m + 1).padStart(2, '0')}-01`;

      const rows = db
        .select({
          date: transactions.date,
          amount: sql<number>`SUM(COALESCE(${transactions.baseAmount}, ${transactions.amount}))`,
        })
        .from(transactions)
        .where(
          sql`${transactions.date} >= ${startDate} AND ${transactions.date} < ${nextMonth} AND ${transactions.type} = 'expense'`,
        )
        .groupBy(transactions.date)
        .all();

      const result: DailySpending[] = rows.map((r) => ({
        date: r.date,
        amount: r.amount ?? 0,
      }));

      return result;
    },
  );
}
