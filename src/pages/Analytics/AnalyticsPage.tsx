import { useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, ChartLineUp } from '@phosphor-icons/react';
import { Heading, Panel, Text, Select, CurrencyDisplay, Skeleton, EmptyState, LineChart, SpendingHeatmap } from '../../components';
import type { SelectOption } from '../../components';
import { BarChart } from '../../components/BarChart/BarChart';
import { DonutChart } from '../../components/DonutChart/DonutChart';
import { useAnalyticsStore } from '../../stores/useAnalyticsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import styles from './AnalyticsPage.module.css';

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'short' });
}

export function AnalyticsPage() {
  const {
    trends, categoryBreakdown, netWorth, dailySpending,
    isLoading, fetchTrends, fetchCategoryBreakdown, fetchNetWorth, fetchDailySpending,
  } = useAnalyticsStore();
  const { settings } = useSettingsStore();
  const baseCurrency = settings.baseCurrency ?? 'GBP';
  const currentMonth = getCurrentMonth();

  useEffect(() => {
    fetchTrends(6);
    fetchCategoryBreakdown(currentMonth);
    fetchNetWorth(6);
    fetchDailySpending(currentMonth);
  }, [fetchTrends, fetchCategoryBreakdown, fetchNetWorth, fetchDailySpending, currentMonth]);

  // Bar chart data
  const barData = useMemo(() =>
    trends.map((t) => ({
      label: formatMonth(t.month),
      values: [
        { key: 'Income', value: t.income, color: 'var(--color-accent)' },
        { key: 'Expense', value: t.expense, color: 'var(--color-danger)' },
      ],
    })),
  [trends]);

  // Donut chart data
  const donutData = useMemo(() =>
    categoryBreakdown.map((c, i) => ({
      label: c.categoryName,
      value: c.amount,
      color: c.categoryColor ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    })),
  [categoryBreakdown]);

  const totalDonut = donutData.reduce((sum, d) => sum + d.value, 0);

  // Net worth line chart data
  const netWorthData = useMemo(() =>
    netWorth.map((p) => ({
      label: formatMonth(p.month),
      value: p.balance,
    })),
  [netWorth]);

  // Summary stats
  const thisMonthData = trends.find((t) => t.month === currentMonth);
  const lastMonthIdx = trends.findIndex((t) => t.month === currentMonth) - 1;
  const lastMonthData = lastMonthIdx >= 0 ? trends[lastMonthIdx] : null;

  const thisExpense = thisMonthData?.expense ?? 0;
  const lastExpense = lastMonthData?.expense ?? 0;
  const thisIncome = thisMonthData?.income ?? 0;
  const expenseDelta = lastExpense > 0 ? ((thisExpense - lastExpense) / lastExpense) * 100 : 0;

  const dayOfMonth = new Date().getDate();
  const avgDailySpend = dayOfMonth > 0 ? thisExpense / dayOfMonth : 0;

  const topCategory = categoryBreakdown[0];

  // Month options for breakdown selector
  const monthOptions: SelectOption[] = trends.map((t) => {
    const [year, month] = t.month.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return {
      value: t.month,
      label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    };
  });

  const handleBreakdownMonthChange = (month: string) => {
    fetchCategoryBreakdown(month);
    fetchDailySpending(month);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">Analytics</Heading>
      </div>

      {isLoading ? (
        <>
          <div className={styles.summaryCards}>
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
          <Skeleton variant="card" height="280px" />
        </>
      ) : trends.length === 0 && categoryBreakdown.length === 0 ? (
        <EmptyState
          icon={<ChartLineUp size={56} weight="duotone" />}
          heading="No analytics yet"
          description="Start adding transactions to see spending trends, category breakdowns, and insights about your finances."
        />
      ) : (
        <>
          {/* Summary Stats */}
          <div className={styles.summaryCards}>
            <Panel className={styles.statCard}>
              <Text size="xs" color="secondary">Spent This Month</Text>
              <CurrencyDisplay amount={thisExpense} currency={baseCurrency} size="lg" weight="bold" />
              {lastExpense > 0 && (
                <span
                  className={styles.delta}
                  data-direction={expenseDelta > 0 ? 'up' : 'down'}
                >
                  {expenseDelta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  <Text size="xs" weight="medium">
                    {Math.abs(Math.round(expenseDelta))}% vs last month
                  </Text>
                </span>
              )}
            </Panel>

            <Panel className={styles.statCard}>
              <Text size="xs" color="secondary">Income This Month</Text>
              <CurrencyDisplay amount={thisIncome} currency={baseCurrency} size="lg" weight="bold" />
            </Panel>

            <Panel className={styles.statCard}>
              <Text size="xs" color="secondary">Avg Daily Spend</Text>
              <CurrencyDisplay amount={avgDailySpend} currency={baseCurrency} size="lg" weight="bold" />
            </Panel>

            {topCategory && (
              <Panel className={styles.statCard}>
                <Text size="xs" color="secondary">Top Category</Text>
                <Text size="lg" weight="bold">{topCategory.categoryName}</Text>
                <CurrencyDisplay amount={topCategory.amount} currency={baseCurrency} size="sm" color="secondary" />
              </Panel>
            )}
          </div>

          {/* Net Worth Trend */}
          {netWorthData.length > 1 && (
            <Panel className={styles.chartSection}>
              <div className={styles.chartHeader}>
                <Text weight="semibold">Net Worth Over Time</Text>
              </div>
              <div className={styles.chartContainer}>
                <LineChart
                  data={netWorthData}
                  width={540}
                  height={220}
                  color="var(--color-success)"
                  fillGradient
                />
              </div>
            </Panel>
          )}

          {/* Income vs Expense Trend */}
          <Panel className={styles.chartSection}>
            <div className={styles.chartHeader}>
              <Text weight="semibold">Income vs Expense</Text>
            </div>
            <div className={styles.chartContainer}>
              {barData.length > 0 ? (
                <BarChart data={barData} width={540} height={260} />
              ) : (
                <Text size="sm" color="secondary">No data for the selected period</Text>
              )}
            </div>
          </Panel>

          {/* Category Breakdown */}
          <Panel className={styles.chartSection}>
            <div className={styles.chartHeader}>
              <Text weight="semibold">Category Breakdown</Text>
              {monthOptions.length > 0 && (
                <Select
                  options={monthOptions}
                  value={currentMonth}
                  onChange={handleBreakdownMonthChange}
                  size="sm"
                />
              )}
            </div>

            {donutData.length > 0 ? (
              <div className={styles.donutLayout}>
                <DonutChart
                  data={donutData}
                  size={200}
                  centerLabel={totalDonut.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                  centerSub="total"
                />
                <div className={styles.legend}>
                  {donutData.map((item) => (
                    <div key={item.label} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: item.color }} />
                      <div className={styles.legendInfo}>
                        <Text size="sm" weight="medium">{item.label}</Text>
                        <Text size="xs" color="secondary">
                          {item.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Text size="sm" color="secondary">No spending data for this month</Text>
            )}
          </Panel>

          {/* Spending Heatmap */}
          {dailySpending.length > 0 && (
            <Panel className={styles.chartSection}>
              <div className={styles.chartHeader}>
                <Text weight="semibold">Daily Spending</Text>
              </div>
              <div className={styles.heatmapContainer}>
                <SpendingHeatmap data={dailySpending} month={currentMonth} />
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
