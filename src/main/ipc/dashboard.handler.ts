import { ipcMain } from 'electron';
import { eq, and, sql, desc } from 'drizzle-orm';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type { AppDatabase } from '../database/connection';
import { transactions, accounts, categories, budgets, budgetLines } from '../database/schema';
import type {
  DashboardSummary,
  Transaction,
  OverspendCategory,
  AccountBalance,
  CategorySpending,
  NetWorthPoint,
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

export function registerDashboardHandlers(db: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.DASHBOARD_SUMMARY, async (_event, month: string) => {
    const startDate = `${month}-01`;
    const [year, mon] = month.split('-').map(Number);
    const nextMonth =
      mon === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

    // Totals for the month
    const totals = db
      .select({
        totalIncome: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN COALESCE(base_amount, amount) ELSE 0 END), 0)`,
        totalExpense: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN COALESCE(base_amount, amount) ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} < ${nextMonth}`,
        ),
      )
      .get();

    const totalIncome = totals?.totalIncome ?? 0;
    const totalExpense = totals?.totalExpense ?? 0;
    const remaining = totalIncome - totalExpense;

    // Burn rate: projected monthly spend based on days elapsed
    const today = new Date();
    const daysInMonth = new Date(year, mon, 0).getDate();
    const dayOfMonth = Math.min(today.getDate(), daysInMonth);
    const burnRate = dayOfMonth > 0 ? (totalExpense / dayOfMonth) * daysInMonth : 0;

    // Budget totals for the month
    const budgetRow = db
      .select()
      .from(budgets)
      .where(eq(budgets.month, month))
      .get();

    let budgetTotal = 0;
    let budgetSpent = 0;
    const topOverspend: OverspendCategory[] = [];
    const categoryBreakdown: CategorySpending[] = [];

    if (budgetRow) {
      const lines = db
        .select({
          categoryId: budgetLines.categoryId,
          allocated: budgetLines.amount,
          categoryName: categories.name,
          categoryColor: categories.color,
        })
        .from(budgetLines)
        .leftJoin(categories, eq(budgetLines.categoryId, categories.id))
        .where(eq(budgetLines.budgetId, budgetRow.id))
        .all();

      for (const line of lines) {
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
        budgetTotal += line.allocated;
        budgetSpent += spent;

        categoryBreakdown.push({
          categoryId: line.categoryId,
          categoryName: line.categoryName ?? 'Unknown',
          categoryColor: line.categoryColor ?? null,
          spent,
          allocated: line.allocated,
        });

        if (spent > line.allocated) {
          topOverspend.push({
            categoryId: line.categoryId,
            categoryName: line.categoryName ?? 'Unknown',
            categoryColor: line.categoryColor ?? null,
            allocated: line.allocated,
            spent,
            overspendAmount: spent - line.allocated,
          });
        }
      }

      // Sort by overspend amount descending, take top 3
      topOverspend.sort((a, b) => b.overspendAmount - a.overspendAmount);
      topOverspend.splice(3);
    }

    // Account balances
    const accountRows = db
      .select()
      .from(accounts)
      .where(eq(accounts.isArchived, 0))
      .all();

    const accountBalances: AccountBalance[] = accountRows.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type as AccountBalance['type'],
      balance: acc.balance,
      currency: acc.currency,
      sparklineData: [], // Populated below if data exists
    }));

    // Sparkline data: last 30 days of daily running balance per account
    for (const ab of accountBalances) {
      const dailyTotals = db
        .select({
          date: transactions.date,
          net: sql<number>`SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, ab.id),
            sql`${transactions.date} >= date('now', '-30 days')`,
          ),
        )
        .groupBy(transactions.date)
        .orderBy(transactions.date)
        .all();

      if (dailyTotals.length > 0) {
        // Convert daily net changes to running balance
        let runningBalance = ab.balance;
        // Work backwards from current balance
        const totalNet = dailyTotals.reduce((sum, d) => sum + (d.net ?? 0), 0);
        runningBalance = ab.balance - totalNet;

        ab.sparklineData = dailyTotals.map((d) => {
          runningBalance += d.net ?? 0;
          return runningBalance;
        });
      }
    }

    // Recent transactions (last 5)
    const recentRows = db
      .select()
      .from(transactions)
      .where(
        and(
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} < ${nextMonth}`,
        ),
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(5)
      .all();

    // Net worth over last 6 months
    const now = new Date();
    const netWorthData: NetWorthPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const nwResult = db
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

      netWorthData.push({ month: monthStr, balance: nwResult?.balance ?? 0 });
    }

    // Daily income/expense sparklines for last 7 days
    const incomeSparkline: number[] = [];
    const expenseSparkline: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const dayResult = db
        .select({
          income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN COALESCE(base_amount, amount) ELSE 0 END), 0)`,
          expense: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN COALESCE(base_amount, amount) ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(sql`${transactions.date} = ${dateStr}`)
        .get();

      incomeSparkline.push(dayResult?.income ?? 0);
      expenseSparkline.push(dayResult?.expense ?? 0);
    }

    const summary: DashboardSummary = {
      totalIncome,
      totalExpense,
      remaining,
      burnRate,
      budgetTotal,
      budgetSpent,
      topOverspend,
      accountBalances,
      categoryBreakdown,
      recentTransactions: recentRows.map(toTransactionDTO),
      netWorthData,
      incomeSparkline,
      expenseSparkline,
    };

    return summary;
  });
}
